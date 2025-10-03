import { defineStorage } from "@aws-amplify/backend";

/**
 * S3 Storage Configuration for Ape Moments
 *
 * Bucket structure:
 * - albums/{uuid}/...     Album images and PDFs
 * - collages/{uuid}/...   Collage images and assets
 * - temp/...              Temporary uploads (7-day expiration)
 */
export const storage = defineStorage({
  name: "ape-moments",
  access: (allow) => ({
    "albums/*": [
      allow.guest.to(["read", "write", "delete"]),
      allow.authenticated.to(["read", "write", "delete"]),
    ],
    "collages/*": [
      allow.guest.to(["read", "write", "delete"]),
      allow.authenticated.to(["read", "write", "delete"]),
    ],
    "temp/*": [
      allow.guest.to(["read", "write", "delete"]),
      allow.authenticated.to(["read", "write", "delete"]),
    ],
  }),
});
