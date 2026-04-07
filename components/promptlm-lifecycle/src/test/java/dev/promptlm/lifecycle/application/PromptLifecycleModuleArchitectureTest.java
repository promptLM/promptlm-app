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

package dev.promptlm.lifecycle.application;

import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.core.Violations;

import static org.assertj.core.api.Assertions.assertThat;

class PromptLifecycleModuleArchitectureTest {

    @Test
    void promptLifecycleModuleHasNoDependencyCycles() {
        Violations cycleViolations = ApplicationModules.of("dev.promptlm.lifecycle", ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .detectViolations()
                .filter(violation -> violation.hasMessageContaining("Cycle")
                        || violation.hasMessageContaining("cycle"));

        assertThat(cycleViolations.hasViolations())
                .as("Lifecycle module dependency cycles must be absent")
                .isFalse();
    }
}
