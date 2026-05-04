// Copyright 2025 promptLM
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useEffect, useState } from 'react';

export type ReportRoute =
  | { kind: 'overview' }
  | { kind: 'prompt'; name: string }
  | { kind: 'diff'; promptA?: string; revA?: string; promptB?: string; revB?: string };

const parseRoute = (hash: string): ReportRoute => {
  const path = (hash || '').replace(/^#/, '');
  if (!path || path === '/') return { kind: 'overview' };

  // #/prompts/:name
  const promptMatch = /^\/prompts\/([^/?]+)/.exec(path);
  if (promptMatch) return { kind: 'prompt', name: decodeURIComponent(promptMatch[1]) };

  // #/diff[?promptA=…&revA=…&promptB=…&revB=…]
  if (path.startsWith('/diff')) {
    const queryStart = path.indexOf('?');
    if (queryStart === -1) return { kind: 'diff' };
    const params = new URLSearchParams(path.slice(queryStart + 1));
    return {
      kind: 'diff',
      promptA: params.get('promptA') ?? undefined,
      revA: params.get('revA') ?? undefined,
      promptB: params.get('promptB') ?? undefined,
      revB: params.get('revB') ?? undefined,
    };
  }
  return { kind: 'overview' };
};

export const useHashRoute = (): [ReportRoute, (next: string) => void] => {
  const [route, setRoute] = useState<ReportRoute>(() =>
    typeof window === 'undefined' ? { kind: 'overview' } : parseRoute(window.location.hash),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onHashChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (nextHash: string) => {
    if (typeof window === 'undefined') return;
    window.location.hash = nextHash;
  };
  return [route, navigate];
};

export const buildPromptHref = (name: string): string =>
  `#/prompts/${encodeURIComponent(name)}`;

export const buildDiffHref = (
  promptA?: string,
  revA?: string,
  promptB?: string,
  revB?: string,
): string => {
  const params = new URLSearchParams();
  if (promptA) params.set('promptA', promptA);
  if (revA) params.set('revA', revA);
  if (promptB) params.set('promptB', promptB);
  if (revB) params.set('revB', revB);
  const qs = params.toString();
  return qs ? `#/diff?${qs}` : '#/diff';
};
