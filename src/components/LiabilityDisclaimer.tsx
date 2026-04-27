import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "footer" | "inline";
  className?: string;
}

/**
 * Persistent liability shield disclaimer used on Post-a-Job and Bid screens.
 * Sjoh. is a matching platform — we don't run jobs, hold money, or take a cut.
 */
export const LiabilityDisclaimer = ({ variant = "footer", className }: Props) => {
  if (variant === "inline") {
    return (
      <p className={cn("text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5", className)}>
        <ShieldAlert className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
        <span>
          <strong>Sjoh.</strong> is a matching platform. We are not liable for services rendered or payments made off-platform.
        </span>
      </p>
    );
  }
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-secondary/50 px-4 py-3 flex items-start gap-2.5",
        className,
      )}
      role="note"
      aria-label="Liability disclaimer"
    >
      <ShieldAlert className="size-4 mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
      <p className="text-xs text-ink-2 leading-relaxed">
        <strong className="text-foreground">Sjoh.</strong> is a matching platform. We are not liable
        for services rendered or payments made off-platform. Always verify your pro and pay safely.
      </p>
    </div>
  );
};
