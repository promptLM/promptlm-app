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
import dev.promptlm.execution.litellm.LiteLlmGatewayProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class ModelCatalogService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ModelCatalogService.class);

    private static final String SOURCE_STATIC = "static";
    private static final String SOURCE_CONFIG = "config";
    private static final String SOURCE_RUNTIME = "runtime";

    private final List<SpringAiVendorClient> springAiVendors;
    private final LiteLlmGatewayProperties liteLlmProperties;
    private final ModelCatalogProperties catalogProperties;
    private volatile LiteLlmCacheEntry liteLlmCache;

    public ModelCatalogService(List<SpringAiVendorClient> springAiVendors,
                               @Nullable LiteLlmGatewayProperties liteLlmProperties,
                               ModelCatalogProperties catalogProperties) {
        this.springAiVendors = springAiVendors == null ? List.of() : List.copyOf(springAiVendors);
        this.liteLlmProperties = liteLlmProperties;
        this.catalogProperties = catalogProperties;
    }

    public ModelCatalogResponse getCatalog() {
        List<ModelCatalogVendor> vendors = new ArrayList<>();
        vendors.addAll(buildSpringAiVendors());
        buildLiteLlmVendor().ifPresent(vendors::add);
        vendors.sort((left, right) -> left.getVendor().compareToIgnoreCase(right.getVendor()));

        ModelCatalogResponse response = new ModelCatalogResponse();
        response.setVendors(vendors);
        return response;
    }

    private List<ModelCatalogVendor> buildSpringAiVendors() {
        if (springAiVendors.isEmpty()) {
            return List.of();
        }

        List<ModelCatalogVendor> vendors = new ArrayList<>();
        for (SpringAiVendorClient client : springAiVendors) {
            String vendor = normalizeVendor(client.vendor());
            if (!StringUtils.hasText(vendor)) {
                continue;
            }

            Set<String> models = client.catalogModels();
            List<ModelCatalogModel> entries = models == null ? List.of() : models.stream()
                    .filter(StringUtils::hasText)
                    .map(modelId -> buildModelEntry(modelId, modelId, SOURCE_STATIC, null))
                    .collect(Collectors.toList());

            entries = filterAllowedModels(vendor, entries);

            ModelCatalogVendor vendorEntry = new ModelCatalogVendor();
            vendorEntry.setVendor(vendor);
            vendorEntry.setDisplayName(resolveVendorDisplayName(vendor));
            vendorEntry.setActive(true);
            vendorEntry.setModels(entries);
            vendors.add(vendorEntry);
        }
        return vendors;
    }

    private java.util.Optional<ModelCatalogVendor> buildLiteLlmVendor() {
        if (liteLlmProperties == null || !liteLlmProperties.isEnabled()) {
            return java.util.Optional.empty();
        }

        String vendor = normalizeVendor(liteLlmProperties.getVendor());
        if (!StringUtils.hasText(vendor)) {
            vendor = "litellm";
        }

        Map<String, ModelCatalogModel> models = new LinkedHashMap<>();
        if (!CollectionUtils.isEmpty(liteLlmProperties.getModelAliases())) {
            for (Map.Entry<String, String> entry : liteLlmProperties.getModelAliases().entrySet()) {
                String modelId = entry.getKey();
                if (!StringUtils.hasText(modelId)) {
                    continue;
                }
                ModelCatalogModel model = buildModelEntry(modelId, modelId, SOURCE_CONFIG, entry.getValue());
                models.put(modelId, model);
            }
        }

        for (String discoveredModel : discoverLiteLlmModels()) {
            models.computeIfAbsent(discoveredModel,
                    modelId -> buildModelEntry(modelId, modelId, SOURCE_RUNTIME, null));
        }

        List<ModelCatalogModel> entries = new ArrayList<>(models.values());
        entries = filterAllowedModels(vendor, entries);

        ModelCatalogVendor vendorEntry = new ModelCatalogVendor();
        vendorEntry.setVendor(vendor);
        vendorEntry.setDisplayName(resolveVendorDisplayName(vendor));
        vendorEntry.setActive(true);
        vendorEntry.setModels(entries);
        return java.util.Optional.of(vendorEntry);
    }

    private ModelCatalogModel buildModelEntry(String id, String displayName, String source, String target) {
        ModelCatalogModel model = new ModelCatalogModel();
        model.setId(id);
        model.setDisplayName(displayName);
        model.setSource(source);
        model.setSupportsChat(true);
        model.setRequiresConfig(false);
        model.setTarget(target);
        return model;
    }

    private List<ModelCatalogModel> filterAllowedModels(String vendor, List<ModelCatalogModel> models) {
        Map<String, Set<String>> allowed = catalogProperties.getAllowed();
        if (allowed == null || allowed.isEmpty()) {
            return models;
        }
        Set<String> allowedModels = allowed.getOrDefault(vendor, Collections.emptySet());
        if (allowedModels == null || allowedModels.isEmpty()) {
            return models;
        }
        Set<String> normalizedAllowed = allowedModels.stream()
                .filter(StringUtils::hasText)
                .map(model -> model.trim().toLowerCase(Locale.ROOT))
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (normalizedAllowed.isEmpty()) {
            return models;
        }
        return models.stream()
                .filter(model -> model.getId() != null
                        && normalizedAllowed.contains(model.getId().trim().toLowerCase(Locale.ROOT)))
                .collect(Collectors.toList());
    }

    private List<String> discoverLiteLlmModels() {
        if (liteLlmProperties == null || !liteLlmProperties.getDiscovery().isEnabled()) {
            return List.of();
        }

        LiteLlmCacheEntry cached = liteLlmCache;
        if (cached != null && !cached.isExpired(liteLlmProperties.getDiscovery().getCacheTtl())) {
            return cached.models;
        }

        synchronized (this) {
            cached = liteLlmCache;
            if (cached != null && !cached.isExpired(liteLlmProperties.getDiscovery().getCacheTtl())) {
                return cached.models;
            }

            List<String> fetched = fetchLiteLlmModels();
            liteLlmCache = new LiteLlmCacheEntry(fetched);
            return fetched;
        }
    }

    private List<String> fetchLiteLlmModels() {
        try {
            if (liteLlmProperties == null || !StringUtils.hasText(liteLlmProperties.getBaseUrl())) {
                return List.of();
            }
            RestClient restClient = RestClient.builder()
                    .baseUrl(liteLlmProperties.getBaseUrl())
                    .build();
            LiteLlmModelsResponse response = restClient.get()
                    .uri(liteLlmProperties.getDiscovery().getModelsPath())
                    .retrieve()
                    .body(LiteLlmModelsResponse.class);

            if (response == null || response.data() == null) {
                return List.of();
            }

            return response.data().stream()
                    .map(LiteLlmModel::id)
                    .filter(StringUtils::hasText)
                    .distinct()
                    .collect(Collectors.toList());
        }
        catch (Exception ex) {
            LOGGER.warn("LiteLLM model discovery failed", ex);
            return List.of();
        }
    }

    private String normalizeVendor(String vendor) {
        return vendor == null ? "" : vendor.trim().toLowerCase(Locale.ROOT);
    }

    private String resolveVendorDisplayName(String vendor) {
        String normalized = normalizeVendor(vendor);
        return switch (normalized) {
            case "openai" -> "OpenAI";
            case "anthropic" -> "Anthropic";
            case "litellm" -> "LiteLLM";
            default -> vendor;
        };
    }

    private static final class LiteLlmCacheEntry {
        private final List<String> models;
        private final Instant timestamp;

        private LiteLlmCacheEntry(List<String> models) {
            this.models = models == null ? List.of() : List.copyOf(models);
            this.timestamp = Instant.now();
        }

        private boolean isExpired(Duration ttl) {
            if (ttl == null) {
                return false;
            }
            return Instant.now().isAfter(timestamp.plus(ttl));
        }
    }

    private record LiteLlmModelsResponse(List<LiteLlmModel> data) {
    }

    private record LiteLlmModel(String id) {
    }
}
