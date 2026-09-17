import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll se llama desde un Server Component donde las cookies son read-only.
            // El middleware se encarga del refresco de sesión.
          }
        },
      },
    }
  );
}

/**
 * Cliente con service_role: OMITE LA RLS. Solo para rutas que actúan sin
 * usuario (cron) o que ya han comprobado la pertenencia por su cuenta.
 *
 * Se construye con `createClient` de @supabase/supabase-js y SIN cookies, no
 * con `createServerClient` de @supabase/ssr. Con el cliente de ssr la sesión
 * de las cookies sustituye a la service_role key en la cabecera Authorization,
 * así que el privilegio dependía de quién llamase: service_role desde el cron
 * (sin cookies) y el usuario bajo RLS desde una ruta abierta en el navegador.
 * Sin cookies no hay sesión que lo sustituya y el privilegio es siempre el mismo.
 */
export function createServiceClient() {
  return createSupabaseClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
