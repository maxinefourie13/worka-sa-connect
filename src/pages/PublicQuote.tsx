import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldCheck, FileText, Clock, XCircle } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { useDealMemo } from "@/hooks/useDealMemos";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatRand } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";
import { SeoHead } from "@/components/SeoHead";
import { QuoteRevisionRespondCard } from "@/components/QuoteRevisionRespondCard";
import { cn } from "@/lib/utils";

interface BusinessLite {
  id: string;
  name: string;
  slug: string;
  category_name: string;
  city: string;
  province: string;
}

const PublicQuote = () => {
  const { id } = useParams<{ id: string }>();
  const { session, loading: authLoading } = useAuth();
  const { memo, loading, refresh } = useDealMemo(id);
  const [business, setBusiness] = useState<BusinessLite | null>(null);
  const [accepting, setAccepting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!memo) return;
    void supabase
      .from("businesses")
      .select("id, name, slug, category_name, city, province")
      .eq("id", memo.business_id)
      .maybeSingle()
      .then(({ data }) => setBusiness((data as BusinessLite | null) ?? null));
  }, [memo]);

  if (loading || authLoading) {
    return (
      <SiteLayout>
        <div className="container py-24 text-center text-muted-foreground">Loading quote…</div>
      </SiteLayout>
    );
  }

  if (!session) {
    // Force sign-in to see the quote (per chosen security model)
    return (
      <SiteLayout>
        <SeoHead title="Sign in to view your quote · Sjoh" description="Sign in to view and accept your Sjoh quote." />
        <div className="container max-w-md py-16">
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <ShieldCheck className="size-10 mx-auto text-primary mb-3" />
            <h1 className="font-display text-2xl font-extrabold tracking-tight">Sign in to view your quote</h1>
            <p className="text-sm text-ink-2 mt-2">
              We ask everyone to sign in so quotes stay private and your Verified Review counts.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button asChild>
                <Link to="/login" state={{ from: `/quote/${id}` }}>Sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/register" state={{ from: `/quote/${id}` }}>Create an account</Link>
              </Button>
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!memo || !business) {
    return (
      <SiteLayout>
        <div className="container py-24 text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Sjoh, can't find that quote.</h1>
          <p className="text-sm text-ink-2 mt-2">It may have been cancelled or the link is wrong.</p>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block">Back to Sjoh</Link>
        </div>
      </SiteLayout>
    );
  }

  const accept = async () => {
    setAccepting(true);
    const { error } = await supabase.rpc("accept_deal_memo", { _id: memo.id });
    setAccepting(false);
    if (error) {
      toast({ title: "Couldn't accept", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Quote accepted ✓", description: "Your pro will get to work. Sort payment with them directly." });
    refresh();
  };

  const statusBadge = (() => {
    switch (memo.status) {
      case "pending":
        return <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest bg-secondary text-muted-foreground px-2.5 py-1 rounded"><Clock className="size-3" /> Awaiting accept</span>;
      case "accepted":
        return <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest bg-primary-light text-primary px-2.5 py-1 rounded"><CheckCircle2 className="size-3" /> Accepted</span>;
      case "completed":
        return <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest bg-accent/15 text-accent px-2.5 py-1 rounded"><CheckCircle2 className="size-3" /> Completed</span>;
      case "cancelled":
        return <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest bg-secondary text-muted-foreground px-2.5 py-1 rounded"><XCircle className="size-3" /> Cancelled</span>;
    }
  })();

  return (
    <SiteLayout>
      <SeoHead title={`Quote: ${memo.job_title} · Sjoh`} description={`Quote from ${business.name} on Sjoh.`} />
      <div className="container max-w-2xl py-8 sm:py-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="size-4" /> Back
        </Link>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quote from</p>
              <Link to={`/business/${business.slug}`} className="font-display text-2xl font-extrabold tracking-tight hover:text-primary">
                {business.name}
              </Link>
              <p className="text-xs text-ink-2 mt-0.5">{business.category_name} · {business.city}, {business.province}</p>
            </div>
            {statusBadge}
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Job</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">{memo.job_title}</h1>
            <p className="text-sm sm:text-base text-ink-2 leading-relaxed mt-3 whitespace-pre-wrap">{memo.scope_of_work}</p>
          </div>

          <div className="mt-6 pt-6 border-t border-border flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total</p>
            <p className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">{formatRand(memo.total_amount_zar)}</p>
          </div>

          {memo.status === "pending" && (
            <div className="mt-7 pt-7 border-t border-border">
              <Button onClick={accept} disabled={accepting} className="w-full text-base h-12 font-bold">
                {accepting ? "Accepting…" : "Accept this quote"}
              </Button>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed text-center">
                Payments happen directly between you and the pro via EFT or cash. Accepting this quote logs the job on Sjoh for your protection and allows you to leave a Verified Review later.
              </p>
            </div>
          )}

          {memo.status === "accepted" && (
            <div className="mt-7 pt-7 border-t border-border bg-primary-light/40 -mx-6 sm:-mx-8 px-6 sm:px-8 py-5 rounded-b-2xl">
              <p className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> You've accepted this quote.</p>
              <p className="text-xs text-ink-2 mt-1">Sort payment directly with {business.name}. When the job's done, they'll mark it complete and we'll buzz you for a Verified Review.</p>
            </div>
          )}

          {memo.status === "completed" && (
            <div className="mt-7 pt-7 border-t border-border">
              <Button asChild className="w-full text-base h-12 font-bold">
                <Link to={`/quote/${memo.id}/review`}><FileText className="size-4" /> Leave a Verified Review</Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Your review will carry a Verified Hire badge on {business.name}'s profile.
              </p>
            </div>
          )}

          {memo.status === "cancelled" && (
            <div className="mt-7 pt-7 border-t border-border text-center">
              <p className="text-sm text-ink-2">This quote was cancelled.</p>
            </div>
          )}
        </div>

        {memo.status === "accepted" && (
          <QuoteRevisionRespondCard dealMemoId={memo.id} onResponded={refresh} />
        )}

        <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
          <ShieldCheck className="size-3.5 inline mr-1" />
          Sjoh takes no commission. We just log the job so you can leave a Verified Review.
        </p>
      </div>
    </SiteLayout>
  );
};

export default PublicQuote;
