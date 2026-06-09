import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Doble verificación: el middleware protege la ruta a nivel de red,
  // este check garantiza type-safety del user en el árbol de componentes.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <span className="shrink-0 font-bold text-indigo-600">
            Devuélvemelo
          </span>
          <nav className="flex flex-1 gap-4 text-sm">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              Préstamos
            </Link>
            <Link
              href="/contacts"
              className="text-gray-600 hover:text-gray-900"
            >
              Contactos
            </Link>
          </nav>
          <span className="max-w-[120px] shrink-0 truncate text-xs text-gray-400">
            {user.email}
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
