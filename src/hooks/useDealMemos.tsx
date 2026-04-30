import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type DealMemoStatus = "pending" | "accepted" | "completed" | "cancelled";

export interface DealMemo {
  id: string;
  business_id: string;
  pro_user_id: string;
  client_user_id: string | null;
  client_email: string;
  client_phone: string | null;
  job_title: string;
  scope_of_work: string;
  total_amount_zar: number;
  status: DealMemoStatus;
  accepted_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  review_chaser_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useMyDealMemos(businessId: string | null | undefined) {
  const { user } = useAuth();
  const [memos, setMemos] = useState<DealMemo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !businessId) {
      setMemos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("deal_memos")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    setMemos((data as DealMemo[] | null) ?? []);
    setLoading(false);
  }, [user, businessId]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { memos, loading, refresh };
}

export function useDealMemo(id: string | undefined) {
  const [memo, setMemo] = useState<DealMemo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("deal_memos")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (err) setError(err.message);
    setMemo((data as DealMemo | null) ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { memo, loading, error, refresh };
}
