// Prohibited services filter — blocks listings/jobs that violate community guidelines.
// Keep this list practical, not exhaustive — it's a guardrail, not a censor.
// Matching is case-insensitive AND obfuscation-tolerant: extra spaces, punctuation,
// repeated characters, and common leetspeak (0=o, 1=i/l, 3=e, 4=a, 5=s, 7=t, @=a, $=s)
// are all normalised away before the term is searched for.

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

// Leetspeak / look-alike substitutions. Map every variant onto one canonical letter.
const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "!": "i",
  "|": "i",
  "3": "e",
  "4": "a",
  "@": "a",
  "5": "s",
  "$": "s",
  "7": "t",
  "+": "t",
  "8": "b",
  "9": "g",
  "2": "z",
};

/**
 * Normalise a string so obfuscated variants collapse to the same form as the
 * canonical keyword. Steps:
 *   1. Lowercase.
 *   2. Replace leetspeak / look-alike characters with their letter equivalents.
 *   3. Strip every non-alphanumeric character (spaces, punctuation, emoji…).
 *   4. Collapse repeated letters down to two (so "freeeee" -> "free", "porrrn" -> "porn").
 */
export function normaliseForMatch(input: string): string {
  const lower = input.toLowerCase();
  let out = "";
  for (const ch of lower) {
    if (LEET_MAP[ch]) {
      out += LEET_MAP[ch];
    } else if (/[a-z0-9]/.test(ch)) {
      out += ch;
    }
    // anything else (spaces, punctuation, dots, dashes, emoji) is dropped
  }
  // Collapse 3+ repeats of the same letter down to 2 (English rarely has 3 in a row).
  out = out.replace(/([a-z])\1{2,}/g, "$1$1");
  return out;
}

/**
 * Check whether a piece of text contains any prohibited keyword,
 * tolerant to spacing, punctuation and basic leetspeak obfuscation.
 * Returns the matched canonical term if found, otherwise null.
 */
export function findProhibited(text: string | null | undefined): string | null {
  if (!text) return null;
  const haystack = normaliseForMatch(text);
  if (!haystack) return null;
  for (const term of PROHIBITED_KEYWORDS) {
    const needle = normaliseForMatch(term);
    if (!needle) continue;
    if (haystack.includes(needle)) return term;
  }
  return null;
}

export const PROHIBITED_MESSAGE =
  "This service violates our community guidelines.";
