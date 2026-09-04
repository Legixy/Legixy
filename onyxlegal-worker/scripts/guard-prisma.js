#!/usr/bin/env node
/**
 * Refuses destructive Prisma commands from the worker directory.
 *
 * onyxlegal-worker/prisma/schema.prisma describes none of the eight compliance
 * models and has no migrations directory, yet DATABASE_URL points at the same
 * database Core uses. `prisma db push` from here would drop every compliance
 * table and everything in it.
 *
 * This is the friendly layer. The real enforcement is a Postgres event trigger
 * created by Core's 20260902000100_protect_compliance_tables migration, which
 * refuses the DROP no matter which client issues it. This script exists so the
 * mistake fails in one second with an explanation, rather than as a database
 * error halfway through a push.
 */

const BLOCKED = [
  ['db', 'push'],
  ['db', 'execute'],
  ['migrate', 'reset'],
  ['migrate', 'dev'],
  ['migrate', 'deploy'],
];

const args = process.argv.slice(2);
const match = BLOCKED.find(([a, b]) => args[0] === a && args[1] === b);

if (match) {
  console.error(`
╔══════════════════════════════════════════════════════════════════════╗
║  REFUSED: prisma ${match.join(' ')} from onyxlegal-worker
╚══════════════════════════════════════════════════════════════════════╝

This worker's schema does not describe the compliance domain:

  sites, licenses, license_reminders, authorities, license_types,
  tenant_license_requirements, license_documents, compliance_audit_log

It also has no migrations directory, and DATABASE_URL points at the same
database onyxlegal-core owns. Running this would drop all eight tables.

Schema changes belong in onyxlegal-core:

  cd ../onyxlegal-core && npx prisma migrate dev --name <change>

If you genuinely need to change the worker's view of the schema, copy the
model definitions from core first, and never use 'db push' against a
database that has migrations.
`);
  process.exit(1);
}

require('child_process').spawnSync('npx', ['prisma', ...args], {
  stdio: 'inherit',
});
