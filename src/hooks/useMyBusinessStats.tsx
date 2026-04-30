import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MyBusinessStats {
  loading: boolean;
  followers: number;
  enquiries30d: number;
  /** Profile views — placeholder until view tracking is wired. */
  profileViews: number | null;
}

const DEFAULT: MyBusinessStats = {
  loading: true,
  followers: 0,
  enquiries30d: 0,
  profileViews: null,
};

/** Live KPIs for the signed-in pro's primary business. */
export function useMyBusinessStats(businessId: string | null | undefined): MyBusinessStats {
  const [state, setState] = useState<MyBusinessStats>(DEFAULT);

  useEffect(() => {
    if (!businessId) {
      setState({ ...DEFAULT, loading: false });
      return;
    }
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const [{ count: followers }, { count: enquiries }] = await Promise.all([
        supabase
          .from("business_follows")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId),
        supabase
          .from("contact_reveals")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .gte("created_at", since),
      ]);
      if (cancelled) return;
      setState({
        loading: false,
        followers: followers ?? 0,
        enquiries30d: enquiries ?? 0,
        profileViews: null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  return state;
}
