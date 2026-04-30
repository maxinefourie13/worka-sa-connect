import { useEffect, useState } from "react";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { compressIfImage } from "@/lib/compressImage";

interface Props {
  /** ID of an existing deal_memo for this job (pro is the current user). */
  dealMemoId: string;
  onCompleted?: () => void;
}

/**
 * Lets the Pro mark an accepted job as complete and upload a "Completion Photo"
 * as proof of service. This triggers the customer review chaser flow.
 */
export const MarkCompleteCard = ({ dealMemoId, onCompleted }: Props) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("deal_memos")
        .select("completed_at")
        .eq("id", dealMemoId)
        .maybeSingle();
      if (!cancelled && data?.completed_at) setDone(true);
    })();
    return () => { cancelled = true; };
  }, [dealMemoId]);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    let photoUrl: string | null = null;
    try {
      if (file) {
        const compressed = await compressIfImage(file);
        const ext = (compressed.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${user.id}/${dealMemoId}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase
          .storage
          .from("job-completions")
          .upload(path, compressed, { upsert: true, contentType: compressed.type });
        if (upErr) throw upErr;
        photoUrl = supabase.storage.from("job-completions").getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase.rpc("mark_deal_memo_complete", {
        _deal_memo_id: dealMemoId,
        _completion_photo_url: photoUrl,
        _completion_notes: notes || null,
      });
      if (error) throw error;
      toast({ title: "Job marked complete ✅", description: "We'll nudge the customer for a review." });
      setDone(true);
      onCompleted?.();
    } catch (e: any) {
      toast({ title: "Couldn't mark complete", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 flex items-start gap-3">
        <CheckCircle2 className="size-5 text-primary mt-0.5" />
        <div>
          <p className="font-display font-extrabold">Marked complete</p>
          <p className="text-sm text-ink-2">The customer's been asked to leave a review.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="font-display font-extrabold text-lg mb-2">Wrap it up</h3>
      <p className="text-sm text-ink-2 mb-4">
        Upload a completion photo as proof of service. The customer will be asked for a review.
      </p>

      <label className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
        <Camera className="size-5 text-muted-foreground" />
        <span className="text-sm">
          {file ? file.name : "Choose a completion photo"}
        </span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional notes (e.g. 'Replaced geyser, all working sharp')"
        className="mt-3"
        rows={3}
      />

      <Button onClick={handleSubmit} disabled={submitting} className="mt-4 w-full">
        {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
        Mark as Complete
      </Button>
    </div>
  );
};
