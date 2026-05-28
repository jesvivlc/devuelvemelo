import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LoanCard } from "@/components/features/LoanCard";
import type { LoanWithContact } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: loans, error } = await supabase
    .from("loans_with_overdue")
    .select("*")
    .order("due_at", { ascending: true })
    .limit(20);

  if (error) {
    return (
      <p className="text-sm text-red-500">
        Error al cargar los préstamos. Inténtalo de nuevo.
      </p>
    );
  }

  const activeLoans = (loans as LoanWithContact[]).filter(
    (l) => !["resolved", "written_off"].includes(l.status)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Mis préstamos</h1>
        <Link
          href="/loans/new"
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          style={{ minHeight: "var(--min-tap)" }}
        >
          + Nuevo
        </Link>
      </div>

      {activeLoans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
          <p className="text-sm text-gray-400">No tienes préstamos activos.</p>
          <Link
            href="/loans/new"
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Registra el primero →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {activeLoans.map((loan) => (
            <li key={loan.id}>
              <LoanCard loan={loan} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
