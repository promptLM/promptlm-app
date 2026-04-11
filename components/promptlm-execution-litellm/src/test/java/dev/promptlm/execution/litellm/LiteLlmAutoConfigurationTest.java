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
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class LiteLlmAutoConfigurationTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(LiteLlmAutoConfiguration.class));

    @Test
    void shouldNotRegisterGatewayWhenDisabled() {
        contextRunner.run(context -> {
            assertThat(context).doesNotHaveBean(PromptGateway.class);
            assertThat(context).doesNotHaveBean(LiteLlmContainerManager.class);
        });
    }

    @Test
    void shouldRegisterActiveGatewayWhenManagedLifecycleDisabled() {
        contextRunner.withPropertyValues(
                        "promptlm.gateway.litellm.enabled=true",
                        "promptlm.gateway.litellm.docker.manage=false"
                )
                .run(context -> {
                    assertThat(context).hasSingleBean(PromptGateway.class);
                    PromptGateway gateway = context.getBean(PromptGateway.class);
                    assertThat(gateway.supports("litellm", "gpt-4o")).isTrue();
                });
    }

    @Test
    void shouldLeaveGatewayInactiveWhenDockerUnavailable() {
        contextRunner.withPropertyValues(
                        "promptlm.gateway.litellm.enabled=true"
                )
                .withBean(DockerAvailabilityProbe.class, () -> new DockerAvailabilityProbe(command -> 1))
                .run(context -> {
                    assertThat(context).hasSingleBean(PromptGateway.class);
                    PromptGateway gateway = context.getBean(PromptGateway.class);
                    assertThat(gateway.supports("litellm", "gpt-4o")).isFalse();
                });
    }

    @Test
    void shouldFailContextWhenVersionAndImageMissing() {
        contextRunner.withPropertyValues(
                        "promptlm.gateway.litellm.enabled=true",
                        "promptlm.gateway.litellm.version="
                )
                .withBean(DockerAvailabilityProbe.class, () -> new DockerAvailabilityProbe(command -> 1))
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .hasMessageContaining("version");
                });
    }
}
