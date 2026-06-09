import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LoanCard } from "@/components/features/LoanCard";
import { ContactActions } from "./ContactActions";
import type { Contact, LoanWithContact } from "@/lib/supabase/types";

export default async function ContactDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [{ data: contact }, { data: loans }] = await Promise.all([
    supabase.from("contacts").select("*").eq("id", params.id).single(),
    supabase
      .from("loans_with_overdue")
      .select("*")
      .eq("contact_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!contact) notFound();

  const c = contact as unknown as Contact;
  const allLoans = (loans ?? []) as unknown as LoanWithContact[];
  const activeLoans = allLoans.filter(
    (l) => !["resolved", "written_off"].includes(l.status)
  );
  const pastLoans = allLoans.filter((l) =>
    ["resolved", "written_off"].includes(l.status)
  );

  return (
    <div className="space-y-6">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Contactos
      </Link>

      {/* Ficha del contacto */}
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{c.display_name}</h1>
          <p className="mt-0.5 text-sm capitalize text-gray-500">{c.relationship}</p>
          {(c.phone ?? c.email) && (
            <div className="mt-2 space-y-0.5">
              {c.phone && <p className="text-sm text-gray-600">{c.phone}</p>}
              {c.email && <p className="text-sm text-gray-600">{c.email}</p>}
            </div>
          )}
        </div>
        <ContactActions contact={c} />
      </div>

      {activeLoans.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">
            Préstamos activos ({activeLoans.length})
          </h2>
          <ul className="space-y-2">
            {activeLoans.map((loan) => (
              <li key={loan.id}>
                <LoanCard loan={loan} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {pastLoans.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500">
            Historial ({pastLoans.length})
          </h2>
          <ul className="space-y-2 opacity-70">
            {pastLoans.map((loan) => (
              <li key={loan.id}>
                <LoanCard loan={loan} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {allLoans.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-400">
          No hay préstamos con este contacto aún.
        </p>
      )}
    </div>
  );
}
