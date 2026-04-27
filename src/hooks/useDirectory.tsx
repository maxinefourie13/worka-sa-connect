import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BUSINESSES, OPPORTUNITIES, type Business, type Opportunity, type Province } from "@/lib/mockData";
import { mapBusinessRow } from "@/lib/businessAdapter";

interface State<T> {
  data: T[];
  loading: boolean;
  isFallback: boolean;
}

/**
 * Live businesses from `businesses_public`. Falls back to mock seed data
 * when the table is empty so the directory never looks barren pre-launch.
 */
export function useBusinesses(): State<Business> {
  const [state, setState] = useState<State<Business>>({
    data: BUSINESSES,
    loading: true,
    isFallback: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("businesses_public")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setState({ data: BUSINESSES, loading: false, isFallback: true });
        return;
      }
      setState({ data: data.map(mapBusinessRow), loading: false, isFallback: false });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

function mapOpportunity(row: any): Opportunity {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: row.category_name,
    categorySlug: row.category_slug,
    province: row.province as Province,
    city: row.city,
    budget: Number(row.budget ?? 0),
    budgetType: (row.budget_type ?? "estimate") as Opportunity["budgetType"],
    deadline: row.deadline ?? "",
    postedAt: relative(row.created_at),
    applicants: row.applicants_count ?? 0,
    requirements: row.requirements ?? [],
    postedBy: row.posted_by_name ?? "Sjoh client",
  };
}

function relative(iso: string) {
  if (!iso) return "just now";
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days < 1) {
    const hours = Math.floor(ms / 3_600_000);
    return hours < 1 ? "just now" : `${hours}h ago`;
  }
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function useOpportunities(): State<Opportunity> {
  const [state, setState] = useState<State<Opportunity>>({
    data: OPPORTUNITIES,
    loading: true,
    isFallback: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setState({ data: OPPORTUNITIES, loading: false, isFallback: true });
        return;
      }
      setState({ data: data.map(mapOpportunity), loading: false, isFallback: false });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
