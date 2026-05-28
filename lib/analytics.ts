import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventType } from "@/lib/supabase/types";

export async function trackEvent(
  client: SupabaseClient,
  eventType: EventType,
  payload: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { error } = await client.from("events").insert({
      event_type: eventType,
      payload,
    });
    if (error) console.warn("[analytics] trackEvent failed:", error.message);
  } catch (err) {
    // Analytics nunca debe interrumpir el flujo principal
    console.warn("[analytics] trackEvent threw:", err);
  }
}
