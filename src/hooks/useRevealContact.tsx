import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface RevealedContact {
  email: string | null;
  phone: string | null;
}

/**
 * Gates email/phone behind an authenticated, rate-limited RPC.
 * Anonymous visitors no longer see contact details in the public listing read —
 * they must sign in and tap a Reveal button. Each reveal is logged so the
 * provider can see lead volume.
 */
export function useRevealContact(businessId: string | undefined) {
  const { session } = useAuth();
  const [contact, setContact] = useState<RevealedContact | null>(null);
  const [loading, setLoading] = useState(false);

  const reveal = useCallback(async () => {
    if (!businessId) return null;
    if (!session) {
      toast({
        title: "Sign in to see contact details",
        description: "We hide phone numbers and emails from anonymous visitors to keep your providers safe.",
      });
      return null;
    }
    if (contact) return contact;

    setLoading(true);
    const { data, error } = await supabase.rpc("reveal_contact", { _business_id: businessId });
    setLoading(false);

    if (error) {
      toast({
        title: "Couldn't reveal contact",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    const row = Array.isArray(data) ? data[0] : data;
    const next: RevealedContact = {
      email: row?.email ?? null,
      phone: row?.phone ?? null,
    };
    setContact(next);
    return next;
  }, [businessId, session, contact]);

  return { contact, loading, reveal, revealed: !!contact };
}
