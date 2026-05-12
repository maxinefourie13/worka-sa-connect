import { cn } from "@/lib/utils";

export const SjohWordmark = ({ className }: { className?: string }) => (
  <span className={cn("font-display text-4xl font-black tracking-normal leading-none text-white", className)}>
    sjoh
    <span className="animate-sjoh-mark">!</span>
  </span>
);
