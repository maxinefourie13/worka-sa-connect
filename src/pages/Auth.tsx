import { Link } from "react-router-dom";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";

interface AuthShellProps {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export const AuthShell = ({ title, subtitle, footer, children }: AuthShellProps) => (
  <SiteLayout>
    <div className="container py-16 max-w-md">
      <Link to="/" className="font-display text-2xl font-semibold tracking-tight inline-block mb-10">
        Worka<span className="text-primary">.</span>
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

export const Login = () => (
  <AuthShell
    title="Welcome back"
    subtitle="Log in to manage your business and applications."
    footer={
      <>Don't have an account? <Link to="/register" className="text-primary font-semibold hover:underline">Register</Link></>
    }
  >
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <Field label="Email"><input type="email" className="input" placeholder="you@business.co.za" /></Field>
      <Field label="Password"><input type="password" className="input" placeholder="••••••••" /></Field>
      <div className="flex justify-end">
        <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Forgot password?</Link>
      </div>
      <Button className="w-full" size="lg">Log In</Button>
      <div className="relative text-center my-2">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <span className="relative bg-card px-3 text-xs text-muted-foreground uppercase tracking-widest font-semibold">or</span>
      </div>
      <Button type="button" variant="outline" className="w-full" size="lg">
        <span className="font-bold text-base">G</span>
        Continue with Google
      </Button>
    </form>
    <Style />
  </AuthShell>
);

export const Register = () => (
  <AuthShell
    title="Create your account"
    subtitle="Start listing your business in minutes."
    footer={
      <>Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link></>
    }
  >
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <Field label="Business name"><input className="input" placeholder="Your business" /></Field>
      <Field label="Email"><input type="email" className="input" placeholder="you@business.co.za" /></Field>
      <Field label="Password"><input type="password" className="input" placeholder="At least 8 characters" /></Field>
      <p className="text-xs text-muted-foreground">By registering, you agree to our terms and POPIA privacy policy.</p>
      <Button className="w-full" size="lg">Create Account</Button>
    </form>
    <Style />
  </AuthShell>
);

export const ForgotPassword = () => (
  <AuthShell
    title="Reset your password"
    subtitle="We'll send you a link to set a new password."
    footer={
      <>Remembered it? <Link to="/login" className="text-primary font-semibold hover:underline">Back to login</Link></>
    }
  >
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <Field label="Email"><input type="email" className="input" placeholder="you@business.co.za" /></Field>
      <Button className="w-full" size="lg">Send Reset Link</Button>
    </form>
    <Style />
  </AuthShell>
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
