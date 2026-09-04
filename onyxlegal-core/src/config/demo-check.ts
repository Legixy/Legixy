#!/usr/bin/env node
/**
 * `npm run demo:check` — run this twenty minutes before a client meeting.
 *
 * WHY IT EXISTS AND PREFLIGHT DOES NOT COVER IT
 * ---------------------------------------------
 * Preflight checks configuration and the database. It cannot tell you the app
 * renders, because it never asks the app for a page.
 *
 * Slice 17 removed some dead `@keyframes` with a regex, left five orphaned
 * closing braces, and PostCSS refused to load globals.css. Every page returned
 * 500 and the login form rendered zero inputs. **All 284 frontend tests
 * passed**, because every assertion reads that file as text.
 *
 * Slice 19 measured the hole: with globals.css replaced by an EMPTY FILE,
 * 278 of 286 tests still pass. With that exact syntax error, 285 of 286 pass —
 * and the one failure is a brace check added afterwards, in hindsight.
 *
 * So the mechanism here is deliberately not another reader. It ASKS THE APP
 * FOR EVERY PAGE ON THE DEMO PATH and looks at what comes back. A stylesheet
 * that does not parse, a component that throws, a bad import, a broken route
 * — all of them produce the same visible symptom, and this catches the
 * symptom rather than any one cause.
 *
 * EXIT CODE IS THE CONTRACT. 0 = go, 1 = stop. Someone will script it.
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { validateEnvironment } from './environment';

dotenv.config();

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const pass = (m: string) => console.log(`  ${GREEN}✓${RESET} ${m}`);
const fail = (m: string) => console.log(`  ${RED}✗${RESET} ${m}`);
const warn = (m: string) => console.log(`  ${YELLOW}!${RESET} ${m}`);
const note = (m: string) => console.log(`    ${DIM}${m}${RESET}`);
const heading = (t: string) => console.log(`\n${BOLD}${t}${RESET}`);

const WEB = process.env.APP_URL ?? 'http://localhost:3000';
const API = `http://localhost:${process.env.PORT ?? 3001}/api/v1`;

/** Every page the walkthrough opens. Signed out, so these are the shells. */
const DEMO_ROUTES = [
  '/login',
  '/dashboard',
  '/dashboard/sites',
  '/dashboard/sites/new',
  '/dashboard/licenses',
  '/dashboard/licenses/new',
  '/dashboard/licenses/import',
  '/dashboard/year-ahead',
  '/dashboard/gaps',
  '/dashboard/requirements',
  '/dashboard/delivery',
  '/dashboard/preferences',
];

/**
 * Sign in as the demo owner so the dashboard routes RENDER rather than
 * redirect.
 *
 * A 307 to /login proves the route exists and nothing more. The brief for
 * this command asks for real content, and a component that throws on the
 * year-ahead page would sail past a redirect check. The credentials are the
 * demo tenant's own, defined in prisma/demo-reset.ts — this command is for a
 * demo environment and says so.
 *
 * Returns null when sign-in fails, and the caller degrades to checking the
 * shells rather than reporting every route as broken.
 */
async function signIn(): Promise<string | null> {
  try {
    /*
      The WEB origin, not the API.

      The Nest login returns a token in the body and sets no cookie; the
      HttpOnly `auth_token` cookie the pages actually read is set by the
      Next route at /api/auth/login. Signing in against Nest returned 200
      with no Set-Cookie, and this check quietly degraded to shells — which
      is exactly the silent-pass shape this whole command exists to stop.
    */
    const response = await fetch(`${WEB}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nadia@masaralkhaleej.example',
        password: 'Demo2026!legixy',
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return null;
    const cookie = response.headers.get('set-cookie');
    return cookie ? cookie.split(';')[0] : null;
  } catch {
    return null;
  }
}

/**
 * A page that "works" is not merely a 200.
 *
 * Next returns 200 with an error shell for a compile failure, so the status
 * code alone is worthless here — that is exactly how the broken stylesheet
 * went unnoticed. These are the signatures of a page that did not build.
 */
const BUILD_FAILURE = [
  /CssSyntaxError/i,
  /Error evaluating Node.js code/i,
  /Failed to compile/i,
  /Module not found/i,
  /__next_error__/,
  /"statusCode":500/,
];

interface RouteResult {
  route: string;
  ok: boolean;
  detail: string;
}

async function checkRoute(route: string, cookie: string | null): Promise<RouteResult> {
  try {
    const response = await fetch(`${WEB}${route}`, {
      redirect: 'manual',
      headers: cookie ? { cookie } : {},
      signal: AbortSignal.timeout(20_000),
    });

    // Signed in, a dashboard route must render. Signed out it may redirect,
    // and that is all a redirect proves — see signIn above.
    if (response.status >= 300 && response.status < 400) {
      return cookie && route !== '/login'
        ? { route, ok: false, detail: 'redirected while signed in' }
        : { route, ok: true, detail: `redirects (${response.status})` };
    }
    if (response.status !== 200) {
      return { route, ok: false, detail: `HTTP ${response.status}` };
    }

    const html = await response.text();

    for (const signature of BUILD_FAILURE) {
      if (signature.test(html)) {
        return {
          route,
          ok: false,
          detail: `the page did not build (${signature.source.slice(0, 28)})`,
        };
      }
    }

    // An empty shell is a 200 with no content. A real page has markup.
    if (html.length < 1000) {
      return { route, ok: false, detail: `empty shell (${html.length} bytes)` };
    }

    return { route, ok: true, detail: `${Math.round(html.length / 1024)}kb` };
  } catch (error) {
    return { route, ok: false, detail: `unreachable (${(error as Error).name})` };
  }
}

async function main(): Promise<void> {
  const problems: string[] = [];
  const advisories: string[] = [];

  console.log(`\n${BOLD}Legixy demo check${RESET}`);
  console.log(`${DIM}${new Date().toISOString()}${RESET}`);

  // ── Configuration ───────────────────────────────────────────────────────
  heading('Configuration');
  const environment = validateEnvironment();
  for (const problem of environment.errors) {
    fail(problem);
    problems.push(problem);
  }
  for (const warning of environment.warnings) {
    warn(warning);
    advisories.push(warning);
  }
  if (environment.errors.length === 0) pass('Required variables set and valid.');

  // ── The app renders ─────────────────────────────────────────────────────
  // FIRST, because it is the failure this command exists for.
  heading('Every page on the demo path');
  const cookie = await signIn();
  if (cookie) {
    note('Signed in as the demo owner — pages are rendered, not redirected.');
  } else {
    warn('Could not sign in; checking page shells only.');
    advisories.push('demo sign-in failed — routes checked as shells');
  }
  const results = await Promise.all(
    DEMO_ROUTES.map((route) => checkRoute(route, cookie)),
  );
  const broken = results.filter((r) => !r.ok);

  for (const result of results) {
    if (result.ok) pass(`${result.route} ${DIM}${result.detail}${RESET}`);
    else fail(`${result.route} — ${result.detail}`);
  }
  if (broken.length > 0) {
    problems.push(`${broken.length} route(s) do not render`);
    note('If several fail at once, suspect a stylesheet or a shared import.');
  }

  // ── Data ────────────────────────────────────────────────────────────────
  heading('Demo data');
  let prisma: PrismaClient | null = null;
  try {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
    await prisma.$queryRaw`SELECT 1`;
    pass('PostgreSQL reachable.');

    const licences = await prisma.license.count();
    const tenants = await prisma.tenant.count();
    const noLadder = await prisma.license.count({
      where: { expiryDate: { not: null }, reminders: { none: {} } },
    });
    const expired = await prisma.license.count({
      where: { lifecycle: 'ACTIVE', expiryDate: { lt: new Date() } },
    });
    const unassigned = await prisma.license.count({
      where: { lifecycle: 'ACTIVE', ownerUserId: null },
    });

    if (tenants === 0 || licences === 0) {
      fail('No demo data. Run `npm run demo:reset`.');
      problems.push('no demo data');
    } else {
      pass(`${tenants} tenant(s), ${licences} licence(s).`);

      if (noLadder > 0) {
        // The Slice 4 bug: rows written past the service layer get no
        // reminders and nothing looks wrong until nothing is ever sent.
        fail(`${noLadder} licence(s) have an expiry but no reminders.`);
        problems.push('licences without a reminder ladder');
      } else {
        pass('Every licence with an expiry has a reminder ladder.');
      }

      // The walkthrough points at these specifically. If they are absent the
      // script does not work, even though nothing is broken.
      if (expired === 0) {
        warn('No expired licence — walkthrough step 2 has nothing to point at.');
        advisories.push('no expired licence');
      }
      if (unassigned === 0) {
        warn('No unassigned licence — the ownership step loses its example.');
        advisories.push('no unassigned licence');
      }
    }

    // ── Scheduler and delivery ────────────────────────────────────────────
    heading('Reminders');
    const schedulerOn =
      process.env.REMINDER_SCHEDULER_ENABLED !== 'false';
    const lastSent = await prisma.licenseReminder.findFirst({
      where: { sentAt: { not: null } },
      orderBy: { sentAt: 'desc' },
      select: { sentAt: true },
    });

    if (schedulerOn) {
      pass(
        lastSent?.sentAt
          ? `Scheduler enabled. Last delivery ${lastSent.sentAt.toISOString()}.`
          : 'Scheduler enabled. No delivery recorded yet.',
      );
    } else {
      warn('Scheduler disabled by REMINDER_SCHEDULER_ENABLED=false.');
      advisories.push('scheduler disabled');
    }

    if (!process.env.SMTP_HOST) {
      warn('NO DELIVERY CHANNEL — reminders are scheduled but not sent.');
      note('Walkthrough step 6 must say so rather than claim a message went out.');
      advisories.push('no delivery channel');
    } else {
      pass(`Email configured, sending as ${process.env.SMTP_FROM ?? 'noreply@legixy.com'}.`);
    }
  } catch (error) {
    // Never echo the body: a Prisma connection error contains the URL.
    fail(`Database not reachable (${(error as Error).name}).`);
    problems.push('database unreachable');
  } finally {
    await prisma?.$disconnect().catch(() => undefined);
  }

  // ── API ─────────────────────────────────────────────────────────────────
  heading('API');
  try {
    const response = await fetch(`${API}/health`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) pass('Core is answering.');
    else {
      fail(`Core returned HTTP ${response.status}.`);
      problems.push('core not healthy');
    }
  } catch {
    fail('Core is not reachable. Start it with `npm run start:dev`.');
    problems.push('core unreachable');
  }

  // ── Verdict ─────────────────────────────────────────────────────────────
  console.log('');
  const unique = [...new Set(advisories)];
  if (problems.length === 0 && unique.length === 0) {
    console.log(`${GREEN}${BOLD}  GO — everything checks out.${RESET}\n`);
    process.exit(0);
  }
  if (problems.length === 0) {
    console.log(`${YELLOW}${BOLD}  GO, WITH CAVEATS${RESET}`);
    console.log(`${DIM}  These will be visible in the demo:${RESET}`);
    for (const a of unique) console.log(`    · ${a}`);
    console.log('');
    process.exit(0);
  }
  console.log(`${RED}${BOLD}  NO-GO — ${problems.length} problem(s):${RESET}`);
  for (const p of problems) console.log(`    · ${p}`);
  console.log('');
  process.exit(1);
}

main().catch((error) => {
  console.error(`\n${RED}demo:check itself failed: ${(error as Error).message}${RESET}\n`);
  process.exit(1);
});
