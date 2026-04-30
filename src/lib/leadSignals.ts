/**
 * Helpers for computing lead "freshness" + competition signals shown
 * on the Pro lead feed. Built to fight the "Ghost Lead" / "stale lead" gripe.
 */

export type FreshnessTier = "fresh" | "warm" | "cooling" | "stale";

export interface FreshnessSignal {
  tier: FreshnessTier;
  /** Short label like "Just posted" or "4 min ago". */
  label: string;
  /** Tailwind classes for the badge. */
  badgeClass: string;
  /** Single emoji prefix used in the badge. */
  dot: string;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function freshnessFromIso(iso: string | undefined | null, fallbackLabel = "recently"): FreshnessSignal {
  if (!iso) {
    return {
      tier: "warm",
      label: `Posted ${fallbackLabel}`,
      badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
      dot: "🟡",
    };
  }
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 15 * MINUTE) {
    return {
      tier: "fresh",
      label: ms < MINUTE ? "Just posted" : `${Math.floor(ms / MINUTE)} min ago`,
      badgeClass: "bg-primary/15 text-primary border-primary/30",
      dot: "🔥",
    };
  }
  if (ms < 2 * HOUR) {
    return {
      tier: "fresh",
      label: ms < HOUR ? `${Math.floor(ms / MINUTE)} min ago` : `${Math.floor(ms / HOUR)}h ago`,
      badgeClass: "bg-primary/10 text-primary border-primary/25",
      dot: "🟢",
    };
  }
  if (ms < DAY) {
    return {
      tier: "warm",
      label: `${Math.floor(ms / HOUR)}h ago`,
      badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
      dot: "🟡",
    };
  }
  if (ms < 3 * DAY) {
    return {
      tier: "cooling",
      label: `${Math.floor(ms / DAY)}d ago`,
      badgeClass: "bg-secondary text-ink-2 border-border",
      dot: "⚪",
    };
  }
  return {
    tier: "stale",
    label: `${Math.floor(ms / DAY)}d ago`,
    badgeClass: "bg-secondary text-muted-foreground border-border line-through decoration-muted-foreground/40",
    dot: "💤",
  };
}

export interface CompetitionSignal {
  /** Short label e.g. "Be first to quote" or "10 quotes". */
  label: string;
  badgeClass: string;
  dot: string;
}

export function competitionSignal(applicants: number): CompetitionSignal {
  if (applicants <= 0) {
    return {
      label: "Be first to quote",
      badgeClass: "bg-primary text-primary-foreground border-primary",
      dot: "🥇",
    };
  }
  if (applicants <= 3) {
    return {
      label: `${applicants} quote${applicants === 1 ? "" : "s"} so far`,
      badgeClass: "bg-card text-foreground border-primary/30",
      dot: "✋",
    };
  }
  if (applicants <= 7) {
    return {
      label: `${applicants} quotes — competitive`,
      badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
      dot: "⚔️",
    };
  }
  return {
    label: `${applicants} quotes — saturated`,
    badgeClass: "bg-muted text-muted-foreground border-border",
    dot: "🚧",
  };
}
