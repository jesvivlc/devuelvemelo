import type { LoanWithContact, Tone } from "@/lib/supabase/types";

const TONE_DESCRIPTIONS: Record<Tone, string> = {
  humoristico: "con humor ligero y amigable, sin ofender",
  sarcastico: "con sarcasmo sutil, algo irónico pero sin ser agresivo",
  pasivo: "con tono pasivo-agresivo, dejando caer la indirecta claramente",
  serio: "de forma directa y seria, sin rodeos",
  profesional: "en tono formal y profesional, como si fuera un asunto de negocios",
  riguroso: "de forma muy formal y firme, dejando claro que se espera una respuesta inmediata",
};

const EXTREME_TONES: ReadonlySet<Tone> = new Set(["sarcastico", "pasivo"]);

function formatAmount(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

export function buildReminderPrompt(
  loan: LoanWithContact,
  tone: Tone
): { system: string; user: string } {
  const isExtreme = EXTREME_TONES.has(tone);
  const toneDesc = TONE_DESCRIPTIONS[tone];

  const subject =
    loan.kind === "money"
      ? `una deuda de ${formatAmount(loan.amount_cents ?? 0, loan.currency)} por "${loan.title}"`
      : `el objeto "${loan.title}"`;

  const daysOverdue = loan.days_overdue;
  const overdueText =
    daysOverdue > 0
      ? `Lleva ${daysOverdue} día${daysOverdue !== 1 ? "s" : ""} de retraso.`
      : "La fecha de devolución es hoy o en los próximos días.";

  const system = [
    "Eres un asistente que ayuda a redactar mensajes de reclamación de préstamos.",
    "Escribe el mensaje en español neutro (válido tanto para España como para Latinoamérica).",
    "El mensaje debe sonar como si lo escribiera la persona que prestó el objeto o dinero, en primera persona.",
    "Sé conciso: máximo 3-4 frases. Sin saludos formales ni despedidas largas.",
    isExtreme
      ? "IMPORTANTE: El usuario revisará y editará este mensaje antes de enviarlo. Puedes ser algo más directo."
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const user = [
    `Necesito recordarle a ${loan.contact_name} (${loan.contact_relationship}) que me devuelva ${subject}.`,
    overdueText,
    `Escribe el recordatorio ${toneDesc}.`,
  ].join(" ");

  return { system, user };
}
