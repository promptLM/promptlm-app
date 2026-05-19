#!/usr/bin/env node
/**
 * Capture marketing-site screenshots of the studio surfaces.
 *
 * Renders the JSX-based webui handoff (design/handoff/webui) at the
 * routes we care about, hides the designer-only route-bar, and writes
 * PNGs into site/media/.
 *
 * Prereqs:
 *   - The "handoff-webui" preview server must be running on port 5181
 *     (see .claude/launch.json). Locally: `python3 -m http.server 5181
 *     --directory design/handoff/webui`.
 *   - playwright must be installed: `npm i -D playwright` once, then
 *     `npx playwright install chromium` once.
 *
 * Usage:
 *   node scripts/shoot-studio-screens.mjs
 *
 * Output files (committed):
 *   site/media/studio-catalog.png  ← #/prompts          (catalog)
 *   site/media/studio-detail.png   ← #/prompts/detail   (release-pinned detail)
 *
 * The script writes at deviceScaleFactor 2 then scales down to 1500w
 * via `sips`, matching what's currently committed. If you change the
 * source surface, re-run and commit the regenerated PNGs.
 */

import { chromium } from 'playwright';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'site/media');
const BASE = 'http://localhost:5181/';

const SHOTS = [
  { hash: '#/prompts',        out: path.join(OUT_DIR, 'studio-catalog.png') },
  { hash: '#/prompts/detail', out: path.join(OUT_DIR, 'studio-detail.png')  },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

for (const { hash, out } of SHOTS) {
  await page.goto(BASE + hash, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.route-bar { display: none !important; }' });
  // Babel-transpiled JSX needs a beat after the URL hash flips. Give the
  // SPA's hashchange handler time to swap the route component in.
  await page.waitForTimeout(500);
  await page.screenshot({ path: out, fullPage: false });
  // Scale to 1500w — retina-sharp at the landing page's display width,
  // ~half the byte size of the raw 2x capture.
  await exec('sips', ['-Z', '1500', out]);
  console.log(`✓ ${hash} → ${path.relative(ROOT, out)}`);
}

await browser.close();
