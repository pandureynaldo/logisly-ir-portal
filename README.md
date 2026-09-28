# Logisly IR Intake

Internal web app for Logisly employees to report security incidents via **Keycloak SSO** (`auth.logisly.id` / realm `org-wide`, client `logisly-connect`). Admins triage cases, download evidence, and generate a filled Section A case packet (`.docx`).

Offline channels (email / WhatsApp) remain valid per company policy — this app is the structured URL intake. Custom ticketing integration is stubbed (`TicketBridge` noop) for a later PR.

## Quick start (local)

1. **Keycloak client `logisly-connect`** (public client, standard flow + PKCE):
   - Valid redirect URI: `http://localhost:5173/oauth/callback`
   - Web origin: `http://localhost:5173`
   - Same client used by Logisly Connect / CRM

2. **Env**
   ```bash
   cp .env.example .env
   # AUTH_ISSUER / AUTH_AUDIENCE / AUTH_JWKS_URI already set for org-wide
   # ADMIN_EMAILS already seeded with IR owners
   ```

3. **Install + Postgres + migrate**
   ```bash
   pnpm install
   docker compose up -d postgres   # or use local Postgres with DATABASE_URL in .env
   pnpm --filter @logisly/shared build
   pnpm --filter @logisly/api exec prisma migrate deploy
   pnpm --filter @logisly/api exec prisma generate
   pnpm dev
   ```
   - Web: http://localhost:5173  
   - API: http://localhost:3001  

4. **Smoke**
   ```bash
   pnpm smoke
   ```

### Checklist

- [ ] Login via Logisly SSO (`@logisly.com`); non-domain rejected with “Hanya akun @logisly.com”
- [ ] Reporter submits minimal form (+ evidence) → gets `INC-YYYY-NNN`
- [ ] Reporter sees only own cases under `/my-reports`
- [ ] Admin sees all cases, updates status (`Pending` / `Open` / `In Progress` / `Closed`), downloads evidence
- [ ] Admin downloads case packet `.docx` with Section A filled
- [ ] No `.env` / `storage/*` / filled packets committed

## Auth model

- **Web**: Authorization Code + PKCE (`react-oidc-context`) against `AUTH_ISSUER`
- **API**: validates Bearer access token with JWKS (`AUTH_JWKS_URI`), issuer + audience/`azp` = `logisly-connect`
- Server still enforces `email_verified` and `@logisly.com`
- Admin role from `ADMIN_EMAILS` on upsert

## Status values (match custom ticketing)

| Status | Meaning |
|--------|---------|
| Pending | Default — user reported |
| Open | Picked up / intake |
| In Progress | Active remediation |
| Closed | Done |

## Deploy (Docker + GitHub Actions)

Images: `ghcr.io/<owner>/logisly-ir-api`, `ghcr.io/<owner>/logisly-ir-web`.

**CI** (`.github/workflows/ci.yml`): typecheck + build on PR/main.

**CD** (`.github/workflows/deploy.yml`): build/push to GHCR; SSH deploy when secrets are set.

### One-time VPS

```bash
mkdir -p /opt/logisly-ir/storage
# copy docker-compose.prod.yml + create /opt/logisly-ir/.env (production values)
# APP_ORIGIN / API_ORIGIN should be the public URL (nginx proxies /api → api)
docker login ghcr.io
export GHCR_OWNER=<github-owner>
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### GitHub secrets

- `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`

Add Keycloak redirect URI for production: `https://<host>/oauth/callback`.

## Ticketing (prepare only)

`TICKETING_PROVIDER=noop`. Columns `external_ticket_id` / `external_ticket_url` / `external_sync_status` exist. No live API calls to the custom ticketing platform yet.

## Package layout

- `apps/web` — React + Vite
- `apps/api` — Express + Prisma
- `packages/shared` — zod schemas / enums
- `apps/api/templates/incident-case-packet.docx` — tagged blank for docxtemplater
