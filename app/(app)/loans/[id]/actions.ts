"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/analytics";
import type { Archetype, Channel } from "@/lib/supabase/types";

export async function resolveLoan(loanId: string): Promise<{ error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("loans")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", loanId)
    .eq("owner_id", user.id);

  if (error) return { error: "No se pudo marcar como resuelto." };

  await trackEvent(supabase, user.id, "loan_resolved", { loan_id: loanId });

  redirect("/dashboard");
}

export async function writeOffLoan(loanId: string): Promise<{ error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("loans")
    .update({ status: "written_off" })
    .eq("id", loanId)
    .eq("owner_id", user.id);

  if (error) return { error: "No se pudo cancelar el préstamo." };

  await trackEvent(supabase, user.id, "loan_written_off", { loan_id: loanId });

  redirect("/dashboard");
}

export async function trackToneSelected(
  loanId: string,
  archetype: Archetype
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await trackEvent(supabase, user.id, "tone_selected", { loan_id: loanId, archetype });
}

export async function markReminderSent(
  reminderId: string,
  channel: Channel
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await Promise.all([
    supabase
      .from("reminders")
      .update({ was_sent: true, sent_at: new Date().toISOString(), channel })
      .eq("id", reminderId)
      .eq("owner_id", user.id),
    trackEvent(supabase, user.id, "reminder_sent", {
      reminder_id: reminderId,
      channel,
    }),
  ]);
}
