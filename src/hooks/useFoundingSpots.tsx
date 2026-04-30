import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Live count of remaining Verified Pro founding spots (cap 500). */
export function useFoundingSpotsRemaining() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const { data, error } = await supabase.rpc("get_founding_spots_remaining");
      if (cancelled) return;
      if (!error && typeof data === "number") setRemaining(data);
      setLoading(false);
    };

    refresh();

    // Realtime: any change to provider_balances may shift the count.
    const channel = supabase
      .channel("founding-spots")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "provider_balances" },
        () => refresh(),
      )
      .subscribe();

    // Also poll every 60s as a safety net (subscriptions may lapse via webhook only).
    const interval = setInterval(refresh, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return { remaining, loading };
}
