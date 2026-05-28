import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateReminder } from "@/lib/llm/client";
import { trackEvent } from "@/lib/analytics";
import type { LoanWithContact } from "@/lib/supabase/types";

const RemindSchema = z.object({
  loan_id: z.string().uuid(),
  tone: z.enum([
    "humoristico",
    "sarcastico",
    "pasivo",
    "serio",
    "profesional",
    "riguroso",
  ]),
  channel: z.enum(["whatsapp", "sms", "email"]).optional(),
});

export async function POST(request: Request) {
  // Auth
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Validar body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = RemindSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Parámetros inválidos" },
      { status: 422 }
    );
  }

  const { loan_id, tone, channel } = parsed.data;

  // Obtener el préstamo y verificar ownership (defensa en profundidad además de RLS)
  const { data: loan } = await supabase
    .from("loans_with_overdue")
    .select("*")
    .eq("id", loan_id)
    .eq("owner_id", user.id)
    .single();

  if (!loan) {
    return NextResponse.json(
      { error: "Préstamo no encontrado" },
      { status: 404 }
    );
  }

  // Cooldown de 48h
  if (loan.last_reminded_at) {
    const hoursSince =
      (Date.now() - new Date(loan.last_reminded_at as string).getTime()) /
      3_600_000;
    if (hoursSince < 48) {
      return NextResponse.json(
        { error: "Cooldown activo. Espera 48h entre recordatorios." },
        { status: 429 }
      );
    }
  }

  // Generar copy
  let result: Awaited<ReturnType<typeof generateReminder>>;
  try {
    result = await generateReminder(loan as LoanWithContact, tone);
  } catch (err) {
    console.error("[llm/remind] generateReminder failed:", err);
    return NextResponse.json(
      { error: "Error al generar el mensaje. Inténtalo de nuevo." },
      { status: 502 }
    );
  }

  // Persistir el reminder y actualizar el préstamo usando el service client
  // para evitar problemas de timing con las cookies en route handlers.
  const service = createServiceClient();

  await service.from("reminders").insert({
    loan_id,
    owner_id: user.id,
    tone,
    channel: channel ?? null,
    generated_copy: result.copy,
    llm_model: "claude-haiku-4-5",
    llm_tokens_in: result.tokensIn,
    llm_tokens_out: result.tokensOut,
  });

  await service
    .from("loans")
    .update({
      reminder_count: (loan.reminder_count as number) + 1,
      last_reminded_at: new Date().toISOString(),
      status: "reminded",
    })
    .eq("id", loan_id);

  await trackEvent(service, "reminder_generated", {
    loan_id,
    tone,
    model: "claude-haiku-4-5",
    tokens_in: result.tokensIn,
    tokens_out: result.tokensOut,
  });

  return NextResponse.json({ copy: result.copy });
}
