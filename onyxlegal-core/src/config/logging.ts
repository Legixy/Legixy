/**
 * What must never reach a log line.
 *
 * WHY THIS IS A SEPARATE FILE WITH ITS OWN TEST
 * ---------------------------------------------
 * Slice 6 established the rule for documents: never log file contents, never
 * put filenames in errors returned to a client. Slice 9 established it for
 * email: a reminder names the licence and the date and nothing else. Both
 * were enforced by review, which works until the day it does not.
 *
 * The stakes here are not abstract. A compliance system holds national ID
 * numbers, iqama numbers, GOSI registration numbers and commercial
 * registration certificates. Those are personal data under PDPL. A log
 * aggregator is a copy of everything it ingests, held somewhere nobody
 * audited, retained for however long the default is.
 *
 * So the rule is mechanical: redact by key at the logger, and assert over the
 * patterns in a test that fails if any of them ever appears in a log line.
 *
 * WHAT THIS DOES NOT DO
 * ---------------------
 * It cannot scrub a value interpolated into a free-text message —
 * `logger.log(\`Licence ${number} expired\`)` produces a string, and by the
 * time pino sees it there is no key to redact. That is what the test in
 * logging.spec.ts is for: it reads the SOURCE of every service and fails on
 * an interpolation of a sensitive field into a log call.
 */

/**
 * Object paths pino replaces with [redacted].
 *
 * Wildcards matter: the same field appears at the top level of a DTO, nested
 * under `req.body`, and inside an array of import rows.
 */
export const REDACT_PATHS = [
  // ── Credentials and tokens ──────────────────────────────────────────────
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'password',
  '*.password',
  '*.*.password',
  'currentPassword',
  'newPassword',
  'passwordResetToken',
  'access_token',
  'accessToken',
  'refreshToken',
  'token',
  '*.token',
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'DOCUMENT_ENCRYPTION_KEY',
  'SMTP_PASS',
  'GOOGLE_CLIENT_SECRET',

  // ── Identifiers on the certificates this product stores ─────────────────
  'licenseNumber',
  '*.licenseNumber',
  '*.*.licenseNumber',
  'nationalId',
  '*.nationalId',
  'iqamaNumber',
  '*.iqamaNumber',
  'gosiNumber',
  '*.gosiNumber',
  'crNumber',
  '*.crNumber',

  // ── Documents ───────────────────────────────────────────────────────────
  // A filename is often the licence number plus the holder's name.
  'filename',
  '*.filename',
  '*.*.filename',
  'originalName',
  'buffer',
  '*.buffer',
];

/**
 * Field names that must never be interpolated into a log message.
 *
 * The source scan in logging.spec.ts walks every service and fails when one
 * of these appears inside a template literal passed to a logger call.
 */
export const SENSITIVE_FIELDS = [
  'licenseNumber',
  'nationalId',
  'iqamaNumber',
  'gosiNumber',
  'crNumber',
  'filename',
  'originalName',
  'password',
  'accessToken',
  'refreshToken',
  'passwordResetToken',
];

/**
 * Level, by environment.
 *
 * `debug` on a laptop is useful. `debug` in a deployment writes every
 * reconcile for every licence, which is both noise and a larger surface for
 * something sensitive to slip into.
 */
export function logLevel(env: NodeJS.ProcessEnv = process.env): string {
  if (env.LOG_LEVEL) return env.LOG_LEVEL;
  return (env.NODE_ENV ?? 'development') === 'development' ? 'debug' : 'info';
}
