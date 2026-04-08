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

package dev.promptlm.web.llm;

import dev.promptlm.execution.SpringAiVendorClient;
import dev.promptlm.execution.gateway.GatewayResponse;
import dev.promptlm.execution.litellm.LiteLlmGatewayProperties;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class ModelCatalogServiceTest {

    @Test
    void shouldIncludeSpringAiVendorsAndModels() {
        SpringAiVendorClient vendorClient = new StubVendorClient("openai", Set.of("gpt-4o", "gpt-4o-mini"));
        ModelCatalogService service = new ModelCatalogService(
                List.of(vendorClient),
                new StaticObjectProvider<>(null),
                new ModelCatalogProperties()
        );

        ModelCatalogResponse response = service.getCatalog();

        assertThat(response.getVendors()).hasSize(1);
        ModelCatalogVendor vendor = response.getVendors().get(0);
        assertThat(vendor.getVendor()).isEqualTo("openai");
        assertThat(vendor.getModels())
                .extracting(ModelCatalogModel::getId)
                .containsExactlyInAnyOrder("gpt-4o", "gpt-4o-mini");
    }

    @Test
    void shouldApplyAllowedFilter() {
        SpringAiVendorClient vendorClient = new StubVendorClient("openai", Set.of("gpt-4o", "gpt-4o-mini"));
        ModelCatalogProperties properties = new ModelCatalogProperties();
        properties.setAllowed(Map.of("openai", Set.of("gpt-4o")));

        ModelCatalogService service = new ModelCatalogService(
                List.of(vendorClient),
                new StaticObjectProvider<>(null),
                properties
        );

        ModelCatalogResponse response = service.getCatalog();

        assertThat(response.getVendors()).hasSize(1);
        ModelCatalogVendor vendor = response.getVendors().get(0);
        assertThat(vendor.getModels())
                .extracting(ModelCatalogModel::getId)
                .containsExactly("gpt-4o");
    }

    @Test
    void shouldIncludeLiteLlmModelsFromAliases() {
        LiteLlmGatewayProperties liteLlmProperties = new LiteLlmGatewayProperties();
        liteLlmProperties.setEnabled(true);
        liteLlmProperties.setVendor("litellm");
        liteLlmProperties.setModelAliases(Map.of("gpt-4o", "openai/gpt-4o"));

        ModelCatalogService service = new ModelCatalogService(
                List.of(),
                new StaticObjectProvider<>(liteLlmProperties),
                new ModelCatalogProperties()
        );

        ModelCatalogResponse response = service.getCatalog();

        assertThat(response.getVendors()).hasSize(1);
        ModelCatalogVendor vendor = response.getVendors().get(0);
        assertThat(vendor.getVendor()).isEqualTo("litellm");
        assertThat(vendor.getModels()).hasSize(1);
        ModelCatalogModel model = vendor.getModels().get(0);
        assertThat(model.getId()).isEqualTo("gpt-4o");
        assertThat(model.getTarget()).isEqualTo("openai/gpt-4o");
        assertThat(model.getSource()).isEqualTo("config");
    }

    private static final class StubVendorClient implements SpringAiVendorClient {
        private final String vendor;
        private final Set<String> models;

        private StubVendorClient(String vendor, Set<String> models) {
            this.vendor = vendor;
            this.models = models;
        }

        @Override
        public String vendor() {
            return vendor;
        }

        @Override
        public boolean supportsModel(String model) {
            return true;
        }

        @Override
        public Set<String> catalogModels() {
            return models;
        }

        @Override
        public GatewayResponse execute(PromptSpec promptSpec) {
            throw new UnsupportedOperationException("Not needed for this test");
        }
    }

    private static final class StaticObjectProvider<T> implements ObjectProvider<T> {
        private final T value;

        private StaticObjectProvider(T value) {
            this.value = value;
        }

        @Override
        public T getObject(Object... args) {
            return value;
        }

        @Override
        public T getObject() {
            return value;
        }

        @Override
        public T getIfAvailable() {
            return value;
        }

        @Override
        public T getIfUnique() {
            return value;
        }
    }
}
