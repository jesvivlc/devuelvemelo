import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "./actions/logout";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <span className="shrink-0 font-bold text-indigo-600">
            Devuélvemelo
          </span>
          <nav className="flex flex-1 gap-3 text-sm">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Préstamos
            </Link>
            <Link href="/contacts" className="text-gray-600 hover:text-gray-900">
              Contactos
            </Link>
            <Link href="/stats" className="text-gray-600 hover:text-gray-900">
              Stats
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <span className="max-w-[80px] truncate text-xs text-gray-400">
              {user.email}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-2xl px-4 py-4">
        <Link href="/legal" className="text-xs text-gray-300 hover:text-gray-500">
          Aviso legal · Privacidad · Términos
        </Link>
      </footer>
    </div>
  );
}
