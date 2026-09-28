-- Rename google_sub → auth_sub for Keycloak subject
ALTER TABLE "users" RENAME COLUMN "google_sub" TO "auth_sub";
