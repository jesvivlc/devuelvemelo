"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const UpdateContactSchema = z.object({
  display_name: z.string().min(1, "El nombre es obligatorio").max(100),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, "Formato E.164 requerido (+34612345678)")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  relationship: z.enum([
    "amigo",
    "familia",
    "cuñado",
    "compañero",
    "hermano",
    "vecino",
    "otro",
  ]),
});

export async function updateContact(
  contactId: string,
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const raw = {
    display_name: formData.get("display_name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    relationship: formData.get("relationship"),
  };

  const parsed = UpdateContactSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Datos inválidos" };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("contacts")
    .update({
      display_name: parsed.data.display_name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      relationship: parsed.data.relationship,
    })
    .eq("id", contactId)
    .eq("owner_id", user.id);

  if (error) return { error: "No se pudo guardar el contacto." };

  return { success: true };
}

export async function deleteContact(
  contactId: string
): Promise<{ error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // Bloquear si tiene préstamos activos
  const { count } = await supabase
    .from("loans")
    .select("id", { count: "exact", head: true })
    .eq("contact_id", contactId)
    .eq("owner_id", user.id)
    .not("status", "in", "(resolved,written_off)");

  if (count && count > 0) {
    return {
      error: `Este contacto tiene ${count} préstamo${count !== 1 ? "s" : ""} activo${count !== 1 ? "s" : ""}. Ciérralos antes de eliminar el contacto.`,
    };
  }

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .eq("owner_id", user.id);

  if (error) return { error: "No se pudo eliminar el contacto." };

  redirect("/contacts");
}
