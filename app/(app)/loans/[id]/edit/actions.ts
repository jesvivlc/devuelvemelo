"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const UpdateSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").max(200),
  due_at: z.string().min(1, "La fecha de devolución es obligatoria"),
  description: z.string().max(500).optional(),
  category: z.enum([
    "dinero", "libros", "ropa", "herramientas", "deporte",
    "juegos", "hogar", "viaje", "mascotas", "otros",
  ]),
});

export async function updateLoan(
  loanId: string,
  formData: FormData
): Promise<{ error: string }> {
  const parsed = UpdateSchema.safeParse({
    title: formData.get("title"),
    due_at: formData.get("due_at"),
    description: formData.get("description") || undefined,
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Datos inválidos" };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: existing } = await supabase
    .from("loans")
    .select("id, kind")
    .eq("id", loanId)
    .eq("owner_id", user.id)
    .single();

  if (!existing) return { error: "Préstamo no encontrado" };

  const { error: updateError } = await supabase
    .from("loans")
    .update({
      title: parsed.data.title,
      due_at: parsed.data.due_at,
      description: parsed.data.description ?? null,
      category: parsed.data.category,
    })
    .eq("id", loanId)
    .eq("owner_id", user.id);

  if (updateError) return { error: "No se pudo guardar. Inténtalo de nuevo." };

  // Actualizar foto si se sube una nueva
  const photoFile = formData.get("photo");
  if (
    (existing.kind as string) === "object" &&
    photoFile instanceof File &&
    photoFile.size > 0
  ) {
    const ext = (photoFile.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 4);
    const path = `${user.id}/${loanId}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("loan-photos")
      .upload(path, photoFile, { contentType: photoFile.type, upsert: true });
    if (!uploadErr) {
      await supabase.from("loans").update({ photo_url: path }).eq("id", loanId);
    }
  }

  redirect(`/loans/${loanId}`);
}
