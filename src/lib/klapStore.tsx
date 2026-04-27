import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { MY_PROVIDER, MOCK_KLAP_EVENTS, type ProviderProfile, type KlapEvent } from "./mockData";

interface KlapStore {
  provider: ProviderProfile;
  events: KlapEvent[];
  /** Bids per job, sorted by amount desc then time. */
  jobBids: Record<string, JobBid[]>;
  /** Place a bid on a job (any amount 0..balance). 0 = free proposal. */
  placeBid: (
    jobId: string,
    jobTitle: string,
    bidAmount: number,
  ) => { ok: boolean; reason?: "insufficient"; rank?: number; total?: number };
  /** Add Klaps to your existing bid on a job. */
  topUpBid: (jobId: string, additional: number) => { ok: boolean; reason?: "insufficient" | "no-bid"; newTotal?: number; rank?: number };
  topUp: (klaps: number) => void;
  toggleUrgentAlerts: () => void;
  setTier: (tier: ProviderProfile["tier"]) => void;
  /** Preview your projected rank if you bid `amount` Klaps right now. */
  previewBid: (jobId: string, amount: number) => { total: number; projectedRank: number; topBid: number };
}

interface JobBid {
  providerId: string;
  amount: number;
  at: number;
}

// Seed mock competition so the leaderboard feels real
const seedBids = (): Record<string, JobBid[]> => ({
  o1: makeBids([12, 8, 5, 3, 1, 1, 0]),
  o2: makeBids([45, 30, 22, 15, 10, 8, 5, 3, 2, 1, 1, 0, 0, 0]),
  o3: makeBids([6, 3, 1, 0]),
  o4: makeBids([20, 15, 10, 5, 3, 1, 1, 0, 0]),
  o5: makeBids([8, 5, 2, 1, 1, 0]),
  o6: makeBids([4, 2, 1]),
  o7: makeBids([10, 6, 3, 1, 0]),
});

function makeBids(amounts: number[]): JobBid[] {
  const now = Date.now();
  return amounts
    .map((amount, i) => ({ providerId: `seed-${i}`, amount, at: now - i * 3600_000 }))
    .sort((a, b) => b.amount - a.amount || a.at - b.at);
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
    previewBid: (jobId, amount) => {
      const current = jobBids[jobId] ?? [];
      const topBid = current.length ? Math.max(...current.map((b) => b.amount)) : 0;
      const projected = [...current, { providerId: provider.id, amount, at: Date.now() }]
        .sort((a, b) => b.amount - a.amount || a.at - b.at);
      const rank = projected.findIndex((b) => b.providerId === provider.id) + 1;
      return { total: projected.length, projectedRank: rank, topBid };
    },
    placeBid: (jobId, jobTitle, bidAmount) => {
      const amount = Math.max(0, Math.floor(bidAmount));
      if (amount > provider.klapsRemaining) return { ok: false, reason: "insufficient" };
      if (amount > 0) {
        setProvider((p) => ({ ...p, klapsRemaining: p.klapsRemaining - amount }));
      }
      const newBid: JobBid = { providerId: provider.id, amount, at: Date.now() };
      const updated = [...(jobBids[jobId] ?? []), newBid]
        .sort((a, b) => b.amount - a.amount || a.at - b.at);
      setJobBids((m) => ({ ...m, [jobId]: updated }));
      const rank = updated.findIndex((b) => b.providerId === provider.id) + 1;
      const label = amount > 0 ? ` · ${amount} Klap${amount > 1 ? "s" : ""}` : " · Free";
      setEvents((evts) => [
        { id: `k-${Date.now()}`, jobId, jobTitle: `${jobTitle}${label}`, cost: amount, timestamp: "Just now", outcome: "pending" },
        ...evts,
      ]);
      return { ok: true, rank, total: updated.length };
    },
    topUpBid: (jobId, additional) => {
      const add = Math.max(1, Math.floor(additional));
      if (add > provider.klapsRemaining) return { ok: false, reason: "insufficient" };
      const current = jobBids[jobId] ?? [];
      const mine = current.find((b) => b.providerId === provider.id);
      if (!mine) return { ok: false, reason: "no-bid" };
      setProvider((p) => ({ ...p, klapsRemaining: p.klapsRemaining - add }));
      const updated = current
        .map((b) => (b.providerId === provider.id ? { ...b, amount: b.amount + add, at: Date.now() } : b))
        .sort((a, b) => b.amount - a.amount || a.at - b.at);
      setJobBids((m) => ({ ...m, [jobId]: updated }));
      const newTotal = mine.amount + add;
      const rank = updated.findIndex((b) => b.providerId === provider.id) + 1;
      return { ok: true, newTotal, rank };
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
