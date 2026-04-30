import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

/**
 * Shows a warning banner to a Pro whose business is hidden from the public
 * directory because it lacks a profile photo or has a bio shorter than 20 chars.
 *
 * Mirrors the filter used by the `businesses_public` view.
 */
export const ProfileVisibilityWarning = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<{ noPhoto: boolean; shortBio: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("businesses")
        .select("image_url, description")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      const noPhoto = !data.image_url || data.image_url.trim() === "";
      const shortBio = (data.description ?? "").trim().length <= 20;
      if (noPhoto || shortBio) setIssues({ noPhoto, shortBio });
      else setIssues(null);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!issues) return null;

  return (
    <div className="rounded-2xl border border-accent/40 bg-accent/5 p-4 md:p-5 flex items-start gap-3">
      <AlertTriangle className="size-5 text-accent shrink-0 mt-0.5" strokeWidth={2.5} />
      <div className="flex-1">
        <p className="font-display font-extrabold text-base">
          Your profile is currently hidden from search.
        </p>
        <p className="text-sm text-ink-2 mt-1">
          {issues.noPhoto && issues.shortBio
            ? "Upload a photo and write a bio (more than 20 characters) to go live."
            : issues.noPhoto
              ? "Upload a profile photo to go live in the directory."
              : "Add a bio (more than 20 characters) so customers know who you are."}
        </p>
        <Button asChild size="sm" className="mt-3">
          <Link to="/dashboard?section=profile">Complete your profile</Link>
        </Button>
      </div>
    </div>
  );
};
