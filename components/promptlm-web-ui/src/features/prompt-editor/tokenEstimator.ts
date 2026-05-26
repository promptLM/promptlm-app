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

/**
 * Issue #182: estimate input token count for a prompt draft using a generic
 * `cl100k_base` tokenizer (the same encoding GPT-3.5/4 use). The estimate is
 * deliberately one rough number across all models — per-model exact tokenizers
 * are an explicit non-goal for v1.
 *
 * The encoder ships with `gpt-tokenizer`, which is a pure-JS implementation and
 * is loaded lazily on first call so a fresh editor mount doesn't pay the parse
 * cost up front. If the dynamic import fails (network problem, sandboxed test
 * environment, etc.) the estimator falls back to a deterministic char-based
 * heuristic so the UI degrades gracefully rather than throwing.
 */

export interface FormMessageLike {
  role: string;
  content: string;
}

export interface FormPlaceholderLike {
  name: string;
  defaultValue: string;
}

export interface EstimatorInput {
  /** Messages exactly as they appear in the form. Empty list → 0 tokens. */
  messages: FormMessageLike[];
  /** Resolved placeholder values used to substitute markers in message content. */
  placeholders: FormPlaceholderLike[];
  /** Optional tool/function-call schema; if present its JSON contributes to the count. */
  toolSchema?: unknown;
  /** Optional placeholder delimiters; defaults to `{{` / `}}`. */
  startPattern?: string;
  endPattern?: string;
}

/** Encoder contract — kept tiny so we can swap implementations or stub in tests. */
export interface TokenEncoder {
  encode(text: string): { length: number };
}

let cachedEncoderPromise: Promise<TokenEncoder | null> | null = null;

/**
 * Resolve the cl100k_base encoder. Lazy + memoised. Returns `null` if loading
 * fails so callers can fall back to a heuristic without throwing.
 *
 * Exposed for tests so they can pre-load / stub.
 */
export const loadCl100kBaseEncoder = (): Promise<TokenEncoder | null> => {
  if (!cachedEncoderPromise) {
    cachedEncoderPromise = import('gpt-tokenizer/encoding/cl100k_base')
      .then((mod): TokenEncoder => ({
        encode: (text: string) => ({ length: mod.encode(text).length }),
      }))
      .catch(() => null);
  }
  return cachedEncoderPromise;
};

/** Test-only: drop the cached promise so a fresh import attempt runs next call. */
export const __resetEncoderCacheForTests = (): void => {
  cachedEncoderPromise = null;
};

/**
 * Apply placeholder substitution to a message body using the configured
 * delimiters. Substitution is purely lexical — we don't try to honour escape
 * sequences. Unknown placeholders are left in place so they still contribute
 * to the estimate (consistent with what the user sees in the editor).
 */
export const renderMessageWithPlaceholders = (
  content: string,
  placeholders: FormPlaceholderLike[],
  startPattern: string,
  endPattern: string,
): string => {
  if (!content || placeholders.length === 0) {
    return content;
  }
  let out = content;
  for (const placeholder of placeholders) {
    if (!placeholder.name) continue;
    const marker = `${startPattern}${placeholder.name}${endPattern}`;
    if (out.includes(marker)) {
      out = out.split(marker).join(placeholder.defaultValue ?? '');
    }
  }
  return out;
};

/** Assemble a single string from the input. Exposed for tests. */
export const buildEstimatorPayload = (input: EstimatorInput): string => {
  const start = input.startPattern ?? '{{';
  const end = input.endPattern ?? '}}';
  const parts: string[] = [];
  for (const message of input.messages) {
    const role = (message.role ?? '').trim();
    const content = renderMessageWithPlaceholders(
      message.content ?? '',
      input.placeholders,
      start,
      end,
    );
    parts.push(`${role}: ${content}`);
  }
  if (input.toolSchema !== undefined && input.toolSchema !== null) {
    try {
      parts.push(JSON.stringify(input.toolSchema));
    } catch {
      // Non-serialisable tool schemas (cyclic refs, etc.) — skip silently;
      // the estimate stays valid for the message body and placeholders.
    }
  }
  return parts.join('\n');
};

/**
 * Heuristic fallback used when the encoder fails to load. cl100k_base averages
 * roughly 4 chars per token across English-language prompts; we deliberately
 * round up so the fallback errs on the side of over- rather than under-
 * estimation (operators care more about not being surprised by a bill).
 */
export const heuristicTokenCount = (text: string): number => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

/**
 * Public entry point: estimate input tokens for a draft. Returns a Promise so
 * the encoder can be lazy-loaded; callers typically wrap this in
 * `useTokenEstimate` to debounce + render.
 */
export const estimateInputTokens = async (input: EstimatorInput): Promise<number> => {
  const payload = buildEstimatorPayload(input);
  if (!payload) return 0;
  const encoder = await loadCl100kBaseEncoder();
  if (!encoder) {
    return heuristicTokenCount(payload);
  }
  try {
    return encoder.encode(payload).length;
  } catch {
    return heuristicTokenCount(payload);
  }
};
