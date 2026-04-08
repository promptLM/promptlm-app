import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST_DIR = new URL('../dist/', import.meta.url);
const RELATIVE_SPECIFIER_PATTERN =
  /((?:import|export)\s[\s\S]*?\sfrom\s*['"]|import\s*['"])(\.\.?\/[^'"]+)(['"])/g;
const KNOWN_EXTENSION_PATTERN = /\.[a-z0-9]+$/i;

const fileExists = async (filePath) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const resolveOutputSpecifier = async (specifier, sourcePath) => {
  const sourceDirectory = path.dirname(sourcePath);
  const fileCandidate = path.resolve(sourceDirectory, `${specifier}.js`);
  if (await fileExists(fileCandidate)) {
    return `${specifier}.js`;
  }

  const indexCandidate = path.resolve(sourceDirectory, specifier, 'index.js');
  if (await fileExists(indexCandidate)) {
    return `${specifier}/index.js`;
  }

  return `${specifier}.js`;
};

const rewriteFile = async (fileUrl) => {
  const sourcePath = fileURLToPath(fileUrl);
  const source = await readFile(sourcePath, 'utf8');
  let rewritten = '';
  let cursor = 0;
  for (const match of source.matchAll(RELATIVE_SPECIFIER_PATTERN)) {
    const [fullMatch, prefix, specifier, suffix] = match;
    const start = match.index ?? 0;
    rewritten += source.slice(cursor, start);
    if (KNOWN_EXTENSION_PATTERN.test(specifier)) {
      rewritten += fullMatch;
    } else {
      const resolvedSpecifier = await resolveOutputSpecifier(specifier, sourcePath);
      rewritten += `${prefix}${resolvedSpecifier}${suffix}`;
    }
    cursor = start + fullMatch.length;
  }
  rewritten += source.slice(cursor);
  if (rewritten !== source) {
    await writeFile(sourcePath, rewritten, 'utf8');
  }
};

const walk = async (directoryUrl) => {
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  for (const entry of entries) {
    const entryUrl = new URL(entry.name, directoryUrl);
    if (entry.isDirectory()) {
      await walk(new URL(`${entry.name}/`, directoryUrl));
      continue;
    }
    if (path.extname(entry.name) === '.js') {
      await rewriteFile(entryUrl);
    }
  }
};

await walk(DIST_DIR);
