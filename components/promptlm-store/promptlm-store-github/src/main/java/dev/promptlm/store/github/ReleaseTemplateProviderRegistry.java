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

import dev.promptlm.store.api.ReleaseProvider;
import dev.promptlm.store.api.ReleaseTemplateProvider;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Selects the appropriate {@link ReleaseTemplateProvider} for a given
 * {@link ReleaseProvider} value.
 *
 * <p>Implementations are discovered through Spring's component scanning, but
 * the registry resolves them by {@link ReleaseTemplateProvider#provider()}
 * rather than by bean name. This keeps adding a new CI/CD platform a one-class
 * change.
 */
@Component
public class ReleaseTemplateProviderRegistry {

    private final Map<ReleaseProvider, ReleaseTemplateProvider> providersByKey;

    public ReleaseTemplateProviderRegistry(List<ReleaseTemplateProvider> providers) {
        Map<ReleaseProvider, ReleaseTemplateProvider> map = new EnumMap<>(ReleaseProvider.class);
        for (ReleaseTemplateProvider provider : providers) {
            ReleaseTemplateProvider previous = map.put(provider.provider(), provider);
            if (previous != null) {
                throw new IllegalStateException(
                        "Duplicate ReleaseTemplateProvider registered for " + provider.provider()
                                + ": " + previous.getClass().getName()
                                + " and " + provider.getClass().getName());
            }
        }
        this.providersByKey = Map.copyOf(map);
    }

    /**
     * Returns the registered provider for the given key.
     *
     * @throws IllegalStateException if no provider is registered for the key
     */
    public ReleaseTemplateProvider get(ReleaseProvider key) {
        ReleaseTemplateProvider provider = providersByKey.get(key);
        if (provider == null) {
            throw new IllegalStateException("No ReleaseTemplateProvider registered for " + key);
        }
        return provider;
    }
}
