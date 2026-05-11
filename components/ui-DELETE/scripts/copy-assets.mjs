// Copyright 2025 promptLM
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Copies non-TS assets (CSS, etc.) from src/ into dist/ after tsc has run.
// tsc itself only emits .js/.d.ts; CSS files referenced by consumers (e.g.
// `@promptlm/ui/prompts-v2/tokens.css`) need to land in dist alongside.

import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_DIR = fileURLToPath(new URL('../src/', import.meta.url));
const DIST_DIR = fileURLToPath(new URL('../dist/', import.meta.url));
const ASSET_EXTENSIONS = new Set(['.css']);

const walkAndCopy = async (relDir) => {
  const fromDir = path.join(SRC_DIR, relDir);
  let entries;
  try {
    entries = await readdir(fromDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  for (const entry of entries) {
    const childRel = path.join(relDir, entry.name);
    if (entry.isDirectory()) {
      await walkAndCopy(childRel);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!ASSET_EXTENSIONS.has(ext)) continue;
    const fromPath = path.join(SRC_DIR, childRel);
    const toPath = path.join(DIST_DIR, childRel);
    await mkdir(path.dirname(toPath), { recursive: true });
    await copyFile(fromPath, toPath);
  }
};

await stat(DIST_DIR).catch(async () => {
  await mkdir(DIST_DIR, { recursive: true });
});
await walkAndCopy('');
