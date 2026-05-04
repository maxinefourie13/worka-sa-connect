import { Link } from "react-router-dom";
import sjohLogo from "@/assets/sjoh-logo.png";

const cols = [
  {
    title: "Platform",
    links: [
      { to: "/directory", label: "Browse Directory" },
      { to: "/requests", label: "Get Quotes (post a job)" },
      { to: "/leads", label: "Send Quotes (find work)" },
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
      { to: "#", label: "About Sjoh" },
      { to: "#", label: "Careers" },
      { to: "#", label: "Press" },
      { to: "#", label: "Partners" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/terms", label: "Terms of Service" },
      { to: "/privacy", label: "Privacy Policy" },
    ],
  },
];

export const SiteFooter = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-16">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="space-y-4">
            <Link to="/" className="inline-block" aria-label="Sjoh home">
              <img src={sjohLogo} alt="Sjoh!" className="h-20 w-auto" />
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
            © {new Date().getFullYear()} Sjoh. Proudly built in South Africa.
          </p>
          <p className="text-xs text-muted-foreground">
            POPIA-compliant. We protect your personal information under South African law.
          </p>
        </div>
      </div>
    </footer>
  );
};
