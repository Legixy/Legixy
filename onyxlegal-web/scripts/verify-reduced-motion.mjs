/**
 * Does `@media (prefers-reduced-motion: reduce)` ACTUALLY neutralise motion?
 *
 * WHY THIS SCRIPT EXISTS
 * ----------------------
 * For three slices this was verified by READING globals.css and confirming a
 * rule was present. That is not verification: it cannot tell you the rule
 * applies, that nothing overrides it, or that it covers the elements that
 * actually move. Slice 22 hit exactly this class of error twice — a focus ring
 * read at t=0 of its own transition, reported as "no focus indicator".
 *
 * The browse tool denies `Emulation.setEmulatedMedia` as un-allowlisted CDP,
 * so the media feature cannot be toggled there. Chrome accepts
 * `--force-prefers-reduced-motion` as a launch flag, which exercises the real
 * query in the real engine. This drives it over raw CDP.
 *
 * It is a two-run differential, not a single reading: once with the flag and
 * once without. A rule that is deleted, weakened, or overridden makes the two
 * runs agree, and agreement is the failure.
 *
 * Usage:  node scripts/verify-reduced-motion.mjs [url]
 * Exit:   0 motion is neutralised, 1 it is not.
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const URL_UNDER_TEST = process.argv[2] ?? 'http://localhost:3000/login';
const CHROME =
  process.env.CHROME_PATH ??
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/` +
    `Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;

const PROBE = `(() => {
  const moving = [...document.querySelectorAll('*')].filter((el) => {
    const s = getComputedStyle(el);
    const t = (s.transitionDuration || '0s').split(',').map((v) => parseFloat(v) || 0);
    const a = (s.animationDuration || '0s').split(',').map((v) => parseFloat(v) || 0);
    return Math.max(...t, ...a) > 0.05;
  });
  return JSON.stringify({
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    moving: moving.length,
    worst: moving.reduce((m, el) => {
      const s = getComputedStyle(el);
      const v = Math.max(
        ...(s.transitionDuration || '0s').split(',').map((x) => parseFloat(x) || 0),
        ...(s.animationDuration || '0s').split(',').map((x) => parseFloat(x) || 0),
      );
      return Math.max(m, v);
    }, 0),
  });
})()`;

async function run(port, reduce) {
  const args = [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=/tmp/rm-profile-${port}`,
    'about:blank',
  ];
  if (reduce) args.unshift('--force-prefers-reduced-motion');

  const chrome = spawn(CHROME, args, { stdio: 'ignore' });
  try {
    let version = null;
    for (let i = 0; i < 60 && !version; i++) {
      await sleep(250);
      try {
        version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      } catch {}
    }
    if (!version) throw new Error('Chrome did not expose a debugging endpoint');

    const ws = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = () => rej(new Error('CDP socket failed'));
    });

    let id = 0;
    const pending = new Map();
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) {
        pending.get(m.id)(m);
        pending.delete(m.id);
      }
    };
    const send = (method, params = {}, sessionId) =>
      new Promise((res) => {
        const msg = { id: ++id, method, params };
        if (sessionId) msg.sessionId = sessionId;
        pending.set(msg.id, res);
        ws.send(JSON.stringify(msg));
      });

    const { result: target } = await send('Target.createTarget', { url: 'about:blank' });
    const { result: attached } = await send('Target.attachToTarget', {
      targetId: target.targetId,
      flatten: true,
    });
    const session = attached.sessionId;

    await send('Page.enable', {}, session);
    await send('Runtime.enable', {}, session);
    await send('Page.navigate', { url: URL_UNDER_TEST }, session);
    await sleep(4500);

    const out = await send(
      'Runtime.evaluate',
      { expression: PROBE, returnByValue: true },
      session,
    );
    ws.close();
    const value = out?.result?.result?.value;
    if (!value) throw new Error('probe returned nothing');
    return JSON.parse(value);
  } finally {
    chrome.kill('SIGKILL');
  }
}

const withFlag = await run(9411, true);
const without = await run(9412, false);

console.log(`\n  reduced-motion verification — ${URL_UNDER_TEST}\n`);
console.log(`  with --force-prefers-reduced-motion : matches=${withFlag.reduced}` +
            `  animating=${withFlag.moving}  longest=${withFlag.worst}s`);
console.log(`  without the flag                   : matches=${without.reduced}` +
            `  animating=${without.moving}  longest=${without.worst}s\n`);

const problems = [];
if (!withFlag.reduced) problems.push('the media query did not match under the flag — harness fault, not a product result');
if (without.moving === 0) problems.push('nothing animates without the flag, so this page cannot prove anything');
if (withFlag.moving > 0) problems.push(`${withFlag.moving} element(s) still animate under reduced motion (longest ${withFlag.worst}s)`);

if (problems.length) {
  console.log('  FAIL');
  for (const p of problems) console.log(`    · ${p}`);
  console.log('');
  process.exit(1);
}
console.log(`  PASS — ${without.moving} animating element(s) neutralised to zero.\n`);
process.exit(0);
