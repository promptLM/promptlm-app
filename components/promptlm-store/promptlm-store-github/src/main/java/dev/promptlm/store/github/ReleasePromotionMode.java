/*
 * Copyright 2025 promptLM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package dev.promptlm.store.github;

import java.util.Arrays;

enum ReleasePromotionMode {
    DIRECT("direct"),
    PR_TWO_PHASE("pr_two_phase");

    private final String value;

    ReleasePromotionMode(String value) {
        this.value = value;
    }

    String value() {
        return value;
    }

    static ReleasePromotionMode from(String value) {
        return Arrays.stream(values())
                .filter(mode -> mode.value.equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "Unsupported promptlm.release.promotion.mode '%s'. Supported values: direct, pr_two_phase."
                                .formatted(value)
                ));
    }
}
