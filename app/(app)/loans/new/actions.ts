"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/analytics";
import type { Contact } from "@/lib/supabase/types";

// ── Crear préstamo ────────────────────────────────────────────────────────────

const BaseSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").max(200),
  contact_id: z.string().uuid("Selecciona un contacto"),
  due_at: z.string().min(1, "La fecha de devolución es obligatoria"),
  description: z.string().max(500).optional(),
});

const LoanSchema = z.discriminatedUnion("kind", [
  BaseSchema.extend({ kind: z.literal("object") }),
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
  const { data: { user } } = await supabase.auth.getUser();
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

  await trackEvent(supabase, "loan_created", { kind: parsed.data.kind, loan_id: loan.id });

  redirect("/dashboard");
}

// ── Crear contacto ────────────────────────────────────────────────────────────

const ContactSchema = z.object({
  display_name: z.string().min(1, "El nombre es obligatorio").max(100),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, "Formato E.164: +34612345678")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  relationship: z.enum([
    "amigo", "familia", "cuñado", "compañero", "hermano", "vecino", "otro",
  ]),
});

export type CreateContactResult =
  | { contact: Contact }
  | { error: string };

export async function createContact(formData: FormData): Promise<CreateContactResult> {
  const raw = {
    display_name: formData.get("display_name"),
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
    relationship: formData.get("relationship"),
  };

  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Datos inválidos" };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({
      owner_id: user.id,
      display_name: parsed.data.display_name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      relationship: parsed.data.relationship,
    })
    .select()
    .single();

  if (error || !contact) {
    return { error: "No se pudo crear el contacto. Inténtalo de nuevo." };
  }

  await trackEvent(supabase, "contact_created", { contact_id: contact.id });

  return { contact: contact as Contact };
}
