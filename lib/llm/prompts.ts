import "server-only";
import type { LoanWithContact, Archetype } from "@/lib/supabase/types";
import { SYSTEM_PROMPT_TEMPLATE } from "@/lib/ai/system-prompt";

function formatAmount(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

export function buildReminderPrompt(
  loan: LoanWithContact,
  archetype: Archetype
): { system: string; user: string } {
  const item =
    loan.kind === "money"
      ? `deuda de ${formatAmount(loan.amount_cents ?? 0, loan.currency)} por "${loan.title}"`
      : `"${loan.title}"`;

  const amount =
    loan.kind === "money"
      ? formatAmount(loan.amount_cents ?? 0, loan.currency)
      : "—";

  const daysOverdue = String(Math.max(0, loan.days_overdue));

  const system = SYSTEM_PROMPT_TEMPLATE
    .replace("{archetype}", archetype)
    .replace("{item}", item)
    .replace("{kind}", loan.kind === "money" ? "dinero" : "objeto")
    .replace("{amount}", amount)
    .replace("{relationship}", loan.contact_relationship)
    .replace("{contact_name}", loan.contact_name)
    .replace("{loaned_at}", loan.loaned_at)
    .replace("{days_overdue}", daysOverdue)
    .replace("{reminder_count}", String(loan.reminder_count));

  return { system, user: "Genera el mensaje." };
}
