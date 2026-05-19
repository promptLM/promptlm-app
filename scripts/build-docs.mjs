#!/usr/bin/env node
/**
 * promptLM docs build
 * ───────────────────
 * Renders AsciiDoc source under docs/pages/**\/*.adoc into HTML pages
 * under site/docs/, wrapping each in the brand chrome at
 * docs/templates/page.html.
 *
 * What this script does (in order):
 *   1. Loads the sidebar nav from docs/nav.yml.
 *   2. For each .adoc file:
 *      a. Parses with Asciidoctor.js (`safe: 'safe'`, no FS access).
 *      b. Extracts title, attributes (page-section, page-slug,
 *         page-prev/next, page-description), and the rendered body HTML.
 *      c. Replaces the custom block macro `widget::<name>[]` with the
 *         partial at docs/templates/widgets/<name>.html.
 *      d. Annotates listing blocks with `data-lang` so CSS can show the
 *         language tag (BASH / TS / …).
 *      e. Builds the on-this-page TOC from section1 headings.
 *      f. Builds the sidebar HTML from nav.yml, marking the current
 *         page with aria-current="page".
 *      g. Substitutes {{slots}} in the template and writes
 *         site/docs/<slug>.html.
 *   3. Writes docs.css next to the pages so they can <link> it
 *      with a relative href.
 *
 * Run with: `npm run docs:build` (or `node scripts/build-docs.mjs`).
 * No flags, no watch mode — keep it boring. CI can call the same script.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import asciidoctor from '@asciidoctor/core';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'docs/pages');
const TEMPLATE_DIR = path.join(ROOT, 'docs/templates');
const PARTIALS_DIR = path.join(TEMPLATE_DIR, 'partials');
const STYLES_DIR = path.join(ROOT, 'docs/styles');
const NAV_PATH = path.join(ROOT, 'docs/nav.yml');
const OUT_DIR = path.join(ROOT, 'site/docs');
const SITE_INDEX = path.join(ROOT, 'site/index.html');

// Markers wrapping the footer block in the marketing landing page and in
// docs/templates/page.html. The build replaces everything between them
// with the rendered partial from docs/templates/partials/footer.html.
const FOOTER_START = '<!-- footer:start -->';
const FOOTER_END = '<!-- footer:end -->';

const adoc = asciidoctor();

/** Recursively collect all .adoc files under a directory. */
async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile() && entry.name.endsWith('.adoc')) out.push(full);
  }
  return out;
}

/** Read a partial widget HTML by name. Returns '' (with warning) on miss. */
async function loadWidget(name) {
  const p = path.join(TEMPLATE_DIR, 'widgets', `${name}.html`);
  try {
    return await fs.readFile(p, 'utf8');
  } catch {
    console.warn(`  ! widget partial not found: ${name} (${p})`);
    return `<!-- widget '${name}' not found -->`;
  }
}

/** Replace widget::<name>[] block macros with the partial's HTML.
 *  Asciidoctor renders unknown block macros as <div class="paragraph">
 *  <p>widget::name[]</p></div>, so we match that exact shape. */
async function expandWidgets(html) {
  const re = /<div class="paragraph">\s*<p>widget::([a-z0-9-]+)\[\]<\/p>\s*<\/div>/g;
  const matches = [...html.matchAll(re)];
  for (const m of matches) {
    const partial = await loadWidget(m[1]);
    html = html.replace(m[0], partial);
  }
  return html;
}

/** Strip `// source: <file>:<lines>` citations from rendered HTML.
 *  Authors keep these citations in .adoc source as part of the
 *  verification trail — they make it easy to audit a page against the
 *  actual code in PR review. But they shouldn't leak into the public
 *  docs site, especially when they end up inside list items where
 *  Asciidoctor's normal line-comment handling doesn't catch them.
 *
 *  We strip exact lines of the form `// source: ...` (with leading
 *  whitespace), plus any preceding <br> so we don't leave dangling
 *  line breaks. */
function stripSourceCitations(html) {
  return html
    .replace(/<br[^>]*>\s*\/\/ source:[^\n<]*/g, '')
    .replace(/\/\/ source:[^\n<]*\n?/g, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n');
}

/** Annotate <div class="listingblock"> with data-lang from the inner
 *  <code class="language-xyz hljs"> attribute. CSS uses this to render
 *  the language strip above the code (BASH / TS / etc). */
function annotateListings(html) {
  return html.replace(
    /<div class="listingblock">\s*<div class="content">\s*<pre[^>]*><code[^>]*data-lang="([^"]+)"/g,
    (m, lang) => m.replace(
      '<div class="listingblock">',
      `<div class="listingblock" data-lang="${lang}">`,
    ),
  );
}

/** Build the sidebar <div>s from nav.yml. Marks the active item with
 *  aria-current="page". Items with no `slug` render as non-links. */
function renderSidebar(nav, currentSlug) {
  return nav.groups.map(g => {
    const items = g.items.map(it => {
      if (!it.slug) {
        // Placeholder — page doesn't exist yet. No href.
        return `            <span class="docs-side-item is-placeholder">${escapeHtml(it.label)}</span>`;
      }
      const active = it.slug === currentSlug;
      const attrs = active ? ' aria-current="page"' : '';
      return `            <a class="docs-side-item"${attrs} href="${it.slug}.html">${escapeHtml(it.label)}</a>`;
    }).join('\n');
    return `          <div class="docs-side-group">\n            <p class="pl-mono docs-side-heading">${escapeHtml(g.heading)}</p>\n${items}\n          </div>`;
  }).join('\n');
}

/** Build "on this page" links from level-1 section headings.
 *  Asciidoctor renders these as <h2 id="...">title<a class="anchor"/></h2>. */
function renderToc(html) {
  const re = /<div class="sect1">\s*<h2 id="([^"]+)">([^<]+)/g;
  const items = [];
  let first = true;
  for (const m of html.matchAll(re)) {
    const aria = first ? ' aria-current="true"' : '';
    first = false;
    items.push(`          <a class="docs-toc-item"${aria} href="#${m[1]}">${escapeHtml(m[2])}</a>`);
  }
  return items.join('\n');
}

/** Find the group heading containing the given slug (for the breadcrumb). */
function findGroup(nav, slug) {
  for (const g of nav.groups) {
    if (g.items.some(it => it.slug === slug)) return g.heading;
  }
  return '';
}

/** Decode the handful of HTML entities Asciidoctor.js emits in attribute
 *  values returned by `getDocumentTitle()` / `getAttributes()`. We decode
 *  before re-escaping so titles like "MCP record & replay" don't end up
 *  as "MCP record &amp;amp; replay" in <title> tags. */
function decodeEntities(s) {
  return String(s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function escapeHtml(s) {
  return decodeEntities(s).replace(/[&<>"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
  }[c]));
}

/** Render a single .adoc → site/docs/<slug>.html. */
async function buildPage(adocPath, nav, template) {
  const src = await fs.readFile(adocPath, 'utf8');
  const doc = adoc.load(src, { safe: 'safe', attributes: { 'showtitle': false } });

  const title = doc.getDocumentTitle();
  const attrs = doc.getAttributes();
  const slug = attrs['page-slug'] || path.basename(adocPath, '.adoc');
  const description = attrs['page-description'] || '';
  const section = attrs['page-section'] || findGroup(nav, slug) || '';

  let body = doc.convert();
  body = await expandWidgets(body);
  body = annotateListings(body);
  body = stripSourceCitations(body);

  const breadcrumb = section
    ? `${escapeHtml(section)} / ${escapeHtml(title.toUpperCase())}`
    : escapeHtml(title.toUpperCase());

  const sidebar = renderSidebar(nav, slug);
  const toc = renderToc(body);

  const prevLabel = attrs['page-prev-label'] || '';
  const nextLabel = attrs['page-next-label'] || '';

  // Strip the pager block entirely when a page has no prev/next links —
  // markers are emitted by docs/templates/page.html.
  let filled = template;
  if (!prevLabel && !nextLabel) {
    filled = filled.replace(/\s*<!-- PAGER:START -->[\s\S]*?<!-- PAGER:END -->/, '');
  }

  filled = filled
    .replaceAll('{{title}}', escapeHtml(title))
    .replaceAll('{{description}}', escapeHtml(description))
    .replaceAll('{{slug}}', slug)
    .replaceAll('{{breadcrumb}}', breadcrumb)
    .replaceAll('{{sidebar}}', sidebar)
    .replaceAll('{{toc}}', toc)
    .replaceAll('{{body}}', body)
    .replaceAll('{{prevLabel}}', escapeHtml(prevLabel))
    .replaceAll('{{prevHref}}', escapeHtml(attrs['page-prev-href'] || '#'))
    .replaceAll('{{nextLabel}}', escapeHtml(nextLabel))
    .replaceAll('{{nextHref}}', escapeHtml(attrs['page-next-href'] || '#'))
    .replaceAll('{{sourcePath}}', path.relative(ROOT, adocPath));

  const outPath = path.join(OUT_DIR, `${slug}.html`);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, filled);
  console.log(`  ✓ ${path.relative(ROOT, adocPath)} → ${path.relative(ROOT, outPath)}`);
  return slug;
}

/** Render the footer partial for a given consumer context. Substitutes
 *  `{{root}}` (path prefix to site root) and `{{homeHref}}` (wordmark
 *  destination). The returned string has no surrounding markers. */
function renderFooter(rawPartial, { root, homeHref }) {
  return rawPartial
    .replaceAll('{{root}}', root)
    .replaceAll('{{homeHref}}', homeHref);
}

/** Replace the block between FOOTER_START and FOOTER_END in `host` with
 *  `body`. Indents every line of `body` to match the column at which the
 *  start marker sits in `host`. Throws if the markers are missing —
 *  that means the consumer file was tampered with and we'd silently
 *  no-op without this check. */
function spliceBetweenMarkers(host, body, label) {
  const startIdx = host.indexOf(FOOTER_START);
  const endIdx = host.indexOf(FOOTER_END, startIdx + 1);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`${label}: footer markers not found (expected ${FOOTER_START} … ${FOOTER_END})`);
  }
  // Column at which the start marker line begins — same indent used for
  // the body lines and the trailing end marker.
  const lineStart = host.lastIndexOf('\n', startIdx) + 1;
  const indent = host.slice(lineStart, startIdx).match(/^[ \t]*/)[0];
  const indented = body
    .replace(/\n+$/, '')
    .split('\n')
    .map(line => (line.length === 0 ? line : indent + line))
    .join('\n');
  const head = host.slice(0, startIdx + FOOTER_START.length);
  const tail = host.slice(endIdx);
  return `${head}\n${indented}\n${indent}${tail}`;
}

/** Write `content` to `outPath` only if it differs from what's on disk.
 *  Keeps `git status` clean when nothing changed. */
async function writeIfChanged(outPath, content, label) {
  let existing = null;
  try { existing = await fs.readFile(outPath, 'utf8'); } catch {}
  if (existing === content) {
    console.log(`  · ${label} unchanged`);
    return false;
  }
  await fs.writeFile(outPath, content);
  console.log(`  ✓ ${label} updated`);
  return true;
}

async function main() {
  console.log('promptLM docs · build');

  const [nav, rawTemplate, footerPartial, pages] = await Promise.all([
    fs.readFile(NAV_PATH, 'utf8').then(s => YAML.parse(s)),
    fs.readFile(path.join(TEMPLATE_DIR, 'page.html'), 'utf8'),
    fs.readFile(path.join(PARTIALS_DIR, 'footer.html'), 'utf8'),
    walk(PAGES_DIR),
  ]);

  // Inject the footer into the marketing landing page (in-place between
  // markers). Paths are site-root-relative; the wordmark "home" is `#`
  // so clicking it scrolls to top instead of reloading.
  const siteIndex = await fs.readFile(SITE_INDEX, 'utf8');
  const footerForIndex = renderFooter(footerPartial, { root: '', homeHref: '#' });
  const newSiteIndex = spliceBetweenMarkers(siteIndex, footerForIndex, 'site/index.html');
  await writeIfChanged(SITE_INDEX, newSiteIndex, 'site/index.html');

  // Bake the footer into the docs page template (in memory only; the
  // committed template keeps the marker block empty). Paths get a `../`
  // prefix because rendered docs sit at site/docs/*.html.
  const footerForDocs = renderFooter(footerPartial, { root: '../', homeHref: '../index.html' });
  const template = spliceBetweenMarkers(rawTemplate, footerForDocs, 'docs/templates/page.html');

  if (pages.length === 0) {
    console.error('  ! no .adoc files found under docs/pages/');
    process.exit(1);
  }

  // Clean the output dir so stale pages from a previous build (e.g. after
  // an .adoc is renamed or removed) don't linger and confuse local preview.
  // The directory is gitignored, so this is always safe.
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  // Copy docs.css next to the pages so they can <link rel="stylesheet" href="docs.css">.
  await fs.copyFile(
    path.join(STYLES_DIR, 'docs.css'),
    path.join(OUT_DIR, 'docs.css'),
  );
  console.log(`  ✓ docs/styles/docs.css → site/docs/docs.css`);

  const slugs = [];
  for (const p of pages) slugs.push(await buildPage(p, nav, template));

  // The docs landing page is whatever .adoc declares `:page-slug: index`.
  // No auto-generated redirect — if no index page exists, the build fails
  // loudly below rather than producing a silently-empty site/docs/.
  if (!slugs.includes('index')) {
    console.error('  ! no page declares :page-slug: index — visiting site/docs/ will 404');
    process.exit(1);
  }

  console.log(`\nBuilt ${slugs.length} page${slugs.length === 1 ? '' : 's'}.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
