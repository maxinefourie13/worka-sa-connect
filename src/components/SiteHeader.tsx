import { Link, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/directory", label: "Browse" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/pricing", label: "Pricing" },
];

const initials = (input: string) =>
  input
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  const { session, user, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Account";

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

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
          {session ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to="/list">List Your Business</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="size-9 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center hover:bg-primary/15 transition-colors"
                    aria-label="Account menu"
                  >
                    {initials(displayName)}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard"><LayoutDashboard className="size-4 mr-2" />Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="size-4 mr-2" />Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link to="/list">List Your Business</Link>
              </Button>
            </>
          )}
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
              {session ? (
                <>
                  <Button variant="outline" className="flex-1" asChild>
                    <Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
                  </Button>
                  <Button className="flex-1" onClick={() => { setOpen(false); handleSignOut(); }}>
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="flex-1" asChild>
                    <Link to="/login" onClick={() => setOpen(false)}>Log In</Link>
                  </Button>
                  <Button className="flex-1" asChild>
                    <Link to="/list" onClick={() => setOpen(false)}>List Business</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
