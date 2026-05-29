import Link from "next/link";
import type { LoanWithContact } from "@/lib/supabase/types";
import { cn } from "@/components/ui/cn";

interface LoanCardProps {
  loan: LoanWithContact;
}

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

const statusConfig = {
  active: { label: "Activo", classes: "bg-blue-100 text-blue-700" },
  overdue: { label: "Vencido", classes: "bg-red-100 text-red-700" },
  reminded: { label: "Recordado", classes: "bg-yellow-100 text-yellow-700" },
  resolved: { label: "Resuelto", classes: "bg-green-100 text-green-700" },
  written_off: { label: "Cancelado", classes: "bg-gray-100 text-gray-500" },
};

export function LoanCard({ loan }: LoanCardProps) {
  const status = loan.computed_status as keyof typeof statusConfig;
  const { label, classes } = statusConfig[status] ?? statusConfig.active;

  return (
    <Link href={`/loans/${loan.id}`} className="block">
      <article
        className={cn(
          "rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
          status === "overdue" && "border-red-200"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-medium text-gray-900">{loan.title}</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {loan.contact_name} · {loan.contact_relationship}
            </p>
          </div>

          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              classes
            )}
          >
            {label}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
          {loan.kind === "money" && loan.amount_cents != null && (
            <span className="font-semibold text-gray-700">
              {formatCurrency(loan.amount_cents, loan.currency)}
            </span>
          )}

          {loan.kind === "object" && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
              Objeto
            </span>
          )}

          {loan.days_overdue > 0 && (
            <span className="text-red-500">{loan.days_overdue}d de retraso</span>
          )}
        </div>
      </article>
    </Link>
  );
}
