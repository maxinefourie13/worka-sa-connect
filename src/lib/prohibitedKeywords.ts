// Prohibited services filter — blocks listings/jobs that violate community guidelines.
// Keep this list practical, not exhaustive — it's a guardrail, not a censor.
// Phrases use word-boundary matching, case-insensitive.

export const PROHIBITED_KEYWORDS: string[] = [
  // Illegal substances / weapons
  "cocaine", "heroin", "meth", "tik", "mandrax", "weed for sale",
  "dagga for sale", "drugs for sale", "buy drugs", "sell drugs",
  "firearm", "unlicensed gun", "ak47", "ak-47", "ammunition for sale",
  "stolen goods", "fence goods",
  // Adult / sex services
  "escort", "sex worker", "sexual services", "sugar daddy", "sugar baby",
  "massage with happy ending", "happy ending massage", "erotic massage",
  "adult entertainment for hire", "porn", "onlyfans",
  // Financial scams / illegal finance
  "loan shark", "mashonisa", "guaranteed returns", "ponzi", "pyramid scheme",
  "double your money", "money flip", "money flipping", "blesser",
  "crypto doubling", "fake invoice", "money laundering",
  // Fraud / impersonation
  "fake id", "fake passport", "fake matric", "buy degree",
  "exam paper for sale", "hack instagram", "hack whatsapp",
  // Other
  "hitman", "assassin",
];

/**
 * Check whether a piece of text contains any prohibited keyword.
 * Returns the matched term if found, otherwise null.
 */
export function findProhibited(text: string | null | undefined): string | null {
  if (!text) return null;
  const haystack = ` ${text.toLowerCase()} `;
  for (const term of PROHIBITED_KEYWORDS) {
    // Use simple substring match guarded by word boundaries on both ends
    // so e.g. "porn" doesn't match "popcorn".
    const t = term.toLowerCase();
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegex(t)}([^a-z0-9]|$)`, "i");
    if (re.test(haystack)) return term;
  }
  return null;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const PROHIBITED_MESSAGE =
  "This service violates our community guidelines.";
