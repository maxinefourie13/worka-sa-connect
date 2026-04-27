import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_PHRASES = [
  "Hold tight... we're making a plan.",
  "Searching... faster than a taxi skipping a robot.",
  "Just now, just now...",
];

const PAYMENT_PHRASES = [
  "Sorting the chankura...",
  "Talking to the bank, just now...",
  "Hold tight... loading the kroon.",
];

interface Props {
  context?: "default" | "payment";
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const SjohSpinner = ({
  context = "default",
  className,
  size = "md",
  showText = true,
}: Props) => {
  const phrases = context === "payment" ? PAYMENT_PHRASES : DEFAULT_PHRASES;
  const [i, setI] = useState(() => Math.floor(Math.random() * phrases.length));

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % phrases.length), 2200);
    return () => clearInterval(id);
  }, [phrases.length]);

  const iconSize = size === "sm" ? "size-4" : size === "lg" ? "size-7" : "size-5";

  return (
    <div className={cn("flex items-center gap-3 text-ink-2", className)}>
      <Loader2 className={cn(iconSize, "animate-spin text-primary")} strokeWidth={2.5} />
      {showText && (
        <span key={i} className="text-sm font-medium animate-in fade-in duration-300">
          {phrases[i]}
        </span>
      )}
    </div>
  );
};
