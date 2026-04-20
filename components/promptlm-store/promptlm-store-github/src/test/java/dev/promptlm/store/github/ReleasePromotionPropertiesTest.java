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

import dev.promptlm.GitHubPromptStoreConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReleasePromotionPropertiesTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(ConfigurationPropertiesAutoConfiguration.class))
            .withUserConfiguration(GitHubPromptStoreConfig.class);

    @Test
    void defaultsToDirectMode() {
        contextRunner.run(context -> {
            ReleasePromotionProperties properties = context.getBean(ReleasePromotionProperties.class);
            assertThat(properties.getMode()).isEqualTo("direct");
            assertThat(properties.resolveMode()).isEqualTo(ReleasePromotionMode.DIRECT);
        });
    }

    @Test
    void bindsPrTwoPhaseMode() {
        contextRunner
                .withPropertyValues("promptlm.release.promotion.mode=pr_two_phase")
                .run(context -> {
                    ReleasePromotionProperties properties = context.getBean(ReleasePromotionProperties.class);
                    assertThat(properties.resolveMode()).isEqualTo(ReleasePromotionMode.PR_TWO_PHASE);
                });
    }

    @Test
    void failsFastForInvalidModeValue() {
        ReleasePromotionProperties properties = new ReleasePromotionProperties();
        properties.setMode("unknown");

        assertThatThrownBy(properties::resolveMode)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Unsupported promptlm.release.promotion.mode");
    }
}
