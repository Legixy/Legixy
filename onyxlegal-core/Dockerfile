# Legixy Core — API and reminder scheduler.
#
# ONE PROCESS DOES BOTH. Slice 4 established that the scheduler belongs in
# Core rather than in the separate worker application, and Slice 12 explains
# why the worker must never be deployed at all: it has no migrations
# directory and its Prisma schema knows none of the compliance models, so a
# `db push` from it DROPS eight tables. See DEPLOYMENT.md.

# ── Build ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Dependencies first, so a source change does not re-install node_modules.
COPY package*.json ./
RUN npm ci

# The Prisma client is generated from the schema and must exist before tsc.
COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

# ── Runtime ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

# Riyadh. Every expiry calculation reads the TENANT's timezone from the
# database rather than the process clock, so this is not load-bearing — but a
# container whose logs are in UTC while the business is in +03 makes every
# incident harder to read than it needs to be.
ENV TZ=Asia/Riyadh
ENV NODE_ENV=production

RUN apk add --no-cache tini && \
    addgroup -S legixy && adduser -S legixy -G legixy

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
# Migrations ship WITH the image. A deployment that cannot see its own
# migration files cannot apply them, and `db push` is not an acceptable
# substitute — it leaves no history and drops columns without asking.
COPY --from=build /app/prisma ./prisma

# Encrypted document blobs. MUST be a mounted volume in any real deployment:
# a container filesystem is ephemeral, and losing this loses every uploaded
# certificate while the database still lists them as present.
RUN mkdir -p /data/documents && chown -R legixy:legixy /data
ENV DOCUMENT_STORAGE_PATH=/data/documents
VOLUME ["/data/documents"]

USER legixy
EXPOSE 3001

# Liveness only. Reveals nothing; see health.controller.ts for the split.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3001/api/v1/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# tini reaps zombies and forwards signals, so a SIGTERM actually reaches Nest
# and in-flight reminder claims are released rather than left locked.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/src/main"]
