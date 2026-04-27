// The auto-generated wrapper at ./index.ts widens the provider union to include
// "lovable" but the upstream package types do not. We swap the upstream type
// (declared via triple-slash to keep the original module declaration intact)
// for one that allows "lovable" too.

import "@lovable.dev/cloud-auth-js";

declare module "@lovable.dev/cloud-auth-js" {
  // Re-declare with the widened union; TS merges this with the original module.
  // Using `export type` augments the existing exports.
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface __LovableAuthAugmentation {}
}
