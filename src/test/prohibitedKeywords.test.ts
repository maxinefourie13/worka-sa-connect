import { describe, expect, it } from "vitest";
import { findProhibited, normaliseForMatch } from "@/lib/prohibitedKeywords";

describe("normaliseForMatch", () => {
  it("strips spaces, punctuation and lowercases", () => {
    expect(normaliseForMatch("Buy  DRUGS, now!")).toBe("buydrugsnow");
  });
  it("translates leetspeak digits and symbols", () => {
    expect(normaliseForMatch("c0c@ine")).toBe("cocaine");
    expect(normaliseForMatch("h@ck wh4t$@pp")).toBe("hackwhatsapp");
  });
  it("collapses repeated characters", () => {
    expect(normaliseForMatch("freeeeee moneyyy")).toBe("fremoney");
  });
});

describe("findProhibited", () => {
  const blocked: Array<[string, string]> = [
    ["I sell c0caine cheap", "cocaine"],
    ["p o r n star wanted", "porn"],
    ["Need a h.i.t.m.a.n urgently", "hitman"],
    ["fake  i.d for sale", "fake id"],
    ["p0rrrrn site builder", "porn"],
    ["h@ck wh@tsapp pls", "hack whatsapp"],
    ["m0n3y l4und3ring service", "money laundering"],
    ["BUY  DRUGS NOW", "buy drugs"],
    ["a$$a$$in available", "assassin"],
    ["pyr@mid-scheme expert", "pyramid scheme"],
  ];

  it.each(blocked)("blocks %p", (text, expected) => {
    expect(findProhibited(text)).toBe(expected);
  });

  const allowed = [
    "I love popcorn at the cinema",
    "Therapist needed for kids",
    "I need a plumber for my geyser",
    "Looking for a tiler in Sandton",
    "passport photos in PDF",
    "We sell free-range eggs",
  ];

  it.each(allowed)("allows %p", (text) => {
    expect(findProhibited(text)).toBeNull();
  });

  it("handles null/empty input", () => {
    expect(findProhibited("")).toBeNull();
    expect(findProhibited(null)).toBeNull();
    expect(findProhibited(undefined)).toBeNull();
  });
});
