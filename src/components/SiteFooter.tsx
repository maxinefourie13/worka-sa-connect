import { Link } from "react-router-dom";

const cols = [
  {
    title: "Platform",
    links: [
      { to: "/directory", label: "Browse Directory" },
      { to: "/opportunities", label: "Opportunities" },
      { to: "/pricing", label: "Pricing" },
      { to: "/list", label: "List Your Business" },
    ],
  },
  {
    title: "Support",
    links: [
      { to: "#", label: "Help Centre" },
      { to: "#", label: "Contact Us" },
      { to: "#", label: "Trust & Verification" },
      { to: "#", label: "Report a Listing" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "#", label: "About Worka" },
      { to: "#", label: "Careers" },
      { to: "#", label: "Press" },
      { to: "#", label: "Partners" },
    ],
  },
];

export const SiteFooter = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-16">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
              Worka<span className="text-primary">.</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Find someone who can do it properly. South Africa's directory for trusted service providers.
            </p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 font-sans">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-ink-2 hover:text-foreground transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Worka. Proudly built in South Africa.
          </p>
          <p className="text-xs text-muted-foreground">
            POPIA-compliant. We protect your personal information under South African law.
          </p>
        </div>
      </div>
    </footer>
  );
};
