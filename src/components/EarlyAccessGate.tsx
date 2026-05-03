import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import EarlyAccessLanding from "@/pages/EarlyAccessLanding";

const STORAGE_KEY = "sjoh_early_access_seen";

// Routes that should never be gated (auth flows, legal, public artefacts, unsubscribe, etc.)
const BYPASS_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/unsubscribe",
  "/email-preferences",
  "/quote/",
  "/terms",
  "/privacy",
  "/admin",
];

export const hasEarlyAccess = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

export const markEarlyAccessSeen = () => {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch { /* ignore */ }
};

export const EarlyAccessGate = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  // Don't gate while we don't yet know auth state — avoids flicker for signed-in users.
  if (loading) return <>{children}</>;

  // Signed-in users always pass and we mark them as seen so a future logout doesn't re-gate.
  if (session) {
    if (!hasEarlyAccess()) markEarlyAccessSeen();
    return <>{children}</>;
  }

  // Bypass list — never gate these routes.
  const path = location.pathname;
  if (BYPASS_PREFIXES.some((p) => path === p || path.startsWith(p))) {
    return <>{children}</>;
  }

  // Early-access landing temporarily disabled — always show the app.
  return <>{children}</>;
  // if (hasEarlyAccess()) return <>{children}</>;
  // return <EarlyAccessLanding />;
};
