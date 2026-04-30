import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useVerifiedHiresCount(businessId: string | null | undefined) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!businessId) {
      setCount(0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.rpc("business_verified_hires_count", {
        _business_id: businessId,
      });
      if (cancelled) return;
      if (!error && typeof data === "number") setCount(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  return { count, loading };
}
