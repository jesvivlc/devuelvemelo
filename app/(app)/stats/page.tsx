import { createClient } from "@/lib/supabase/server";
import { LOAN_CATEGORIES } from "@/lib/constants/categories";
import type { LoanCategory, Archetype } from "@/lib/supabase/types";

const ARCHETYPES: Archetype[] = [
  "cuñado", "madre", "cayetano", "abogado", "fallero", "influencer",
];

const ARCHETYPE_LABELS: Record<Archetype, string> = {
  cuñado: "El Cuñado", madre: "La Madre", cayetano: "El Cayetano",
  abogado: "El Abogado", fallero: "El Fallero", influencer: "El Influencer",
};

type LoanRow = {
  status: string; kind: string; amount_cents: number | null;
  currency: string; category: string; contact_id: string; due_at: string;
};
type ReminderRow = { tone: string };
type ContactRow = { id: string; display_name: string };

function formatCurrency(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(
    cents / 100
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className="h-1.5 rounded-full bg-indigo-500 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default async function StatsPage() {
  const supabase = createClient();

  const [{ data: rawLoans }, { data: rawReminders }, { data: rawContacts }] =
    await Promise.all([
      supabase
        .from("loans")
        .select("status, kind, amount_cents, currency, category, contact_id, due_at"),
      supabase.from("reminders").select("tone"),
      supabase.from("contacts").select("id, display_name"),
    ]);

  const loans = (rawLoans ?? []) as unknown as LoanRow[];
  const reminders = (rawReminders ?? []) as unknown as ReminderRow[];
  const contacts = (rawContacts ?? []) as unknown as ContactRow[];

  const contactMap = Object.fromEntries(contacts.map((c) => [c.id, c.display_name]));
  const today = new Date().toISOString().slice(0, 10);

  const closed = loans.filter((l) =>
    ["resolved", "written_off"].includes(l.status)
  );
  const resolved = loans.filter((l) => l.status === "resolved");
  const active = loans.filter(
    (l) => !["resolved", "written_off"].includes(l.status)
  );
  const overdue = active.filter((l) => l.due_at < today);

  const totalCirculationCents = active
    .filter((l) => l.kind === "money" && l.amount_cents != null)
    .reduce((sum, l) => sum + (l.amount_cents ?? 0), 0);

  const recoveryRate =
    loans.length > 0
      ? Math.round((resolved.length / loans.length) * 100)
      : 0;

  // Por categoría (préstamos activos)
  const byCat: Record<string, number> = {};
  for (const l of active) {
    byCat[l.category] = (byCat[l.category] ?? 0) + 1;
  }
  const catEntries = LOAN_CATEGORIES
    .map((c) => ({ ...c, count: byCat[c.id] ?? 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxCat = catEntries[0]?.count ?? 1;

  // Top deudores (préstamos activos)
  const byContact: Record<string, number> = {};
  for (const l of active) {
    byContact[l.contact_id] = (byContact[l.contact_id] ?? 0) + 1;
  }
  const topDebtors = Object.entries(byContact)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ name: contactMap[id] ?? "Desconocido", count }));
  const maxDebtor = topDebtors[0]?.count ?? 1;

  // Por arquetipo (recordatorios generados)
  const byArchetype: Record<string, number> = {};
  for (const r of reminders) {
    byArchetype[r.tone] = (byArchetype[r.tone] ?? 0) + 1;
  }
  const archetypeEntries = ARCHETYPES
    .map((a) => ({ id: a, label: ARCHETYPE_LABELS[a], count: byArchetype[a] ?? 0 }))
    .filter((a) => a.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxArch = archetypeEntries[0]?.count ?? 1;

  return (
    <div className="space-y-8">
      <h1 className="text-lg font-semibold text-gray-900">Estadísticas</h1>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Préstamos activos", value: active.length },
          { label: "Vencidos", value: overdue.length, alert: overdue.length > 0 },
          { label: "Resueltos", value: resolved.length },
          { label: "Recordatorios", value: reminders.length },
        ].map(({ label, value, alert }) => (
          <div
            key={label}
            className="rounded-xl border bg-white p-4 text-center shadow-sm"
          >
            <p
              className={`text-2xl font-bold ${
                alert ? "text-red-600" : "text-indigo-600"
              }`}
            >
              {value}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="space-y-3 rounded-xl border bg-white p-4 text-sm">
        {totalCirculationCents > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">En circulación (dinero)</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(totalCirculationCents)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Tasa de recuperación</span>
          <span className="font-semibold text-gray-900">{recoveryRate}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Total préstamos</span>
          <span className="font-semibold text-gray-900">{loans.length}</span>
        </div>
      </div>

      {/* Por categoría */}
      {catEntries.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Categorías activas
          </h2>
          <ul className="space-y-2">
            {catEntries.map((c) => (
              <li key={c.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {c.emoji} {c.label}
                  </span>
                  <span className="font-medium text-gray-900">{c.count}</span>
                </div>
                <Bar value={c.count} max={maxCat} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Top deudores */}
      {topDebtors.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Top deudores</h2>
          <ul className="space-y-2">
            {topDebtors.map(({ name, count }, i) => (
              <li key={name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {i + 1}. {name}
                  </span>
                  <span className="font-medium text-gray-900">
                    {count} activo{count !== 1 ? "s" : ""}
                  </span>
                </div>
                <Bar value={count} max={maxDebtor} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Por arquetipo */}
      {archetypeEntries.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Arquetipos más usados
          </h2>
          <ul className="space-y-2">
            {archetypeEntries.map(({ id, label, count }) => (
              <li key={id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{label}</span>
                  <span className="font-medium text-gray-900">
                    {count} vez{count !== 1 ? "es" : ""}
                  </span>
                </div>
                <Bar value={count} max={maxArch} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {loans.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-400">
          Aún no hay datos suficientes para mostrar estadísticas.
        </p>
      )}
    </div>
  );
}
