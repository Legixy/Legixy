# Deploying Legixy

Everything here has been produced and tested. **Nothing has been provisioned.**
No host is chosen, no domain registered, no credential exists. This document is
the path a human follows; the section *What only a human can do* lists exactly
what is not automatable and why.

---

## 1. The decision that must not be made by accident

**A demo holding synthetic data can be hosted anywhere. A system holding real
client documents probably cannot.**

Uploaded certificates contain national ID numbers, iqama numbers, GOSI records
and commercial registration documents. That is personal data under the Saudi
Personal Data Protection Law, and PDPL restricts transferring it outside the
Kingdom.

This is expressed in configuration as a **required** variable:

```
DATA_REGION=sa-riyadh
```

| Value | Meaning |
|---|---|
| `sa-riyadh`, `sa-jeddah`, `me-central-1` | Inside the Kingdom. Real client documents acceptable. |
| `local` | A laptop. Nothing leaves the machine. |
| `me-south-1`, `eu-west-1`, `eu-central-1`, `us-east-1` | **Offshore.** Synthetic demo data only. |

Declaring an offshore region makes the application **refuse to start** unless
you also set:

```
ALLOW_OFFSHORE_CLIENT_DOCUMENTS=true
```

### This is not a technical control

Nothing in the code can stop a deployment landing in the wrong place. Setting
`DATA_REGION=sa-riyadh` on a Frankfurt server does not move the server. The
variable exists so that the choice is **made deliberately, recorded in
configuration, and visible in preflight** — rather than inherited from
whichever region a deploy button happened to offer first.

**Recommendation:** run the client demo with `DATA_REGION` set to the truth of
wherever it is hosted, and with synthetic data only. Do not upload a single
real client certificate until a host inside the Kingdom is chosen. Once real
documents exist, moving them is a data-transfer event rather than a migration.

---

## 2. What runs

| Component | Deployed | Notes |
|---|---|---|
| **Core** (NestJS) | Yes | API **and** the hourly reminder scheduler, one process. |
| **Web** (Next.js) | Yes | |
| **PostgreSQL 16** | Yes | Every compliance record. |
| **Redis 7** | Yes | BullMQ. The scheduler will not register without it. |
| **Worker** (`onyxlegal-worker`) | **NO — never deploy it** | See below. |

### Do not deploy the worker

It is tempting to deploy it for symmetry with Core. Do not.

`onyxlegal-worker` has **no migrations directory**, and its Prisma schema knows
none of the compliance models. Slice 12 established that running
`prisma db push` from that directory **drops eight tables** — every licence,
site, reminder, document and renewal record. Slice 4 established that the
scheduler belongs in Core, and it is there.

The worker is legacy from the contract-analysis product. It has no role in
licence compliance. A database-level event trigger blocks `DROP` on the
compliance tables, which is the only control that survives a `db push` from
any directory — but the correct answer is not to run one.

---

## 3. Configuration

Every variable, its requirement, and its default. Secrets are never printed by
preflight or written to logs.

### Required — the process refuses to start without these

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. |
| `REDIS_URL` | BullMQ connection. |
| `JWT_SECRET` | Signs session tokens. Minimum 32 characters. A guessable value is a full authentication bypass. |
| `DATA_REGION` | See section 1. |
| `DOCUMENT_ENCRYPTION_KEY` | AES-256-GCM key for documents at rest. Minimum 32 characters. Required outside development only. |

### Optional — with the default that applies when absent

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | Anything else is treated as a deployment. |
| `PORT` | `3001` | TCP port the API listens on. |
| `DATABASE_POOL_SIZE` | `10` | Raise only alongside Postgres `max_connections`. |
| `ALLOW_OFFSHORE_CLIENT_DOCUMENTS` | `false` | See section 1. |
| `DOCUMENT_STORAGE_PATH` | `<cwd>/.storage` | **Must be a mounted volume.** |
| `DOCUMENT_RETENTION_DAYS` | `30` | Days a soft-deleted document survives before purge. |
| `ALLOW_INSECURE_DEV_DOCUMENT_ENCRYPTION` | `false` | Development only. Refused outside it. |
| `SMTP_HOST` | *(none)* | **Absent means reminders are never sent.** |
| `SMTP_PORT` | `587` | 587 STARTTLS, 465 implicit TLS. |
| `SMTP_USER` | *(none)* | Omit for an unauthenticated relay. |
| `SMTP_PASS` | *(none)* | Required whenever `SMTP_USER` is set. |
| `SMTP_FROM` | `noreply@legixy.com` | Must be an address the relay may send as. |
| `APP_URL` | `http://localhost:3000` | Used in email links and OAuth redirects. |
| `CORS_ORIGIN` | `http://localhost:3000` | Browser origin allowed to call the API. |
| `REMINDER_SCHEDULER_ENABLED` | `true` | `false` serves the API and sweeps nothing. |
| `LOG_LEVEL` | `debug` dev / `info` otherwise | |
| `GOOGLE_CLIENT_ID` | *(none)* | Sign-in button stays hidden until this **and** the secret are set. |
| `GOOGLE_CLIENT_SECRET` | *(none)* | Must be set together with the id. |
| `GOOGLE_CALLBACK_URL` | `http://localhost:3001/api/v1/auth/google/callback` | |

Web reads one variable: `NEXT_PUBLIC_API_URL`.

---

## 4. Order of operations

```bash
# 1. Configure. Copy .env.template and fill it in.
cp onyxlegal-core/.env.template onyxlegal-core/.env

# 2. Check before starting anything.
cd onyxlegal-core && npm run preflight

# 3. Apply migrations. NEVER `prisma db push`.
npx prisma migrate deploy

# 4. Start.
npm run start:prod          # node dist/src/main

# 5. Verify.
curl http://localhost:3001/api/v1/health          # public liveness
# then sign in and GET /api/v1/health/ready       # authenticated readiness
```

`prisma migrate deploy` applies pending migrations and nothing else. It never
drops a column, never resets, and refuses to run if the recorded history and
the migration files disagree.

---

## 5. Single-instance deployment

`docker-compose.yml` at the repository root brings up Core, Web, PostgreSQL and
Redis. It is a **single-instance** configuration and is deliberately not
multi-instance: see section 6.

```bash
docker compose up -d
docker compose exec core npx prisma migrate deploy
docker compose exec core npm run preflight
```

Two volumes must persist or data is lost:

- `postgres-data` — every record.
- `document-blobs` mounted at `/data/documents` — encrypted certificates. The
  database lists them as present; losing the volume makes every one
  unreadable while the UI still shows them.

---

## 6. Running more than one Core

Supported by the reminder design, but read this first.

The dispatcher takes each reminder with a **single conditional UPDATE**
(`status = PENDING AND (lockedUntil IS NULL OR lockedUntil < now)`). `updateMany`
returns the affected count, so a loser sees `0` and skips. This is deliberately
not a Redis lock: a lock lost to a network blip would double-send with no
record, whereas this cannot.

So two Core processes against one database and one Redis is **safe** — the
repeatable job uses a fixed `jobId`, so BullMQ registers it once regardless of
how many instances add it, and every send is gated by the database claim.

What is *not* verified is behaviour under partition or clock skew between
instances, and nothing in this project has been load-tested. If a second
instance is added, the conservative configuration is
`REMINDER_SCHEDULER_ENABLED=false` on all but one — the API scales, the sweep
stays single-writer, and the claim becomes belt to that brace.

---

## 7. What only a human can do

Listed plainly, because none of it can be automated from here.

1. **Choose and provision a host.** No account exists. The residency decision
   in section 1 is a prerequisite, not a follow-up.
2. **Provision PostgreSQL 16 and Redis 7**, and produce their connection
   strings.
3. **Generate and store two secrets** — `JWT_SECRET` and
   `DOCUMENT_ENCRYPTION_KEY`, 32+ characters each, from a real random source
   (`openssl rand -base64 48`). Store them somewhere that is not this
   repository. **If `DOCUMENT_ENCRYPTION_KEY` is lost, every uploaded document
   is unrecoverable** — there is no escrow and no reset.
4. **Obtain SMTP credentials.** Twelve slices outstanding, and the single
   remaining blocker on the product's core promise. `npm run smtp:test -- you@example.com`
   proves them in under a minute.
5. **Register a domain and issue TLS certificates.** The API sets an HttpOnly
   auth cookie; over plain HTTP that cookie is readable in transit.
6. **Decide backup and retention** for `postgres-data` and `document-blobs`.
   Nothing in the application backs anything up.
7. **Create Google OAuth credentials**, if Google sign-in is wanted. Until
   both id and secret are set, the button is hidden — which is correct, and
   better than the error page it produced before Slice 15.
8. **Answer the residency question** in section 1 before any real client
   document is uploaded.

---

## 8. Ten minutes before a demo

```bash
cd onyxlegal-core
npm run demo:reset      # rebuilds the demo tenant exactly, from any state
npm run preflight       # GO / GO WITH CAVEATS / NO-GO, exit 0 or 1
```

`preflight` exits non-zero on any missing requirement, so it can gate a script
as well as be read by eye. It prints no secret and can safely be shown on a
shared screen.

See `DEMO.md` for the walkthrough.
