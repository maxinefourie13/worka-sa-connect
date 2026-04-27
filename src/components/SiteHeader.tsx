import { Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const NAV = [
  { to: "/directory", label: "Browse" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/pricing", label: "Pricing" },
];

export const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
            Sjoh<span className="text-primary">.</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-7">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className="text-sm font-medium text-ink-2 hover:text-foreground transition-colors"
                activeClassName="text-foreground"
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link to="/list">List Your Business</Link>
          </Button>
        </div>
        <button
          className="lg:hidden p-2 -mr-2"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="container py-4 flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-ink-2"
              >
                {n.label}
              </Link>
            ))}
            <div className="flex gap-3 mt-3">
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/login">Log In</Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link to="/list">List Business</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
