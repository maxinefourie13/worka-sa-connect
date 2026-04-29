import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const BUMP_KEY = "sjoh:last-bump";
// Only ping the server once every 6 hours per session — cheap enough to be safe.
const COOLDOWN_MS = 6 * 60 * 60 * 1000;

/**
 * Calls the `bump_last_active` RPC at most once every 6 hours per signed-in
 * user. Keeps `businesses.last_active_at` fresh so dormancy doesn't kick in
 * on actively-used accounts. Stored in localStorage to survive route changes.
 */
export function useBumpLastActive() {
  const { user } = useAuth();
  const fired = useRef(false);

  useEffect(() => {
    if (!user || fired.current) return;
    fired.current = true;

    try {
      const last = Number(localStorage.getItem(BUMP_KEY) || "0");
      if (Date.now() - last < COOLDOWN_MS) return;
    } catch {
      // localStorage might be unavailable (private mode, etc.) — just bump.
    }

    void supabase.rpc("bump_last_active").then(({ error }) => {
      if (error) {
        // Silent — this is a best-effort background ping.
        return;
      }
      try {
        localStorage.setItem(BUMP_KEY, String(Date.now()));
      } catch {
        /* noop */
      }
    });
  }, [user]);
}
