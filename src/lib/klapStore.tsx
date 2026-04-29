// Klap system removed — see mem://features/pricing-model.
// This shim keeps imports compiling while we finish rewriting the UI.
// TODO: delete this file once Dashboard/ProposalModal/etc no longer reference it.
import { createContext, useContext, type ReactNode } from "react";

const stub = {
  provider: {
    id: "stub",
    businessId: "stub",
    idVerified: false,
    certifiedPro: false,
    certifications: [] as string[],
    strikes: 0 as 0 | 1 | 2 | 3,
    tier: "basic_trial" as string,
    klapsRemaining: 0,
    klapsThisMonth: 0,
    urgentAlertsOptIn: true,
  },
  events: [] as Array<{ id: string; jobId: string; jobTitle: string; cost: number; timestamp: string; outcome: "pending" | "won" | "lost" }>,
  toggleUrgentAlerts: () => {},
  placeBid: (..._args: any[]) => ({ ok: true as const, rank: 1, total: 1 }),
  previewBid: (..._args: any[]) => ({ total: 1, projectedRank: 1, topBid: 0 }),
};

const Ctx = createContext<typeof stub>(stub);
export const KlapProvider = ({ children }: { children: ReactNode }) => <Ctx.Provider value={stub}>{children}</Ctx.Provider>;
export const useKlap = () => useContext(Ctx);
