import { supabase } from "@/integrations/supabase/client";

export type TrackedEventName =
  | "neighborhood_address_submit"
  | "neighborhood_map_tract_click"
  | "home_address_submit"
  | "home_map_address_click";

export function trackEvent(eventName: TrackedEventName, metadata: Record<string, unknown> = {}): void {
  // Fire-and-forget; never block UI.
  void (async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) return;
      await supabase.from("user_events").insert({
        user_id: userId,
        event_name: eventName,
        metadata,
      });
    } catch {
      // Swallow analytics errors silently.
    }
  })();
}
