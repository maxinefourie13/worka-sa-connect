import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import EarlyAccessLanding from "@/pages/EarlyAccessLanding";

const STORAGE_KEY = "sjoh_early_access_seen";

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
  const location = useLocation();

  if (new URLSearchParams(location.search).get("preview") === "early-access") {
    return <EarlyAccessLanding />;
  }

  return <>{children}</>;
};
