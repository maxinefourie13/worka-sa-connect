// Type augmentation: the auto-generated wrapper in ./index.ts widens the
// provider union to include "lovable" but the underlying package types do not.
// This shim makes them agree without modifying the auto-generated file.
declare module "@lovable.dev/cloud-auth-js" {
  type OAuthProvider = "google" | "apple" | "microsoft" | "lovable";
}
