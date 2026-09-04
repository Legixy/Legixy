import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  ENVIRONMENT,
  IN_KINGDOM_REGIONS,
  googleSignInConfigured,
  validateEnvironment,
} from './environment';
import { REDACT_PATHS, SENSITIVE_FIELDS, logLevel } from './logging';

/**
 * The configuration contract, and the logging one.
 *
 * These are unit tests over pure functions and over the SOURCE. They need no
 * database and no running application, which matters: the whole point of
 * failing closed at startup is that it happens before anything is connected.
 */

/** A complete, valid environment. Every test starts from this and breaks it. */
const COMPLETE: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:pw@db:5432/legixy',
  REDIS_URL: 'redis://cache:6379',
  JWT_SECRET: 'x'.repeat(48),
  DATA_REGION: 'sa-riyadh',
  DOCUMENT_ENCRYPTION_KEY: 'k'.repeat(48),
};

describe('environment contract', () => {
  // ── 4 ────────────────────────────────────────────────────────────────────
  describe('missing required configuration refuses startup, naming what is missing', () => {
    const required = ENVIRONMENT.filter(
      (v) => v.requirement === 'required' && !v.requiredInProductionOnly,
    );

    it('has required variables to check', () => {
      // Guards against the loop below silently testing nothing.
      expect(required.length).toBeGreaterThan(0);
    });

    for (const spec of required) {
      it(`refuses to start without ${spec.name}, and says so by name`, () => {
        const env = { ...COMPLETE };
        delete env[spec.name];

        const report = validateEnvironment(env);
        expect(report.ok).toBe(false);
        expect(report.errors.join(' ')).toContain(spec.name);
      });
    }

    it('accepts a complete environment', () => {
      const report = validateEnvironment(COMPLETE);
      expect(report.errors).toEqual([]);
      expect(report.ok).toBe(true);
    });

    /**
     * The encryption key is required in a deployment and optional on a laptop.
     * Slice 7 built that asymmetry deliberately; this pins it.
     */
    it('requires the encryption key in production but not in development', () => {
      const prod = { ...COMPLETE };
      delete prod.DOCUMENT_ENCRYPTION_KEY;
      expect(validateEnvironment(prod).ok).toBe(false);
      expect(validateEnvironment(prod).errors.join(' ')).toContain(
        'DOCUMENT_ENCRYPTION_KEY',
      );

      const dev = { ...prod, NODE_ENV: 'development' };
      expect(validateEnvironment(dev).ok).toBe(true);
    });

    it('rejects a value that is present but invalid', () => {
      expect(
        validateEnvironment({ ...COMPLETE, JWT_SECRET: 'short' }).errors.join(' '),
      ).toMatch(/JWT_SECRET.*32 characters/);

      expect(
        validateEnvironment({ ...COMPLETE, DATABASE_URL: 'mysql://x/y' }).errors.join(' '),
      ).toMatch(/DATABASE_URL/);

      expect(
        validateEnvironment({ ...COMPLETE, DATA_REGION: 'mars-1' }).errors.join(' '),
      ).toMatch(/DATA_REGION/);
    });
  });

  // ── 5 ────────────────────────────────────────────────────────────────────
  describe('optional variables apply their documented default', () => {
    it('reports each absent optional variable with the default it will use', () => {
      const report = validateEnvironment(COMPLETE);
      const defaulted = report.defaulted.join(' ');

      expect(defaulted).toContain('SMTP_PORT = 587');
      expect(defaulted).toContain('DOCUMENT_RETENTION_DAYS = 30');
      expect(defaulted).toContain('REMINDER_SCHEDULER_ENABLED = true');
    });

    it('every optional variable declares a default', () => {
      const missing = ENVIRONMENT.filter(
        (v) => v.requirement === 'optional' && v.default === undefined,
      ).map((v) => v.name);
      // An optional variable with no stated default is a variable whose
      // behaviour when absent is undocumented, which is the thing this file
      // exists to eliminate.
      expect(missing).toEqual([]);
    });

    it('every variable explains itself', () => {
      const silent = ENVIRONMENT.filter((v) => !v.purpose || v.purpose.length < 12);
      expect(silent.map((v) => v.name)).toEqual([]);
    });
  });

  describe('cross-variable rules', () => {
    /** The fifth dead affordance. */
    it('refuses a half-configured Google client', () => {
      const half = { ...COMPLETE, GOOGLE_CLIENT_ID: 'abc.apps.googleusercontent.com' };
      const report = validateEnvironment(half);
      expect(report.ok).toBe(false);
      expect(report.errors.join(' ')).toMatch(/half-configured/i);

      const both = { ...half, GOOGLE_CLIENT_SECRET: 'secret' };
      expect(validateEnvironment(both).ok).toBe(true);
      expect(googleSignInConfigured(both)).toBe(true);
      expect(googleSignInConfigured(COMPLETE)).toBe(false);
    });

    it('refuses SMTP auth that would fail at send time', () => {
      const env = { ...COMPLETE, SMTP_HOST: 'smtp.example.com', SMTP_USER: 'u' };
      expect(validateEnvironment(env).ok).toBe(false);
      expect(validateEnvironment(env).errors.join(' ')).toContain('SMTP_PASS');
    });

    it('refuses the insecure-encryption escape hatch outside development', () => {
      const env = { ...COMPLETE, ALLOW_INSECURE_DEV_DOCUMENT_ENCRYPTION: 'true' };
      expect(validateEnvironment(env).ok).toBe(false);
      expect(validateEnvironment(env).errors.join(' ')).toMatch(/never for a deployment/);
    });
  });

  describe('data residency', () => {
    it('accepts an in-Kingdom region without ceremony', () => {
      for (const region of IN_KINGDOM_REGIONS) {
        const report = validateEnvironment({ ...COMPLETE, DATA_REGION: region });
        expect({ region, ok: report.ok }).toEqual({ region, ok: true });
      }
    });

    /**
     * The boundary the brief exists to make explicit: synthetic demo data can
     * live anywhere; real client documents probably cannot leave the Kingdom.
     * This does not enforce residency — it makes crossing it deliberate.
     */
    it('refuses an offshore region unless offshore data is explicitly allowed', () => {
      const offshore = { ...COMPLETE, DATA_REGION: 'eu-west-1' };
      const report = validateEnvironment(offshore);
      expect(report.ok).toBe(false);
      expect(report.errors.join(' ')).toMatch(/PDPL/);
      expect(report.errors.join(' ')).toMatch(/ALLOW_OFFSHORE_CLIENT_DOCUMENTS/);

      const allowed = { ...offshore, ALLOW_OFFSHORE_CLIENT_DOCUMENTS: 'true' };
      const second = validateEnvironment(allowed);
      expect(second.ok).toBe(true);
      // Permitted, but never silent.
      expect(second.warnings.join(' ')).toMatch(/synthetic data only/i);
    });

    it('treats "local" as neither offshore nor in-Kingdom', () => {
      expect(validateEnvironment({ ...COMPLETE, DATA_REGION: 'local' }).ok).toBe(true);
    });
  });

  describe('delivery', () => {
    // ── 6 ──────────────────────────────────────────────────────────────────
    it('warns plainly when no delivery channel exists', () => {
      const report = validateEnvironment(COMPLETE);
      expect(report.ok).toBe(true); // does not block startup
      expect(report.warnings.join(' ')).toMatch(/never sent/);
    });

    it('stops warning once a channel is configured', () => {
      const env = { ...COMPLETE, SMTP_HOST: 'smtp.example.com' };
      expect(validateEnvironment(env).warnings.join(' ')).not.toMatch(/never sent/);
    });
  });
});

describe('logging', () => {
  it('raises the level outside development', () => {
    expect(logLevel({ NODE_ENV: 'development' })).toBe('debug');
    expect(logLevel({ NODE_ENV: 'production' })).toBe('info');
    expect(logLevel({ NODE_ENV: 'production', LOG_LEVEL: 'warn' })).toBe('warn');
  });

  it('redacts every credential and every certificate identifier', () => {
    const joined = REDACT_PATHS.join(' ');
    for (const field of [
      'password',
      'authorization',
      'cookie',
      'DOCUMENT_ENCRYPTION_KEY',
      'SMTP_PASS',
      'JWT_SECRET',
      'licenseNumber',
      'nationalId',
      'iqamaNumber',
      'gosiNumber',
      'crNumber',
      'filename',
    ]) {
      expect({ field, redacted: joined.includes(field) }).toEqual({
        field,
        redacted: true,
      });
    }
  });

  // ── 10 ───────────────────────────────────────────────────────────────────
  /**
   * Redaction by key cannot save a value interpolated into a message string.
   * This scans the source for exactly that.
   *
   * Slice 6 kept filenames out of client-facing errors by review. This is the
   * mechanical version, and it covers the case review misses: a debug line
   * added during an investigation and never removed.
   */
  it('interpolates no sensitive field into any log call', () => {
    const SRC = resolve(__dirname, '..');
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);
        if (entry === 'node_modules') return [];
        return statSync(full).isDirectory() ? walk(full) : [full];
      });

    const files = walk(SRC).filter(
      (f) => /\.ts$/.test(f) && !/\.spec\.ts$/.test(f),
    );

    // logger.log(`...`) / this.logger.error(`...`) / console.warn(`...`)
    const LOG_CALL =
      /(?:logger|console)\s*\.\s*(?:log|warn|error|debug|verbose|info|fatal)\s*\(([^;]*?)\)\s*;/gs;

    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');

      for (const match of source.matchAll(LOG_CALL)) {
        // Quoted strings are stripped first. The scan looks for a VALUE being
        // interpolated, and `${flag ? 'username + password' : 'none'}` merely
        // contains the word — smtp-test.ts printed exactly that and tripped an
        // earlier version of this test.
        const args = match[1]
          .replace(/'(?:[^'\\]|\\.)*'/g, "''")
          .replace(/"(?:[^"\\]|\\.)*"/g, '""');

        for (const field of SENSITIVE_FIELDS) {
          // `${x.licenseNumber}` or `${licenseNumber}` inside the call.
          const interpolated = new RegExp(
            '\\$\\{[^}]*\\b' + field + '\\b[^}]*\\}',
          );
          if (interpolated.test(args)) {
            offenders.push(`${file.replace(SRC, 'src')}: ${field}`);
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('the source scan is not vacuous', () => {
    const LOG_CALL =
      /(?:logger|console)\s*\.\s*(?:log|warn|error|debug|verbose|info|fatal)\s*\(([^;]*?)\)\s*;/gs;

    const bad = 'this.logger.log(`Licence ${licence.licenseNumber} expired`);';
    const matches = [...bad.matchAll(LOG_CALL)];
    expect(matches).toHaveLength(1);
    expect(/\$\{[^}]*\blicenseNumber\b[^}]*\}/.test(matches[0][1])).toBe(true);

    // And must not fire on a safe line.
    const good = 'this.logger.log(`Licence ${licence.id} expired`);';
    const safe = [...good.matchAll(LOG_CALL)];
    expect(/\$\{[^}]*\blicenseNumber\b[^}]*\}/.test(safe[0][1])).toBe(false);

    // Stripping string literals must not blind the scan to a real value.
    const strip = (s: string) =>
      s.replace(/'(?:[^'\\]|\\.)*'/g, "''").replace(/"(?:[^"\\]|\\.)*"/g, '""');

    // A literal mentioning the word is NOT a leak.
    expect(/\$\{[^}]*\bpassword\b[^}]*\}/.test(strip("`${a ? 'my password' : 'none'}`"))).toBe(false);
    // An actual value still is.
    expect(/\$\{[^}]*\bpassword\b[^}]*\}/.test(strip('`${user.password}`'))).toBe(true);
  });
});
