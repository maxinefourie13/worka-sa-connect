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
  /** Tailwind class applied to "Sjoh" + punctuation (defaults to coral primary) */
  accentClassName?: string;
  /** Reserve the current full phrase's wrapped layout before it finishes typing */
  reserveCurrentPhraseSpace?: boolean;
}

/**
 * Looping typewriter that types one phrase, holds, erases, and moves to the next.
 * Renders an inline-block span with a blinking caret. Accent-colors the word
 * "Sjoh" (and its trailing "!") plus any punctuation as the text appears.
 */
export const Typewriter = ({
  phrases,
  typingSpeed = 45,
  erasingSpeed = 22,
  holdDuration = 2200,
  randomize = false,
  className,
  accentClassName = "text-primary",
  reserveCurrentPhraseSpace = false,
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
  const target = phrases[order[orderIndex]] ?? "";

  useEffect(() => {
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
  }, [text, phase, orderIndex, order, phrases, typingSpeed, erasingSpeed, holdDuration, target]);

  // Tokenize so "Sjoh" and punctuation render in the accent color while
  // the rest stays in whatever color the parent sets (foreground/charcoal).
  // Split keeps the matched delimiters as their own tokens.
  const splitTokens = (value: string) => value.split(/(Sjoh|[!?.,;:'"\-—…])/g).filter(Boolean);

  const renderTokens = (value: string) =>
    splitTokens(value).map((tok, i) => {
      const isAccent = tok === "Sjoh" || /^[!?.,;:'"\-—…]$/.test(tok);
      return isAccent ? (
        <span key={i} className={accentClassName}>
          {tok}
        </span>
      ) : (
        <span key={i}>{tok}</span>
      );
    });

  const caret = (
    <span
      aria-hidden="true"
      className="inline-block w-[0.08em] ml-1 align-baseline animate-caret-blink"
      style={{
        height: "0.95em",
        backgroundColor: "currentColor",
        transform: "translateY(0.12em)",
      }}
    />
  );

  if (reserveCurrentPhraseSpace) {
    return (
      <span className={`${className ?? ""} grid w-full`} aria-live="polite" aria-atomic="true">
        <span className="invisible col-start-1 row-start-1" aria-hidden="true">
          {renderTokens(target)}
          {caret}
        </span>
        <span className="col-start-1 row-start-1">
          {renderTokens(text)}
          {caret}
        </span>
      </span>
    );
  }

  return (
    <span className={className} aria-live="polite" aria-atomic="true">
      {renderTokens(text)}
      {caret}
    </span>
  );
};
