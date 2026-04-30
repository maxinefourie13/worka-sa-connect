import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle2, MessageCircle, Phone, Mail, Lock, Siren, AlertTriangle } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Opp = {
  id: string;
  title: string;
  description: string | null;
  category_name: string;
  province: string;
  city: string;
  budget: number;
  is_urgent: boolean;
  attachments: Array<{ url: string; name: string; type: string }>;
  client_id: string | null;
  applicants_count: number;
  created_at: string;
  posted_by_name: string | null;
};

type Proposal = {
  id: string;
  provider_id: string;
  business_id: string;
  message: string;
  quote_amount: number | null;
  status: string;
  created_at: string;
};

type RevealedContact = {
  client_phone: string | null;
  client_email: string | null;
  contact_preference: string | null;
};

const buildWhatsAppLink = (phone: string | null, message: string) => {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "27" + digits.slice(1);
  if (!digits.startsWith("27")) digits = "27" + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [opp, setOpp] = useState<Opp | null>(null);
  const [loading, setLoading] = useState(true);
  const [myProposal, setMyProposal] = useState<Proposal | null>(null);
  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [contact, setContact] = useState<RevealedContact | null>(null);
  const [revealReason, setRevealReason] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);

  const isOwner = !!(user && opp && opp.client_id === user.id);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (user) {
        const { data: mine } = await supabase.rpc("get_my_opportunity", { _id: id });
        if (mine && mine.length) {
          if (cancelled) return;
          const row = mine[0] as any;
          setOpp({
            id: row.id, title: row.title, description: row.description,
            category_name: row.category_name, province: row.province, city: row.city,
            budget: Number(row.budget ?? 0), is_urgent: row.is_urgent,
            attachments: (row.attachments ?? []) as any,
            client_id: user.id, applicants_count: 0,
            created_at: row.created_at, posted_by_name: null,
          });
          setContact({
            client_phone: row.client_phone, client_email: row.client_email,
            contact_preference: row.contact_preference,
          });
          setRevealReason("owner");
          setLoading(false);
          return;
        }
      }
      const { data, error } = await supabase.rpc("get_opportunity_for_viewer", { _opportunity_id: id });
      if (cancelled) return;
      if (error || !data || !data.length) {
        toast({ title: "Request not found", variant: "destructive" });
        setLoading(false);
        return;
      }
      const row = data[0] as any;
      setOpp({
        id: row.id, title: row.title, description: row.description,
        category_name: row.category_name, province: row.province, city: row.city,
        budget: Number(row.budget ?? 0), is_urgent: row.is_urgent,
        attachments: (row.attachments ?? []) as any,
        client_id: null, applicants_count: row.applicants_count ?? 0,
        created_at: row.created_at, posted_by_name: row.posted_by_name,
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, user]);

  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("proposals")
        .select("id, provider_id, business_id, message, quote_amount, status, created_at")
        .eq("opportunity_id", id);
      if (cancelled || !data) return;
      setAllProposals(data as Proposal[]);
      const mine = (data as Proposal[]).find((p) => p.provider_id === user.id) ?? null;
      setMyProposal(mine);
    })();
    return () => { cancelled = true; };
  }, [id, user, accepting]);

  useEffect(() => {
    if (!user || !myProposal || isOwner) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_revealed_contact", { _proposal_id: myProposal.id });
      if (cancelled || error || !data || !data.length) return;
      const row = data[0] as any;
      if (row.revealed) {
        setContact({
          client_phone: row.client_phone, client_email: row.client_email,
          contact_preference: row.contact_preference,
        });
      }
      setRevealReason(row.reason ?? null);
    })();
    return () => { cancelled = true; };
  }, [user, myProposal, isOwner]);

  const handleAcceptQuote = async (proposalId: string) => {
    setAccepting(proposalId);
    const { error } = await supabase.rpc("accept_quote", { _proposal_id: proposalId });
    setAccepting(null);
    if (error) {
      toast({ title: "Couldn't accept this quote", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Sharp! Quote accepted.", description: "We've shared your contact with the pro." });
    setAllProposals((prev) => prev.map((p) => p.id === proposalId ? { ...p, status: "accepted" } : p));
  };

  if (authLoading || loading) {
    return (
      <SiteLayout>
        <div className="container py-24 flex justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </SiteLayout>
    );
  }

  if (!opp) {
    return (
      <SiteLayout>
        <div className="container py-24 text-center">
          <h1 className="font-display text-2xl font-extrabold">Request not found</h1>
          <Button variant="outline" className="mt-6" onClick={() => navigate("/requests")}>Back to requests</Button>
        </div>
      </SiteLayout>
    );
  }

  const acceptedProposal = allProposals.find((p) => p.status === "accepted");
  const whatsappLink = buildWhatsAppLink(
    contact?.client_phone ?? null,
    `Hi! I'm reaching out about your "${opp.title}" request on Sjoh.`,
  );

  return (
    <SiteLayout>
      <div className="container py-8 md:py-12 max-w-3xl">
        <Link to={isOwner ? "/dashboard" : "/leads"} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-4" /> {isOwner ? "Back to dashboard" : "Back to leads"}
        </Link>

        <header className="mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {isOwner ? "Your Request" : "Lead"}
            </span>
            {opp.is_urgent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/30 px-2.5 py-0.5 text-xs font-bold text-accent">
                <Siren className="size-3" strokeWidth={2.5} /> Eish! Urgent
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">{opp.title}</h1>
          <p className="mt-2 text-ink-2 text-sm">
            {opp.category_name} · {opp.city}, {opp.province} · Budget around R{opp.budget.toLocaleString("en-ZA")}
          </p>
        </header>

        <section className="bg-card border border-border rounded-2xl p-6 shadow-card mb-6">
          {opp.description ? (
            <>
              <h2 className="font-display font-bold text-lg mb-2">Job details</h2>
              <p className="text-ink-2 whitespace-pre-line leading-relaxed">{opp.description}</p>
              {opp.attachments?.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {opp.attachments.map((a, i) => (
                    a.type?.startsWith("image/") ? (
                      <a key={i} href={a.url} target="_blank" rel="noreferrer" className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                        <img src={a.url} alt={a.name} className="size-full object-cover" />
                      </a>
                    ) : (
                      <a key={i} href={a.url} target="_blank" rel="noreferrer" className="aspect-square rounded-lg border border-border bg-muted flex items-center justify-center text-xs text-ink-2 p-2 text-center break-words">
                        {a.name}
                      </a>
                    )
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-start gap-3 text-sm">
              <Lock className="size-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-1">Full details locked</div>
                <p className="text-ink-2">Verified Pros (R250/mo) can see the full description and photos. Upgrade your plan to unlock leads in your area.</p>
                <Button asChild size="sm" className="mt-3"><Link to="/pricing">See plans</Link></Button>
              </div>
            </div>
          )}
        </section>

        <section className="bg-card border border-border rounded-2xl p-6 shadow-card mb-6">
          <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" /> Contact details
          </h2>

          {isOwner ? (
            <>
              <p className="text-sm text-ink-2 mb-4">
                🛡️ We take your privacy seriously. Your contact details are never shared with businesses until you explicitly accept their quote.
              </p>
              <ContactRow label="Phone" value={contact?.client_phone} icon={Phone} />
              <ContactRow label="Email" value={contact?.client_email} icon={Mail} />
              <ContactRow label="Preferred channel" value={contact?.contact_preference} icon={MessageCircle} />
            </>
          ) : contact?.client_phone || contact?.client_email ? (
            <>
              <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3 mb-4 text-sm">
                <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-primary">
                    {revealReason === "urgent_emergency" ? "Eish! Urgent — contact unlocked" : "The customer accepted your quote"}
                  </div>
                  <p className="text-ink-2 text-xs mt-0.5">Reach out now. Sjoh doesn't take a cut — you deal direct.</p>
                </div>
              </div>
              <ContactRow label="Phone" value={contact.client_phone} icon={Phone} />
              <ContactRow label="Email" value={contact.client_email} icon={Mail} />
              <ContactRow label="Preferred" value={contact.contact_preference} icon={MessageCircle} />
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank" rel="noreferrer"
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1FB855] text-white font-bold px-4 py-3 transition-colors"
                >
                  <MessageCircle className="size-5" /> WhatsApp the customer
                </a>
              )}
            </>
          ) : (
            <div className="flex items-start gap-3 text-sm">
              <Lock className="size-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-ink-2 leading-relaxed">
                  <span className="font-semibold text-foreground">Contact details are hidden for privacy.</span><br />
                  They will be revealed instantly once the customer accepts your quote.
                </p>
                {opp.is_urgent && (
                  <p className="text-xs text-accent mt-2 font-semibold">
                    Eish! Urgent: Verified Pros (R250 + KYC) get contact unlocked the moment they send a quote.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        {user && (
          <section className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <h2 className="font-display font-bold text-lg mb-4">
              {isOwner ? `Quotes (${allProposals.length})` : "Your quote"}
            </h2>

            {isOwner ? (
              allProposals.length === 0 ? (
                <p className="text-sm text-ink-2">No quotes yet. Pros will start sending shortly.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {allProposals.map((p) => (
                    <li key={p.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="text-sm font-bold">R{Number(p.quote_amount ?? 0).toLocaleString("en-ZA")}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString("en-ZA")}
                            {p.status === "accepted" && (
                              <span className="ml-2 inline-flex items-center gap-1 text-primary font-semibold">
                                <CheckCircle2 className="size-3" /> Accepted
                              </span>
                            )}
                          </div>
                        </div>
                        {p.status !== "accepted" && !acceptedProposal && (
                          <Button
                            size="sm"
                            onClick={() => handleAcceptQuote(p.id)}
                            disabled={accepting === p.id}
                          >
                            {accepting === p.id ? <Loader2 className="size-4 animate-spin" /> : "Accept Quote"}
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-ink-2 whitespace-pre-line">{p.message}</p>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              myProposal ? (
                <div>
                  <div className="text-sm font-bold mb-1">R{Number(myProposal.quote_amount ?? 0).toLocaleString("en-ZA")}</div>
                  <p className="text-sm text-ink-2 whitespace-pre-line">{myProposal.message}</p>
                  <div className="mt-3 text-xs">
                    Status:{" "}
                    {myProposal.status === "accepted" ? (
                      <span className="text-primary font-semibold">Accepted</span>
                    ) : (
                      <span className="text-muted-foreground">Awaiting customer</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-ink-2">
                  You haven't sent a quote on this lead yet. <Link to="/leads" className="text-primary font-semibold underline">Browse the lead board</Link> to find this and send one.
                </div>
              )
            )}
          </section>
        )}

        {!user && (
          <section className="bg-card border border-border rounded-2xl p-6 text-center shadow-card">
            <AlertTriangle className="size-6 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-ink-2">Sign in to send a quote on this lead.</p>
            <Button asChild className="mt-4"><Link to="/login">Sign in</Link></Button>
          </section>
        )}
      </div>
    </SiteLayout>
  );
};

const ContactRow = ({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon: any }) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-1.5 text-sm">
      <Icon className="size-4 text-muted-foreground" />
      <span className="text-muted-foreground w-20">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
};

export default LeadDetail;
