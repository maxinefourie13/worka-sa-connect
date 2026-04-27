import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { MY_PROVIDER, MOCK_KLAP_EVENTS, type ProviderProfile, type KlapEvent } from "./mockData";

interface KlapStore {
  provider: ProviderProfile;
  events: KlapEvent[];
  klapJob: (jobId: string, jobTitle: string) => { ok: boolean; reason?: "empty" };
  topUp: (klaps: number) => void;
  toggleUrgentAlerts: () => void;
  setTier: (tier: ProviderProfile["tier"]) => void;
}

const Ctx = createContext<KlapStore | null>(null);

export const KlapProvider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<ProviderProfile>(MY_PROVIDER);
  const [events, setEvents] = useState<KlapEvent[]>(MOCK_KLAP_EVENTS);

  const value = useMemo<KlapStore>(() => ({
    provider,
    events,
    klapJob: (jobId, jobTitle) => {
      if (provider.klapsRemaining <= 0) return { ok: false, reason: "empty" };
      setProvider((p) => ({ ...p, klapsRemaining: p.klapsRemaining - 1 }));
      setEvents((evts) => [
        { id: `k-${Date.now()}`, jobId, jobTitle, cost: 1, timestamp: "Just now", outcome: "pending" },
        ...evts,
      ]);
      return { ok: true };
    },
    topUp: (klaps) => setProvider((p) => ({ ...p, klapsRemaining: p.klapsRemaining + klaps })),
    toggleUrgentAlerts: () => setProvider((p) => ({ ...p, urgentAlertsOptIn: !p.urgentAlertsOptIn })),
    setTier: (tier) => setProvider((p) => ({ ...p, tier })),
  }), [provider, events]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useKlap = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useKlap must be used within KlapProvider");
  return v;
};
