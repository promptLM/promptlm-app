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

package dev.promptlm.execution.litellm;

import dev.promptlm.execution.PromptGateway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestClient;

@AutoConfiguration
@ConditionalOnClass(RestClient.class)
@EnableConfigurationProperties(LiteLlmGatewayProperties.class)
@ConditionalOnProperty(prefix = "promptlm.gateway.litellm", name = "enabled", havingValue = "true")
public class LiteLlmAutoConfiguration {

    private static final Logger LOGGER = LoggerFactory.getLogger(LiteLlmAutoConfiguration.class);

    @Bean
    @ConditionalOnMissingBean
    public DockerAvailabilityProbe dockerAvailabilityProbe() {
        return new DockerAvailabilityProbe();
    }

    @Bean
    @ConditionalOnMissingBean
    public LiteLlmReadinessProbe liteLlmReadinessProbe() {
        return new LiteLlmReadinessProbe();
    }

    @Bean(destroyMethod = "stop")
    @ConditionalOnMissingBean
    public LiteLlmContainerManager liteLlmContainerManager(LiteLlmGatewayProperties properties,
            DockerAvailabilityProbe probe, LiteLlmReadinessProbe readinessProbe) {
        return new LiteLlmContainerManager(properties, probe, new LiteLlmContainerManager.ProcessCommandRunner(), readinessProbe);
    }

    @Bean
    @ConditionalOnMissingBean(name = "liteLlmRestClient")
    public RestClient liteLlmRestClient(LiteLlmGatewayProperties properties) {
        return RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .build();
    }

    @Bean
    @ConditionalOnMissingBean(name = "liteLlmPromptGateway")
    public PromptGateway liteLlmPromptGateway(LiteLlmGatewayProperties properties,
            LiteLlmContainerManager containerManager, RestClient liteLlmRestClient) {
        boolean active = !properties.getDocker().isManage() || containerManager.ensureRunning();
        if (!active) {
            LOGGER.warn("LiteLLM gateway is enabled in configuration but will remain inactive because startup checks failed");
        }
        return new LiteLlmPromptGateway(properties, liteLlmRestClient, active);
    }
}
