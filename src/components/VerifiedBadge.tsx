import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Props {
  size?: "sm" | "md" | "lg";
  className?: string;
  withLabel?: boolean;
}

/**
 * Verification badge. Shown on every surface where a checked business appears.
 */
export const VerifiedBadge = ({ size = "sm", className, withLabel = false }: Props) => {
  const dims = size === "lg" ? "size-5" : size === "md" ? "size-4" : "size-3.5";
  const text = size === "lg" ? "text-sm" : "text-xs";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 font-bold text-accent",
            withLabel && "bg-accent/10 px-2 py-0.5 rounded-full",
            text,
            className,
          )}
        >
          <BadgeCheck className={cn(dims, "fill-accent text-accent-foreground")} strokeWidth={2.5} />
          {withLabel && <span className="uppercase tracking-widest text-[10px]">Verified</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-xs">
          <strong>ID document checked by Sjoh.</strong> We matched this pro's submitted name and ID number to their uploaded ID document.
        </p>
      </TooltipContent>
    </Tooltip>
  );
};
