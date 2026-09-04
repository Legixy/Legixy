/**
 * The environment contract.
 *
 * ONE PLACE, VALIDATED AT STARTUP
 * -------------------------------
 * Before this file, configuration was read wherever it was needed:
 * `process.env.X` in a service constructor, `config.get('Y', 'default')` in a
 * module factory, twenty-two variables across nineteen files. Nothing
 * declared which were required. The failure mode was not a crash — it was a
 * default quietly applying and the system running in a shape nobody chose.
 *
 * Two examples that were live when this was written:
 *
 *   · GOOGLE_CLIENT_ID fell back to the literal string
 *     'GOOGLE_CLIENT_ID_NOT_SET', so "Continue with Google" sent users to
 *     Google's OAuth endpoint with an invalid client and an error page came
 *     back. A dead affordance, the fifth this project has found.
 *   · SMTP_HOST absent means reminders are computed, scheduled, claimed and
 *     then deferred forever. The product's single promise silently does not
 *     happen.
 *
 * WHY REQUIRED MEANS REFUSE TO START
 * ----------------------------------
 * Slice 8 established that warnings are ignored. DOCUMENT_ENCRYPTION_KEY
 * already fails closed outside development and it should never have been the
 * only one: a process that starts without a JWT secret is not degraded, it is
 * insecure, and one without a database is not running at all.
 *
 * Optional variables state their default here, in the open, rather than at
 * whichever call site happened to need one first.
 */

export type Requirement = 'required' | 'optional';

export interface VariableSpec {
  name: string;
  requirement: Requirement;
  /** What it is for, in one line. Printed by preflight. */
  purpose: string;
  /** Applied when absent. Only meaningful for optional variables. */
  default?: string;
  /** Rejects obviously wrong values. Returns a message, or null when fine. */
  validate?: (value: string) => string | null;
  /**
   * Required only outside development. The encryption key is the archetype:
   * a dev machine may run without it, a deployment may not.
   */
  requiredInProductionOnly?: boolean;
  /** True when the value must never be logged or printed. */
  secret?: boolean;
}

const isUrl = (protocols: string[]) => (value: string): string | null => {
  try {
    const url = new URL(value);
    return protocols.includes(url.protocol)
      ? null
      : `must use one of ${protocols.join(', ')} (got "${url.protocol}")`;
  } catch {
    return 'is not a valid URL';
  }
};

const isPort = (value: string): string | null =>
  /^\d+$/.test(value) && Number(value) > 0 && Number(value) < 65536
    ? null
    : 'must be a port number between 1 and 65535';

/**
 * Regions considered acceptable for data at rest.
 *
 * NOT A TECHNICAL CONTROL. Nothing here can stop a deployment landing in the
 * wrong place — see the residency note on DATA_REGION below. This list exists
 * so the choice is made deliberately and is visible in configuration rather
 * than inherited from whichever region a deploy button offered first.
 */
export const KNOWN_REGIONS = [
  'sa-riyadh',
  'sa-jeddah',
  'me-central-1',
  'me-south-1',
  'eu-west-1',
  'eu-central-1',
  'us-east-1',
  'local',
] as const;

/** Regions inside Saudi Arabia. Everything else is offshore. */
export const IN_KINGDOM_REGIONS = ['sa-riyadh', 'sa-jeddah', 'me-central-1'];

export const ENVIRONMENT: VariableSpec[] = [
  // ── Core runtime ────────────────────────────────────────────────────────
  {
    name: 'NODE_ENV',
    requirement: 'optional',
    default: 'development',
    purpose: 'Runtime mode. Anything other than "development" is treated as a deployment.',
  },
  {
    name: 'PORT',
    requirement: 'optional',
    default: '3001',
    purpose: 'TCP port the API listens on.',
    validate: isPort,
  },
  {
    name: 'DATABASE_URL',
    requirement: 'required',
    secret: true,
    purpose: 'PostgreSQL connection string. Every compliance record lives here.',
    validate: isUrl(['postgres:', 'postgresql:']),
  },
  {
    name: 'DATABASE_POOL_SIZE',
    requirement: 'optional',
    default: '10',
    purpose: 'Prisma connection pool size. Raise it only with Postgres max_connections.',
    validate: (v) => (/^\d+$/.test(v) && Number(v) > 0 ? null : 'must be a positive integer'),
  },
  {
    name: 'REDIS_URL',
    requirement: 'required',
    secret: true,
    purpose: 'BullMQ connection. The reminder scheduler will not run without it.',
    validate: isUrl(['redis:', 'rediss:']),
  },
  {
    name: 'JWT_SECRET',
    requirement: 'required',
    secret: true,
    purpose: 'Signs session tokens. A guessable value is a full authentication bypass.',
    validate: (v) =>
      v.length >= 32 ? null : 'must be at least 32 characters',
  },

  // ── Data residency ──────────────────────────────────────────────────────
  {
    name: 'DATA_REGION',
    requirement: 'required',
    purpose:
      'Where this deployment stores data. Declared, not enforced — see DEPLOYMENT.md.',
    validate: (v) =>
      (KNOWN_REGIONS as readonly string[]).includes(v)
        ? null
        : `must be one of: ${KNOWN_REGIONS.join(', ')}`,
  },
  {
    name: 'ALLOW_OFFSHORE_CLIENT_DOCUMENTS',
    requirement: 'optional',
    default: 'false',
    purpose:
      'Set true ONLY for synthetic demo data outside the Kingdom. Startup refuses '
      + 'an offshore DATA_REGION unless this is set deliberately.',
  },

  // ── Documents ───────────────────────────────────────────────────────────
  {
    name: 'DOCUMENT_ENCRYPTION_KEY',
    requirement: 'required',
    requiredInProductionOnly: true,
    secret: true,
    purpose: 'AES-256-GCM key for documents at rest. Fails closed outside development.',
    validate: (v) => (v.length >= 32 ? null : 'must be at least 32 characters'),
  },
  {
    name: 'DOCUMENT_STORAGE_PATH',
    requirement: 'optional',
    default: '<cwd>/.storage',
    purpose: 'Directory holding encrypted document blobs. Must survive restarts.',
  },
  {
    name: 'DOCUMENT_RETENTION_DAYS',
    requirement: 'optional',
    default: '30',
    purpose: 'Days a soft-deleted document is kept before the purge sweep removes it.',
    validate: (v) => (/^\d+$/.test(v) ? null : 'must be a whole number of days'),
  },
  {
    name: 'ALLOW_INSECURE_DEV_DOCUMENT_ENCRYPTION',
    requirement: 'optional',
    default: 'false',
    purpose: 'Development only. Permits uploads with no encryption key set.',
  },

  // ── Delivery ────────────────────────────────────────────────────────────
  // Optional as a set, and that is a real product decision: the system tracks
  // reminders it cannot send and says so on the readiness endpoint rather than
  // refusing to run. A licence register with no email is still worth having.
  {
    name: 'SMTP_HOST',
    requirement: 'optional',
    default: '(none — reminders are computed but never sent)',
    purpose: 'SMTP server. Absent means no delivery channel exists at all.',
  },
  {
    name: 'SMTP_PORT',
    requirement: 'optional',
    default: '587',
    purpose: 'Port on the SMTP server. 587 for STARTTLS, 465 for implicit TLS.',
    validate: isPort,
  },
  {
    name: 'SMTP_USER',
    requirement: 'optional',
    default: '(none — unauthenticated SMTP)',
    purpose: 'SMTP username. Omit for an unauthenticated relay.',
  },
  {
    name: 'SMTP_PASS',
    requirement: 'optional',
    secret: true,
    default: '(none)',
    purpose: 'SMTP password. Required whenever SMTP_USER is set.',
  },
  {
    name: 'SMTP_FROM',
    requirement: 'optional',
    default: 'noreply@legixy.com',
    purpose: 'From address on reminder emails.',
  },

  // ── URLs ────────────────────────────────────────────────────────────────
  {
    name: 'APP_URL',
    requirement: 'optional',
    default: 'http://localhost:3000',
    purpose: 'Public URL of the web app. Used in email links and OAuth redirects.',
    validate: isUrl(['http:', 'https:']),
  },
  {
    name: 'CORS_ORIGIN',
    requirement: 'optional',
    default: 'http://localhost:3000',
    purpose: 'Browser origin permitted to call the API. Comma-separated.',
  },

  // ── Scheduler ───────────────────────────────────────────────────────────
  {
    name: 'REMINDER_SCHEDULER_ENABLED',
    requirement: 'optional',
    default: 'true',
    purpose: 'Set "false" to run an instance that serves the API but sweeps nothing.',
  },

  // ── Google sign-in ──────────────────────────────────────────────────────
  // Optional, but as a SET. Configuring one without the others produced the
  // dead "Continue with Google" affordance; see validateEnvironment below.
  {
    name: 'GOOGLE_CLIENT_ID',
    requirement: 'optional',
    default: '(none — Google sign-in is hidden)',
    purpose: 'Google OAuth client id. Sign-in stays hidden until this and the secret are both set.',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    requirement: 'optional',
    secret: true,
    default: '(none)',
    purpose: 'Google OAuth client secret. Must be set together with the client id.',
  },
  {
    name: 'GOOGLE_CALLBACK_URL',
    requirement: 'optional',
    default: 'http://localhost:3001/api/v1/auth/google/callback',
    purpose: 'Where Google returns the user after consent.',
    validate: isUrl(['http:', 'https:']),
  },
];

export interface EnvironmentReport {
  ok: boolean;
  /** Fatal problems. Startup must refuse. */
  errors: string[];
  /** Non-fatal, but an operator should know. */
  warnings: string[];
  /** Optional variables running on their documented default. */
  defaulted: string[];
}

export function isDevelopmentEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.NODE_ENV ?? 'development') === 'development';
}

export function googleSignInConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

/**
 * Check the environment. Pure — takes the env, returns a report, touches
 * nothing. That is what lets preflight and the readiness endpoint share it.
 */
export function validateEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): EnvironmentReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const defaulted: string[] = [];
  const development = isDevelopmentEnv(env);

  for (const spec of ENVIRONMENT) {
    const raw = env[spec.name];
    const present = raw !== undefined && raw !== '';

    const required =
      spec.requirement === 'required' &&
      (!spec.requiredInProductionOnly || !development);

    if (!present) {
      if (required) {
        errors.push(`${spec.name} is required but not set — ${spec.purpose}`);
      } else if (spec.default !== undefined) {
        defaulted.push(`${spec.name} = ${spec.default}`);
      }
      continue;
    }

    const problem = spec.validate?.(raw);
    if (problem) errors.push(`${spec.name} ${problem}`);
  }

  // ── Cross-variable rules ────────────────────────────────────────────────

  // Google: all or nothing. A half-configured client is the dead affordance.
  const googleParts = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ].filter((n) => env[n]);
  if (googleParts.length === 1) {
    errors.push(
      `Google sign-in is half-configured: ${googleParts[0]} is set but the other is not. ` +
        'Set both, or neither. A partial client sends users to an OAuth error page.',
    );
  }

  // SMTP: a host with no from-address is a message nobody can reply to, and a
  // user with no password will fail at send time rather than at startup.
  if (env.SMTP_HOST && env.SMTP_USER && !env.SMTP_PASS) {
    errors.push(
      'SMTP_USER is set but SMTP_PASS is not. Authentication will fail at send time, ' +
        'which is the worst moment to discover it.',
    );
  }
  if (!env.SMTP_HOST) {
    warnings.push(
      'No delivery channel: SMTP_HOST is not set. Reminders will be computed and ' +
        'scheduled but never sent. This is reported on /health/ready.',
    );
  }

  // Residency. Offshore is permitted only when deliberately declared.
  const region = env.DATA_REGION;
  if (region && !IN_KINGDOM_REGIONS.includes(region) && region !== 'local') {
    if (env.ALLOW_OFFSHORE_CLIENT_DOCUMENTS !== 'true') {
      errors.push(
        `DATA_REGION "${region}" is outside Saudi Arabia. Client documents include ` +
          'national ID, iqama, GOSI and commercial registration records, which are ' +
          'personal data under PDPL. Set ALLOW_OFFSHORE_CLIENT_DOCUMENTS=true only ' +
          'if this deployment holds synthetic demo data. See DEPLOYMENT.md.',
      );
    } else {
      warnings.push(
        `DATA_REGION "${region}" is offshore and ALLOW_OFFSHORE_CLIENT_DOCUMENTS is ` +
          'true. This deployment must hold synthetic data only.',
      );
    }
  }

  if (!development && env.ALLOW_INSECURE_DEV_DOCUMENT_ENCRYPTION === 'true') {
    errors.push(
      'ALLOW_INSECURE_DEV_DOCUMENT_ENCRYPTION is true outside development. ' +
        'That flag exists for a laptop, never for a deployment.',
    );
  }

  return { ok: errors.length === 0, errors, warnings, defaulted };
}
