import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import sjohLogo from "@/assets/sjoh-logo.png";

interface AuthShellProps {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}

const AuthShell = ({ title, subtitle, footer, children }: AuthShellProps) => (
  <SiteLayout>
    <div className="container py-16 max-w-md">
      <Link to="/" className="inline-block mb-10" aria-label="Sjoh home">
        <img src={sjohLogo} alt="Sjoh!" className="h-24 w-auto" />
      </Link>
      <h1 className="font-display text-3xl font-medium tracking-tight">{title}</h1>
      <p className="mt-2 text-ink-2 text-sm">{subtitle}</p>
      <div className="mt-8 bg-card border border-border rounded-2xl p-6 shadow-card">
        {children}
      </div>
      <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
    </div>
  </SiteLayout>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="block text-sm font-semibold mb-1.5">{label}</span>
    {children}
  </label>
);

const Style = () => (
  <style>{`
    .input { width: 100%; padding: 0.625rem 0.875rem; background: hsl(var(--background));
      border: 1px solid hsl(var(--border)); border-radius: var(--radius);
      font-size: 0.875rem; font-family: inherit; color: hsl(var(--foreground));
      transition: border-color 0.15s, box-shadow 0.15s; }
    .input:focus { outline: none; border-color: hsl(var(--primary)); box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15); }
  `}</style>
);

const SocialButtons = () => {
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);

  const handle = async (provider: "google" | "apple") => {
    setLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({ title: "Sign-in failed", description: String(result.error), variant: "destructive" });
        setLoading(null);
        return;
      }
      if (result.redirected) return;
      // Tokens received, session set — App will react via onAuthStateChange.
      window.location.href = "/dashboard";
    } catch (e) {
      toast({ title: "Sign-in failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        size="lg"
        onClick={() => handle("google")}
        disabled={loading !== null}
      >
        {loading === "google" ? <Loader2 className="size-4 animate-spin" /> : <span className="font-bold text-base">G</span>}
        Continue with Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        size="lg"
        onClick={() => handle("apple")}
        disabled={loading !== null}
      >
        {loading === "apple" ? <Loader2 className="size-4 animate-spin" /> : <span className="font-bold text-base"></span>}
        Continue with Apple
      </Button>
    </div>
  );
};

const Divider = () => (
  <div className="relative text-center my-2">
    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
    <span className="relative bg-card px-3 text-xs text-muted-foreground uppercase tracking-widest font-semibold">or</span>
  </div>
);

// Redirect away from auth pages if already logged in
const useRedirectIfAuthed = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (!loading && session) {
      const target = (location.state as { from?: string } | null)?.from || "/dashboard";
      navigate(target, { replace: true });
    }
  }, [session, loading, navigate, location.state]);
};

export const Login = () => {
  useRedirectIfAuthed();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't log in", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Welcome back" });
    // onAuthStateChange + useRedirectIfAuthed will route us
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to manage your business and applications."
      footer={<>Don't have an account? <Link to="/register" className="text-primary font-semibold hover:underline">Register</Link></>}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Email">
          <input type="email" required className="input" placeholder="you@business.co.za" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <input type="password" required className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Forgot password?</Link>
        </div>
        <Button className="w-full" size="lg" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Log In
        </Button>
        <Divider />
        <SocialButtons />
      </form>
      <Style />
    </AuthShell>
  );
};

export const Register = () => {
  useRedirectIfAuthed();
  const location = useLocation();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [referralCode, setReferralCode] = useState<string>("");

  // Pick up ?ref=CODE from URL and remember it across the confirm-email round-trip.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromUrl = params.get("ref")?.trim().toUpperCase();
    if (fromUrl) {
      setReferralCode(fromUrl);
      try { localStorage.setItem("sjoh_pending_referral", fromUrl); } catch { /* ignore */ }
    } else {
      try {
        const stored = localStorage.getItem("sjoh_pending_referral");
        if (stored) setReferralCode(stored);
      } catch { /* ignore */ }
    }
  }, [location.search]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      toast({ title: "Tick the box, boet", description: "You need to agree to the Terms before registering.", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName, referral_code: referralCode || null },
      },
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't create account", description: error.message, variant: "destructive" });
      return;
    }

    // If we have an active session right away (e.g. auto-confirm), try to claim the referral now.
    if (referralCode && data.session) {
      const { error: refErr } = await supabase.rpc("claim_referral_code", { _code: referralCode });
      if (!refErr) {
        try { localStorage.removeItem("sjoh_pending_referral"); } catch { /* ignore */ }
        toast({ title: "Referral linked!", description: "When you upgrade to Verified Pro, you both get a free month." });
      }
    }

    toast({ title: "Sharp-sharp!", description: "You're in. Let's get to work." });
  };

  return (
    <AuthShell
      title="Pull in, boet."
      subtitle="The graft is waiting. Let's get you set up."
      footer={<>Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link></>}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        {referralCode && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
            <div className="font-bold text-foreground">🎁 Referral applied: <span className="font-mono">{referralCode}</span></div>
            <div className="text-ink-2 mt-0.5">When you upgrade to Verified Pro, you both get a free month.</div>
          </div>
        )}
        <Field label="What does your Ma call you?">
          <input required className="input" placeholder="First name + surname (or business name)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </Field>
        <Field label="Email">
          <input type="email" required className="input" placeholder="you@business.co.za" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <input type="password" required minLength={8} className="input" placeholder="Make it stronger than Ouma's rusks." value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <label className="flex items-start gap-2.5 text-xs cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            required
            className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
          />
          <span className="text-muted-foreground leading-relaxed">
            I agree to the <Link to="/terms" className="text-primary font-semibold hover:underline">Terms of Service</Link> and POPIA privacy policy, and confirm I will not offer or request illegal services.
          </span>
        </label>
        <Button className="w-full" size="lg" disabled={submitting || !agreeTerms}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Let's Gooi
        </Button>
        <Divider />
        <SocialButtons />
      </form>
      <Style />
    </AuthShell>
  );
};

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't send reset", description: error.message, variant: "destructive" });
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll send you a link to set a new password."
      footer={<>Remembered it? <Link to="/login" className="text-primary font-semibold hover:underline">Back to login</Link></>}
    >
      {sent ? (
        <p className="text-sm">Check your inbox at <strong>{email}</strong> for the reset link.</p>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Email">
            <input type="email" required className="input" placeholder="you@business.co.za" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button className="w-full" size="lg" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Send Reset Link
          </Button>
        </form>
      )}
      <Style />
    </AuthShell>
  );
};

export const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't update password", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password updated" });
    navigate("/dashboard", { replace: true });
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Enter your new password below."
      footer={<Link to="/login" className="text-primary font-semibold hover:underline">Back to login</Link>}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="New password">
          <input type="password" required minLength={8} className="input" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button className="w-full" size="lg" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Update Password
        </Button>
      </form>
      <Style />
    </AuthShell>
  );
};
