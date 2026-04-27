import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { MY_PROVIDER, MOCK_KLAP_EVENTS, type ProviderProfile, type KlapEvent } from "./mockData";

export type BoostTier = "standard" | "boost" | "top-spot";

export const BOOST_OPTIONS: {
  id: BoostTier;
  label: string;
  cost: number;
  blurb: string;
  rank: string;
}[] = [
  { id: "standard", label: "Standard", cost: 1, blurb: "Normal placement in the client's list.", rank: "Bottom-up by time" },
  { id: "boost", label: "Boost", cost: 3, blurb: "Push your bid into the top half. ~2x more views.", rank: "Top half" },
  { id: "top-spot", label: "Top Spot", cost: 6, blurb: "Pinned #1 until someone outbids. ~5x more replies.", rank: "Pinned #1" },
];

interface KlapStore {
  provider: ProviderProfile;
  events: KlapEvent[];
  /** Bids per job, sorted by boostCost desc then time. */
  jobBids: Record<string, JobBid[]>;
  klapJob: (
    jobId: string,
    jobTitle: string,
    boost?: BoostTier,
  ) => { ok: boolean; reason?: "empty"; rank?: number; total?: number };
  topUp: (klaps: number) => void;
  toggleUrgentAlerts: () => void;
  setTier: (tier: ProviderProfile["tier"]) => void;
  /** Get current bid count + your projected rank if you bid at this boost tier. */
  previewBid: (jobId: string, boost: BoostTier) => { total: number; projectedRank: number };
}

interface JobBid {
  providerId: string;
  boostCost: number;
  at: number;
}

// Seed mock competition so the leaderboard feels real
const seedBids = (): Record<string, JobBid[]> => ({
  o1: makeBids(7, 1),
  o2: makeBids(14, 4),
  o3: makeBids(4, 0),
  o4: makeBids(9, 2),
  o5: makeBids(6, 1),
  o6: makeBids(3, 0),
  o7: makeBids(5, 1),
});

function makeBids(count: number, boosted: number): JobBid[] {
  const bids: JobBid[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    bids.push({
      providerId: `seed-${i}`,
      boostCost: i < boosted ? (i === 0 ? 6 : 3) : 1,
      at: now - i * 3600_000,
    });
  }
  return bids.sort((a, b) => b.boostCost - a.boostCost || a.at - b.at);
}

const Ctx = createContext<KlapStore | null>(null);

export const KlapProvider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<ProviderProfile>(MY_PROVIDER);
  const [events, setEvents] = useState<KlapEvent[]>(MOCK_KLAP_EVENTS);
  const [jobBids, setJobBids] = useState<Record<string, JobBid[]>>(seedBids);

  const value = useMemo<KlapStore>(() => ({
    provider,
    events,
    jobBids,
    previewBid: (jobId, boost) => {
      const opt = BOOST_OPTIONS.find((b) => b.id === boost)!;
      const current = jobBids[jobId] ?? [];
      const projected = [...current, { providerId: provider.id, boostCost: opt.cost, at: Date.now() }]
        .sort((a, b) => b.boostCost - a.boostCost || a.at - b.at);
      const rank = projected.findIndex((b) => b.providerId === provider.id) + 1;
      return { total: projected.length, projectedRank: rank };
    },
    klapJob: (jobId, jobTitle, boost = "standard") => {
      const opt = BOOST_OPTIONS.find((b) => b.id === boost)!;
      if (provider.klapsRemaining < opt.cost) return { ok: false, reason: "empty" };
      setProvider((p) => ({ ...p, klapsRemaining: p.klapsRemaining - opt.cost }));
      const newBid: JobBid = { providerId: provider.id, boostCost: opt.cost, at: Date.now() };
      const updated = [...(jobBids[jobId] ?? []), newBid]
        .sort((a, b) => b.boostCost - a.boostCost || a.at - b.at);
      setJobBids((m) => ({ ...m, [jobId]: updated }));
      const rank = updated.findIndex((b) => b.providerId === provider.id) + 1;
      const label = boost === "standard" ? "" : ` · ${opt.label}`;
      setEvents((evts) => [
        // cost stays typed as 1 in the event for compatibility; description carries detail
        { id: `k-${Date.now()}`, jobId, jobTitle: `${jobTitle}${label}`, cost: 1, timestamp: "Just now", outcome: "pending" },
        ...evts,
      ]);
      return { ok: true, rank, total: updated.length };
    },
    topUp: (klaps) => setProvider((p) => ({ ...p, klapsRemaining: p.klapsRemaining + klaps })),
    toggleUrgentAlerts: () => setProvider((p) => ({ ...p, urgentAlertsOptIn: !p.urgentAlertsOptIn })),
    setTier: (tier) => setProvider((p) => ({ ...p, tier })),
  }), [provider, events, jobBids]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useKlap = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useKlap must be used within KlapProvider");
  return v;
};
