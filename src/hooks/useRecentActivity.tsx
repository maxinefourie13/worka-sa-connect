import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ActivityKind = "follow" | "reveal" | "proposal";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  label: string;
  at: string;
}

interface State {
  loading: boolean;
  items: ActivityItem[];
}

/** Recent activity feed for the pro's business: follows, contact reveals, proposals sent. */
export function useRecentActivity(businessId: string | null | undefined): State {
  const [state, setState] = useState<State>({ loading: true, items: [] });

  useEffect(() => {
    if (!businessId) {
      setState({ loading: false, items: [] });
      return;
    }
    let cancelled = false;
    (async () => {
      const [follows, reveals, proposals] = await Promise.all([
        supabase
          .from("business_follows")
          .select("id, created_at")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("contact_reveals")
          .select("id, created_at")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("proposals")
          .select("id, created_at, opportunity_id, status")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      if (cancelled) return;
      const items: ActivityItem[] = [
        ...(follows.data ?? []).map((f) => ({
          id: `f-${f.id}`,
          kind: "follow" as const,
          label: "Someone followed your business",
          at: f.created_at,
        })),
        ...(reveals.data ?? []).map((r) => ({
          id: `r-${r.id}`,
          kind: "reveal" as const,
          label: "A customer revealed your contact details",
          at: r.created_at,
        })),
        ...(proposals.data ?? []).map((p) => ({
          id: `p-${p.id}`,
          kind: "proposal" as const,
          label: `You sent a quote · ${p.status}`,
          at: p.created_at,
        })),
      ]
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, 8);
      setState({ loading: false, items });
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  return state;
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
