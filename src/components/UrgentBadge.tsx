import { Siren } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Wraps a job/listing to give it the flashing coral "URGENT" treatment.
 */
export const UrgentBadge = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("relative rounded-xl urgent-pulse", className)}>
      <span className="absolute -top-2.5 left-4 z-10 inline-flex items-center gap-1 bg-accent text-accent-foreground text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded shadow-sm">
        <Siren className="size-3" /> Urgent
      </span>
      {children}
      <style>{`
        .urgent-pulse {
          box-shadow: 0 0 0 2px hsl(var(--accent));
          animation: urgentPulse 1.6s ease-in-out infinite;
        }
        @keyframes urgentPulse {
          0%, 100% { box-shadow: 0 0 0 2px hsl(var(--accent)), 0 0 0 0 hsl(var(--accent) / 0.55); }
          50%      { box-shadow: 0 0 0 2px hsl(var(--accent)), 0 0 0 8px hsl(var(--accent) / 0); }
        }
      `}</style>
    </div>
  );
};
