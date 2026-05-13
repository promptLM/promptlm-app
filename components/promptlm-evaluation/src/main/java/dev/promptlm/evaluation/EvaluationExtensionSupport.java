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

package dev.promptlm.evaluation;

import tools.jackson.databind.JsonNode;
import dev.promptlm.domain.promptspec.EvaluationExtensions;
import dev.promptlm.domain.promptspec.EvaluationResults;
import dev.promptlm.domain.promptspec.EvaluationSpec;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

final class EvaluationExtensionSupport {

    private static final Logger LOG = LoggerFactory.getLogger(EvaluationExtensionSupport.class);

    static final String EVALUATION_EXTENSION_KEY = EvaluationExtensions.KEY;

    private EvaluationExtensionSupport() {
    }

    static EvaluationSpec extractSpec(PromptSpec promptSpec) {
        EvaluationSpec spec = EvaluationExtensions.readSpec(promptSpec.getExtensions());
        return spec != null ? spec : promptSpec.getEvaluationSpec();
    }

    static EvaluationResults extractResults(PromptSpec promptSpec) {
        EvaluationResults results = EvaluationExtensions.readResults(promptSpec.getExtensions());
        return results != null ? results : promptSpec.getEvaluationResults();
    }

    static PromptSpec withResults(PromptSpec promptSpec, EvaluationSpec spec, EvaluationResults results) {
        Map<String, JsonNode> ext = promptSpec.getExtensions();
        if (ext == null) {
            ext = Map.of();
        }
        if (spec != null && !hasSpec(ext)) {
            if (EvaluationExtensions.writeProbe(spec)) {
                ext = EvaluationExtensions.withSpec(ext, spec);
            } else {
                LOG.warn("EvaluationSpec could not be serialized by the extensible mapper and was not written " +
                         "to extensions. Ensure the evaluation subtype is registered via " +
                         "EvaluationExtensions.registerModule before first use.");
            }
        }
        if (results != null) {
            ext = EvaluationExtensions.withResults(ext, results);
        }
        return promptSpec.withExtensions(ext);
    }

    private static boolean hasSpec(Map<String, JsonNode> extensions) {
        JsonNode eval = extensions.get(EVALUATION_EXTENSION_KEY);
        return eval != null && eval.isObject() && eval.has("spec");
    }
}
