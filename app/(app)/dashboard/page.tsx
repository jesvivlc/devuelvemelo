import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { LoanCard } from "@/components/features/LoanCard";
import { CategoryFilter } from "./CategoryFilter";
import { StatusFilter } from "./StatusFilter";
import { ViewToggle } from "./ViewToggle";
import type { LoanWithContact } from "@/lib/supabase/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { category?: string | undefined; status?: string | undefined; view?: string | undefined };
}) {
  const supabase = createClient();
  const categoryFilter = searchParams.category;
  const statusFilter = searchParams.status;
  const viewMode = searchParams.view === "grid" ? "grid" : "list";

  let query = supabase
    .from("loans_with_overdue")
    .select("*")
    .not("status", "in", "(resolved,written_off)")
    .order("due_at", { ascending: true })
    .limit(50);

  if (categoryFilter) {
    query = query.eq("category", categoryFilter);
  }
  if (statusFilter === "overdue") {
    query = query.eq("computed_status", "overdue");
  } else if (statusFilter === "active") {
    query = query.eq("computed_status", "active");
  } else if (statusFilter === "reminded") {
    query = query.eq("status", "reminded");
  }

  const { data: activeLoans, error } = await query;

  if (error) {
    return (
      <p className="text-sm text-red-500">
        Error al cargar los préstamos. Inténtalo de nuevo.
      </p>
    );
  }

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

      <div className="flex flex-wrap items-center gap-2">
        <Suspense fallback={null}>
          <StatusFilter />
        </Suspense>
        <Suspense fallback={null}>
          <CategoryFilter />
        </Suspense>
        <div className="ml-auto">
          <Suspense fallback={null}>
            <ViewToggle />
          </Suspense>
        </div>
      </div>

      {activeLoans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
          <p className="text-sm text-gray-400">
            {categoryFilter || statusFilter
              ? "No hay préstamos que coincidan con los filtros."
              : "No tienes préstamos activos."}
          </p>
          <Link
            href="/loans/new"
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Registra el primero →
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <ul className="grid grid-cols-2 gap-3">
          {activeLoans.map((loan) => (
            <li key={loan.id}>
              <LoanCard loan={loan as LoanWithContact} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-3">
          {activeLoans.map((loan) => (
            <li key={loan.id}>
              <LoanCard loan={loan as LoanWithContact} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
