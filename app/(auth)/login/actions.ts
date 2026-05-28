"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const LoginSchema = z.object({
  email: z.string().email("Introduce un email válido"),
});

export type LoginResult = { success: true } | { error: string };

export async function loginWithMagicLink(
  formData: FormData
): Promise<LoginResult> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Email inválido" };
  }

  const supabase = createClient();
  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: "No se pudo enviar el enlace. Inténtalo de nuevo." };
  }

  return { success: true };
}
