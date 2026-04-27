import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { SeoHead } from "@/components/SeoHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <SiteLayout>
      <SeoHead
        title="Eish! Page not found | Sjoh!"
        description="The page you're looking for doesn't exist. Head back to the graft."
        noindex
      />
      <div className="container py-24 max-w-lg text-center">
        <p className="font-display text-7xl font-semibold text-primary tracking-tight">404</p>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4">
          Eish! We took a wrong turn.
        </h1>
        <p className="mt-3 text-ink-2">
          We can't find the page you're looking for. The taxi definitely dropped us at the wrong rank.
        </p>
        <Button asChild size="lg" className="mt-7">
          <Link to="/">Take me back to the graft</Link>
        </Button>
      </div>
    </SiteLayout>
  );
};

export default NotFound;
