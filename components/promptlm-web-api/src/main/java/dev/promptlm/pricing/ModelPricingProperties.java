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

package dev.promptlm.pricing;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Spring-bound configuration for per-model token pricing.
 *
 * <p>Prices are specified per <em>million tokens</em> for readability. Operators register every
 * model they expect to see in production; unknown models fall back to {@code null} cost so the
 * UI hides the dollar chip rather than showing a misleading {@code $0.00}.
 *
 * <pre>{@code
 * promptlm:
 *   pricing:
 *     models:
 *       gpt-4o:
 *         input-per-million: 2.50
 *         output-per-million: 10.00
 *       claude-3-5-sonnet:
 *         input-per-million: 3.00
 *         output-per-million: 15.00
 * }</pre>
 */
@ConfigurationProperties("promptlm.pricing")
public class ModelPricingProperties {

    private Map<String, ModelPrice> models = new LinkedHashMap<>();

    public Map<String, ModelPrice> getModels() {
        return models;
    }

    public void setModels(Map<String, ModelPrice> models) {
        this.models = models == null ? new LinkedHashMap<>() : models;
    }

    /**
     * Per-model price, expressed as USD per million tokens for each of input and output. Either
     * value may be {@code null} to indicate "not priced"; the service then returns no cost for
     * that direction.
     */
    public static class ModelPrice {

        private Double inputPerMillion;

        private Double outputPerMillion;

        public Double getInputPerMillion() {
            return inputPerMillion;
        }

        public void setInputPerMillion(Double inputPerMillion) {
            this.inputPerMillion = inputPerMillion;
        }

        public Double getOutputPerMillion() {
            return outputPerMillion;
        }

        public void setOutputPerMillion(Double outputPerMillion) {
            this.outputPerMillion = outputPerMillion;
        }
    }
}
