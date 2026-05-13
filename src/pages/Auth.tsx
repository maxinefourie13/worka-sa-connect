import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SiteLayout } from "@/components/SiteLayout";
import { SjohWordmark } from "@/components/SjohWordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldCheck, HandCoins, Handshake, Gift, Apple } from "lucide-react";
import sjohLogo from "@/assets/sjoh-logo.png";

interface AuthShellProps {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}

const getSafeNextPath = (location: ReturnType<typeof useLocation>) => {
  const fromState = (location.state as { from?: string } | null)?.from;
  const fromQuery = new URLSearchParams(location.search).get("next");
  const target = fromState || fromQuery || "/dashboard";
  return target.startsWith("/") && !target.startsWith("//") ? target : "/dashboard";
};

const withNext = (path: string, nextPath: string) =>
  nextPath === "/dashboard" ? path : `${path}?next=${encodeURIComponent(nextPath)}`;

const BrandPanel = () => (
  <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-[hsl(227_100%_29%)] p-10 text-primary-foreground min-h-[560px]">
    {/* soft glow */}
    <div className="absolute -top-24 -right-24 size-72 rounded-full bg-accent/40 blur-3xl pointer-events-none" />
    <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-white/15 blur-3xl pointer-events-none" />

    <div className="relative z-10">
      <Link to="/" aria-label="Sjoh home">
        <SjohWordmark className="text-5xl" />
      </Link>
      <h2 className="font-display font-extrabold tracking-tight text-3xl mt-10 leading-tight text-primary-foreground">
        Find someone who can do it properly.
      </h2>
      <p className="mt-3 text-primary-foreground/80 text-sm max-w-sm">
        One Sjoh account lets you post jobs, compare quotes, save invoices, or build a business profile customers can trust.
      </p>
    </div>

    <ul className="relative z-10 space-y-4 text-sm">
      {[
        { Icon: HandCoins, text: "Customers get real quotes. Pros keep the full job." },
        { Icon: ShieldCheck, text: "Profiles, reviews and trust signals in one place." },
        { Icon: Handshake, text: "Contact unlocks when the quote is accepted." },
      ].map(({ Icon, text }) => (
        <li key={text} className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Icon className="size-4" />
          </span>
          <span className="font-semibold">{text}</span>
        </li>
      ))}
    </ul>
  </aside>
);

const AuthShell = ({ title, subtitle, footer, children }: AuthShellProps) => (
  <SiteLayout>
    <div className="relative">
      {/* subtle periwinkle wash */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.10),transparent_70%)]" />
      <div className="container py-12 md:py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-stretch max-w-6xl mx-auto">
          <div className="flex flex-col">
            <Link to="/" className="inline-block mb-8 lg:hidden" aria-label="Sjoh home">
              <img src={sjohLogo} alt="Sjoh" className="h-14 w-auto" />
            </Link>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">{title}</h1>
            <p className="mt-3 text-ink-2 text-base max-w-md">{subtitle}</p>
            <div className="mt-8 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
              {children}
            </div>
            <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
          </div>
          <BrandPanel />
        </div>
      </div>
    </div>
  </SiteLayout>
);

const GoogleGlyph = () => (
  <svg viewBox="0 0 48 48" className="size-4" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.6 29.3 4.6 24 4.6 16.3 4.6 9.7 8.9 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41 35 44 30 44 24c0-1.3-.1-2.4-.4-3.5z"/>
  </svg>
);

const SocialButtons = ({ nextPath }: { nextPath: string }) => {
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);

  const handle = async (provider: "google" | "apple") => {
    setLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}${nextPath}`,
      });
      if (result.error) {
        toast({ title: "Sign-in failed", description: String(result.error), variant: "destructive" });
        setLoading(null);
        return;
      }
      if (result.redirected) return;
      window.location.href = nextPath;
    } catch (e) {
      toast({ title: "Sign-in failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => handle("google")} disabled={loading !== null}>
        {loading === "google" ? <Loader2 className="size-4 animate-spin" /> : <GoogleGlyph />}
        Google
      </Button>
      <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => handle("apple")} disabled={loading !== null}>
        {loading === "apple" ? <Loader2 className="size-4 animate-spin" /> : <Apple className="size-4" />}
        Apple
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

const useRedirectIfAuthed = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (!loading && session) {
      navigate(getSafeNextPath(location), { replace: true });
    }
  }, [session, loading, navigate, location]);
};

export const Login = () => {
  useRedirectIfAuthed();
  const location = useLocation();
  const navigate = useNavigate();
  const nextPath = getSafeNextPath(location);
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
    navigate(nextPath, { replace: true });
  };

  return (
    <AuthShell
      title="Welcome back."
      subtitle="Log in to post a job, compare quotes, save invoices, or manage your business profile."
      footer={<>Don't have an account? <Link to={withNext("/register", nextPath)} className="text-primary font-semibold hover:underline">Create one</Link></>}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input id="login-email" type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="login-password">Password</Label>
          <Input id="login-password" type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Forgot password?</Link>
        </div>
        <Button className="w-full" size="lg" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Log in
        </Button>
        <Divider />
        <SocialButtons nextPath={nextPath} />
      </form>
    </AuthShell>
  );
};

export const Register = () => {
  useRedirectIfAuthed();
  const location = useLocation();
  const navigate = useNavigate();
  const nextPath = getSafeNextPath(location);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [referralCode, setReferralCode] = useState<string>("");

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
      toast({ title: "Please accept the terms", description: "You need to agree to the Terms before creating an account.", variant: "destructive" });
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
        emailRedirectTo: `${window.location.origin}${nextPath}`,
        data: { display_name: displayName, referral_code: referralCode || null },
      },
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't create account", description: error.message, variant: "destructive" });
      return;
    }

    if (referralCode && data.session) {
      const { error: refErr } = await supabase.rpc("claim_referral_code", { _code: referralCode });
      if (!refErr) {
        try { localStorage.removeItem("sjoh_pending_referral"); } catch { /* ignore */ }
        toast({ title: "Referral linked!", description: "When you upgrade to Verified Pro, you both get a free month." });
      }
    }

    if (data.session) {
      toast({ title: "Sharp-sharp!", description: "You're in. Let's get to work." });
      navigate(nextPath, { replace: true });
    } else {
      toast({ title: "Check your email", description: "Tap the confirmation link, then we'll take you back to where you started." });
    }
  };

  return (
    <AuthShell
      title="Create your Sjoh account."
      subtitle="Use one account to post jobs, accept quotes, save invoices, or list your business."
      footer={<>Already have an account? <Link to={withNext("/login", nextPath)} className="text-primary font-semibold hover:underline">Log in</Link></>}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        {referralCode && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs flex items-start gap-2">
            <Gift className="size-4 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-foreground">Referral applied: <span className="font-mono">{referralCode}</span></div>
              <div className="text-ink-2 mt-0.5">When you upgrade to Verified Pro, you both get a free month.</div>
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="reg-name">Your name</Label>
          <Input id="reg-name" required placeholder="First name + surname" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-email">Email</Label>
          <Input id="reg-email" type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-password">Password</Label>
          <Input id="reg-password" type="password" required minLength={8} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
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
          Create account
        </Button>
        <Divider />
        <SocialButtons nextPath={nextPath} />
      </form>
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
      title="Forgot the password?"
      subtitle="No stress — pop in your email and we'll send a reset link."
      footer={<>Remembered it? <Link to="/login" className="text-primary font-semibold hover:underline">Back to log in</Link></>}
    >
      {sent ? (
        <p className="text-sm">Check your inbox at <strong>{email}</strong> for the reset link.</p>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email">Email</Label>
            <Input id="forgot-email" type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button className="w-full" size="lg" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Send reset link
          </Button>
        </form>
      )}
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
      subtitle="Pick something strong — you'll only have to do this once."
      footer={<Link to="/login" className="text-primary font-semibold hover:underline">Back to log in</Link>}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="reset-password">New password</Label>
          <Input id="reset-password" type="password" required minLength={8} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button className="w-full" size="lg" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Update password
        </Button>
      </form>
    </AuthShell>
  );
};
