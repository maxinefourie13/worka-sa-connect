import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface MyBusiness {
  id: string;
  name: string;
  category_slug: string;
  city: string;
  province: string;
}

/**
 * Fetches the logged-in provider's business record (first one if they own multiple).
 * Returns `null` while loading or if the user doesn't have a business yet.
 */
export function useMyBusiness() {
  const { user } = useAuth();
  const [business, setBusiness] = useState<MyBusiness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setBusiness(null);
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, category_slug, city, province")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setBusiness((data as MyBusiness) ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { business, loading };
}
