/**
 * OneSignal Web Push wrapper.
 *
 * The OneSignal SDK is loaded via a <script> tag in index.html and exposes
 * itself on `window.OneSignal`. This module wraps the few methods we need.
 */
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: any[];
  }
}

const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;

let initPromise: Promise<void> | null = null;

export function isPushConfigured(): boolean {
  return Boolean(APP_ID);
}

export function initOneSignal(): Promise<void> {
  if (initPromise) return initPromise;
  if (!APP_ID) {
    initPromise = Promise.resolve();
    return initPromise;
  }
  initPromise = new Promise<void>((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred ?? [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        await OneSignal.init({
          appId: APP_ID,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { scope: "/" },
        });
      } catch (e) {
        // Init can throw if called twice in HMR — safe to ignore.
        console.warn("[OneSignal] init", e);
      }
      resolve();
    });
  });
  return initPromise;
}

/**
 * Prompts the user for push permission and stores their player ID server-side.
 * Returns the player ID on success, null otherwise.
 */
export async function requestPushPermission(): Promise<string | null> {
  if (!APP_ID) {
    throw new Error("Push notifications aren't configured yet — Sjoh! is sorting it out.");
  }
  await initOneSignal();
  const OneSignal = window.OneSignal;
  if (!OneSignal) return null;

  // Show native permission prompt
  await OneSignal.Notifications.requestPermission();

  // Wait briefly for the subscription to materialise
  let playerId: string | null = null;
  for (let i = 0; i < 10; i++) {
    playerId = OneSignal.User?.PushSubscription?.id ?? null;
    if (playerId) break;
    await new Promise((r) => setTimeout(r, 300));
  }

  if (!playerId) return null;

  const { error } = await supabase.rpc("set_push_subscription", {
    _player_id: playerId,
    _enabled: true,
  });
  if (error) {
    console.error("[push] failed to save subscription", error);
    return null;
  }
  return playerId;
}

export async function disablePush(): Promise<void> {
  await initOneSignal();
  const OneSignal = window.OneSignal;
  if (OneSignal?.User?.PushSubscription) {
    try {
      await OneSignal.User.PushSubscription.optOut();
    } catch (e) {
      console.warn("[push] optOut", e);
    }
  }
  await supabase.rpc("set_push_subscription", { _player_id: "", _enabled: false });
}
