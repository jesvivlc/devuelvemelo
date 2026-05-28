"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/analytics";

const BaseSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").max(200),
  contact_id: z.string().uuid("Selecciona un contacto"),
  due_at: z.string().min(1, "La fecha de devolución es obligatoria"),
  description: z.string().max(500).optional(),
});

const LoanSchema = z.discriminatedUnion("kind", [
  BaseSchema.extend({
    kind: z.literal("object"),
  }),
  BaseSchema.extend({
    kind: z.literal("money"),
    amount_cents: z.coerce
      .number({ invalid_type_error: "Introduce un importe válido" })
      .int()
      .positive("El importe debe ser mayor que cero"),
    currency: z.string().length(3).default("EUR"),
  }),
]);

export type CreateLoanResult = { success: true; loanId: string } | { error: string };

export async function createLoan(formData: FormData): Promise<CreateLoanResult> {
  const raw = {
    kind: formData.get("kind"),
    title: formData.get("title"),
    contact_id: formData.get("contact_id"),
    due_at: formData.get("due_at"),
    description: formData.get("description") || undefined,
    amount_cents: formData.get("amount_cents") || undefined,
    currency: formData.get("currency") || "EUR",
  };

  const parsed = LoanSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Datos inválidos" };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const { data: loan, error } = await supabase
    .from("loans")
    .insert({
      ...parsed.data,
      owner_id: user.id,
      loaned_at: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (error || !loan) {
    return { error: "No se pudo crear el préstamo. Inténtalo de nuevo." };
  }

  await trackEvent(supabase, "loan_created", {
    kind: parsed.data.kind,
    loan_id: loan.id,
  });

  redirect("/dashboard");
}
