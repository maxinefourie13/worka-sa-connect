import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Sparkles, Search, UserPlus, Check, X, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SeoHead } from "@/components/SeoHead";

interface Signup {
  id: string;
  email: string;
  role: string;
  source: string | null;
  created_at: string;
  claimed_founding_spot: boolean;
}

interface SpotCount {
  role: string;
  claimed: number;
  cap: number;
  remaining: number;
}

const FoundingMembers = () => {
  const { loading: rolesLoading, isAdmin } = useUserRoles();
  const [signups, setSignups] = useState<Signup[]>([]);
  const [counts, setCounts] = useState<SpotCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"pro" | "customer">("pro");
  const [adding, setAdding] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [signupsRes, countsRes] = await Promise.all([
      supabase
        .from("early_access_signups")
        .select("id, email, role, source, created_at, claimed_founding_spot")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase.rpc("get_founding_spot_counts"),
    ]);
    if (signupsRes.data) setSignups(signupsRes.data as Signup[]);
    if (countsRes.data) setCounts(countsRes.data as SpotCount[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return signups;
    return signups.filter(
      (s) => s.email.toLowerCase().includes(q) || s.role.toLowerCase().includes(q),
    );
  }, [signups, search]);

  const proCount = counts.find((c) => c.role === "pro");
  const customerCount = counts.find((c) => c.role === "customer");

  const toggleSpot = async (signup: Signup) => {
    setBusyId(signup.id);
    const { error } = await supabase.rpc("admin_set_founding_spot", {
      _signup_id: signup.id,
      _claimed: !signup.claimed_founding_spot,
    });
    setBusyId(null);
    if (error) {
      toast({ title: "Aikona!", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: signup.claimed_founding_spot ? "Founding spot revoked" : "Founding spot granted",
      description: signup.email,
    });
    refresh();
  };

  const handleAdd = async () => {
    if (!newEmail.trim()) return;
    setAdding(true);
    const { error } = await supabase.rpc("admin_create_founding_signup", {
      _email: newEmail.trim(),
      _role: newRole,
    });
    setAdding(false);
    if (error) {
      toast({ title: "Aikona!", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Founding member added", description: newEmail });
    setNewEmail("");
    setAddOpen(false);
    refresh();
  };

  if (rolesLoading) {
    return (
      <SiteLayout>
        <div className="container py-20 flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </SiteLayout>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <SiteLayout>
      <SeoHead title="Founding members · Admin" description="Manage Sjoh founding members." />
      <div className="container py-10 md:py-14 max-w-5xl">
        <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-accent">Admin</span>
            <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight mt-2">
              Founding members
            </h1>
            <p className="text-sm text-ink-2 mt-1.5">
              Grant or revoke the 500-cap founding spot. Each spot unlocks the 1-free-proposal-per-month perk for pros.
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="gap-1.5">
            <UserPlus className="size-4" strokeWidth={2.5} /> Add manually
          </Button>
        </header>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <SpotCountCard label="Pros" count={proCount} />
          <SpotCountCard label="Customers" count={customerCount} />
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or role…"
            className="pl-10"
          />
        </div>

        <div className="border border-border rounded-xl overflow-hidden bg-card">
          {loading ? (
            <div className="p-12 flex items-center justify-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No signups match.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((s) => (
                <li key={s.id} className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{s.email}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                        {s.role}
                      </span>
                      {s.claimed_founding_spot && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                          <Sparkles className="size-3" strokeWidth={2.5} /> Founding
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Joined {new Date(s.created_at).toLocaleDateString("en-ZA")} · via {s.source ?? "form"}
                    </p>
                  </div>
                  <Button
                    onClick={() => toggleSpot(s)}
                    disabled={busyId === s.id}
                    variant={s.claimed_founding_spot ? "outline" : "default"}
                    size="sm"
                    className={cn(
                      "shrink-0 gap-1.5",
                      !s.claimed_founding_spot && "bg-accent text-accent-foreground hover:bg-accent/90",
                    )}
                  >
                    {busyId === s.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : s.claimed_founding_spot ? (
                      <><X className="size-3.5" strokeWidth={2.5} /> Revoke</>
                    ) : (
                      <><Check className="size-3.5" strokeWidth={2.5} /> Grant</>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add founding member manually</DialogTitle>
            <DialogDescription>
              Creates a new signup row already marked as a founding member. Useful for people you've onboarded directly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-ink-2 block mb-1.5">Email</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="thabo@example.co.za"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-ink-2 block mb-1.5">Role</label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as "pro" | "customer")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)} disabled={adding}>Cancel</Button>
            <Button onClick={handleAdd} disabled={adding || !newEmail.trim()} className="gap-1.5">
              {adding ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" strokeWidth={2.5} />}
              Add founding member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
};

const SpotCountCard = ({ label, count }: { label: string; count?: SpotCount }) => {
  const claimed = count?.claimed ?? 0;
  const cap = count?.cap ?? 500;
  const remaining = count?.remaining ?? 500;
  const pct = Math.round((claimed / cap) * 100);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-3xl font-extrabold tracking-tight mt-2 tabular-nums">
        {claimed} <span className="text-base text-muted-foreground font-normal">/ {cap} claimed</span>
      </p>
      <p className="text-xs text-ink-2 mt-1">{remaining} spots remaining</p>
      <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default FoundingMembers;
