import { useEffect, useState } from "react";
import { Users, Copy, Check, MessageCircle, Loader2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Summary = {
  referral_code: string;
  pending_count: number;
  redeemed_count: number;
  total_free_months: number;
};

const APP_URL = "https://sjoh.co.za";

export const ReferAProCard = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_my_referral_summary");
      if (!error && data && data.length) {
        const row = data[0] as any;
        setSummary({
          referral_code: row.referral_code,
          pending_count: Number(row.pending_count ?? 0),
          redeemed_count: Number(row.redeemed_count ?? 0),
          total_free_months: Number(row.total_free_months ?? 0),
        });
      }
      setLoading(false);
    })();
  }, []);

  const referralLink = summary
    ? `${APP_URL}/register?ref=${encodeURIComponent(summary.referral_code)}`
    : "";

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Link copied. Now go forward it, boet." });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareMessage = summary
    ? `Howzit! I'm on Sjoh — it's where folks find proper service providers in SA. Sign up as a Pro with my link and we both get a free month of the Verified Pro plan: ${referralLink}`
    : "";

  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
      <div className="flex items-start gap-4 mb-5">
        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Gift className="size-6 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-extrabold text-xl tracking-tight">
            Refer a Fellow Pro
          </h3>
          <p className="text-sm text-ink-2 mt-1 leading-relaxed">
            Know another good operator who'd fit on Sjoh? Send them your code.
            When they sign up for the <strong>Verified Pro (R250/mo)</strong> plan,
            <strong> you both get a free month</strong>. No catch.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !summary ? (
        <p className="text-sm text-muted-foreground">
          Your referral code isn't ready yet. Check back in a moment.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Stat label="Pending" value={summary.pending_count} hint="signed up, not paid" />
            <Stat label="Redeemed" value={summary.redeemed_count} hint="upgraded ✓" />
            <Stat label="Free months earned" value={summary.total_free_months} hint="added to your tab" />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Your referral code
            </label>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-sm font-bold tracking-wider">
                {summary.referral_code}
              </div>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 break-all">{referralLink}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1FB855] text-white font-bold px-4 py-2.5 text-sm transition-colors"
            >
              <MessageCircle className="size-4" /> Share on WhatsApp
            </a>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              <Users className="size-4" /> Copy link to share anywhere
            </Button>
          </div>

          <div className="mt-5 rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-ink-2 leading-relaxed">
            <strong className="text-foreground">How it works:</strong> Your mate signs up using your code or link.
            The moment they pay for Verified Pro, both of your subscriptions get pushed out by 30 days.
            Refer as many as you like — every paid referral = another free month for you.
          </div>
        </>
      )}
    </div>
  );
};

const Stat = ({ label, value, hint }: { label: string; value: number; hint: string }) => (
  <div className="rounded-xl border border-border p-3 text-center">
    <div className="font-display text-2xl font-extrabold tabular-nums">{value}</div>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">{label}</div>
    <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>
  </div>
);
