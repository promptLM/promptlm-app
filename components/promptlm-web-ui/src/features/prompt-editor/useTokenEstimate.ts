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

import { useEffect, useRef, useState } from 'react';
import { estimateInputTokens, type EstimatorInput } from './tokenEstimator';

/**
 * Debounced token-estimate hook. Issue #182.
 *
 * Returns `null` while the encoder is loading (so the UI can show a placeholder
 * dash rather than a misleading `0`); resolves to the encoded count once the
 * estimator returns.
 */
export interface TokenEstimateState {
  tokens: number | null;
  loading: boolean;
}

export const useTokenEstimate = (
  input: EstimatorInput,
  debounceMs = 250,
): TokenEstimateState => {
  const [state, setState] = useState<TokenEstimateState>({ tokens: null, loading: true });
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setState((prev) => ({ tokens: prev.tokens, loading: true }));
    const timer = window.setTimeout(() => {
      estimateInputTokens(input)
        .then((tokens) => {
          if (requestId.current === id) {
            setState({ tokens, loading: false });
          }
        })
        .catch(() => {
          if (requestId.current === id) {
            setState({ tokens: null, loading: false });
          }
        });
    }, debounceMs);

    return () => window.clearTimeout(timer);
    // Re-estimate whenever the serialised input changes. We deliberately
    // stringify to avoid re-running on identity-only changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(input), debounceMs]);

  return state;
};
