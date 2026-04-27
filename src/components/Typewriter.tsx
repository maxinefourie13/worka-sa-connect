import { useEffect, useState } from "react";

interface TypewriterProps {
  phrases: string[];
  /** ms per character while typing */
  typingSpeed?: number;
  /** ms per character while erasing */
  erasingSpeed?: number;
  /** ms to hold a fully-typed phrase before erasing */
  holdDuration?: number;
  /** Randomize order instead of sequential */
  randomize?: boolean;
  className?: string;
}

/**
 * Looping typewriter that types one phrase, holds, erases, and moves to the next.
 * Renders an inline-block span with a blinking caret. Reserves vertical space
 * via the parent's line-height so the search bar below never jumps.
 */
export const Typewriter = ({
  phrases,
  typingSpeed = 45,
  erasingSpeed = 22,
  holdDuration = 2200,
  randomize = false,
  className,
}: TypewriterProps) => {
  const [order] = useState(() => {
    if (!randomize) return phrases.map((_, i) => i);
    const arr = phrases.map((_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const [orderIndex, setOrderIndex] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "erasing">("typing");

  useEffect(() => {
    const target = phrases[order[orderIndex]] ?? "";
    let timeoutId: number;

    if (phase === "typing") {
      if (text.length < target.length) {
        timeoutId = window.setTimeout(() => {
          setText(target.slice(0, text.length + 1));
        }, typingSpeed);
      } else {
        timeoutId = window.setTimeout(() => setPhase("holding"), 0);
      }
    } else if (phase === "holding") {
      timeoutId = window.setTimeout(() => setPhase("erasing"), holdDuration);
    } else {
      if (text.length > 0) {
        timeoutId = window.setTimeout(() => {
          setText(target.slice(0, text.length - 1));
        }, erasingSpeed);
      } else {
        timeoutId = window.setTimeout(() => {
          setOrderIndex((i) => (i + 1) % order.length);
          setPhase("typing");
        }, 200);
      }
    }

    return () => window.clearTimeout(timeoutId);
  }, [text, phase, orderIndex, order, phrases, typingSpeed, erasingSpeed, holdDuration]);

  return (
    <span className={className} aria-live="polite" aria-atomic="true">
      {text}
      <span
        aria-hidden="true"
        className="inline-block w-[0.08em] ml-1 align-baseline animate-caret-blink"
        style={{
          height: "0.95em",
          backgroundColor: "currentColor",
          transform: "translateY(0.12em)",
        }}
      />
    </span>
  );
};
