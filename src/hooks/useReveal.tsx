import { useEffect, useRef, useState } from "react";

/**
 * Lightweight scroll-reveal hook. Adds an `is-visible` boolean once the element
 * intersects the viewport. Pair with Tailwind transitions for fade-up effects.
 *
 *   const { ref, visible } = useReveal();
 *   <div ref={ref} className={cn("transition-all duration-700",
 *     visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>...</div>
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}
