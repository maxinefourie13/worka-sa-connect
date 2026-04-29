import { Construction } from "lucide-react";
import { useMyBusiness } from "@/hooks/useMyBusiness";

/**
 * Persistent pre-launch banner. Shown above SiteHeader when the logged-in
 * provider's business is still in Workshop Mode (pre_launch = true).
 * Hides itself for visitors, customers, or businesses that have already gone live.
 */
export const WorkshopModeBanner = () => {
  const { business, loading } = useMyBusiness();
  if (loading || !business || !business.pre_launch) return null;

  return (
    <div className="w-full bg-primary text-primary-foreground">
      <div className="container py-2.5 flex items-center gap-3 text-sm">
        <Construction className="size-4 shrink-0" strokeWidth={2.5} />
        <p className="font-semibold leading-tight">
          Workshop Mode <span className="font-normal opacity-90">— Sjoh hasn't launched yet. Customers can't see your profile or post jobs. We'll holla the moment we open the doors.</span>
        </p>
      </div>
    </div>
  );
};
