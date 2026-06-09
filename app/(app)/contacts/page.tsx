import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Contact } from "@/lib/supabase/types";

export default async function ContactsPage() {
  const supabase = createClient();

  const [{ data: contacts }, { data: loanRows }] = await Promise.all([
    supabase
      .from("contacts")
      .select("*")
      .order("display_name", { ascending: true }),
    supabase
      .from("loans")
      .select("contact_id")
      .not("status", "in", "(resolved,written_off)"),
  ]);

  type LoanRow = { contact_id: string };
  const activeCounts = ((loanRows ?? []) as unknown as LoanRow[]).reduce<
    Record<string, number>
  >((acc, l) => {
    acc[l.contact_id] = (acc[l.contact_id] ?? 0) + 1;
    return acc;
  }, {});

  const typedContacts = (contacts ?? []) as unknown as Contact[];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Contactos</h1>

      {typedContacts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
          <p className="text-sm text-gray-400">No tienes contactos aún.</p>
          <Link
            href="/loans/new"
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Crea tu primer préstamo →
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {typedContacts.map((c) => {
            const active = activeCounts[c.id] ?? 0;
            return (
              <li key={c.id}>
                <Link
                  href={`/contacts/${c.id}`}
                  className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div>
                    <p className="font-medium text-gray-900">{c.display_name}</p>
                    <p className="mt-0.5 text-sm capitalize text-gray-500">
                      {c.relationship}
                    </p>
                  </div>
                  {active > 0 && (
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                      {active} activo{active !== 1 ? "s" : ""}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
