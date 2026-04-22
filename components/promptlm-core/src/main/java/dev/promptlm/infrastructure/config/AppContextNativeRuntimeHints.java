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

package dev.promptlm.infrastructure.config;

import dev.promptlm.domain.AppContext;
import dev.promptlm.domain.BasicAppContext;
import dev.promptlm.domain.projectspec.ProjectHealthStatus;
import dev.promptlm.domain.projectspec.ProjectSpec;
import org.springframework.aot.hint.MemberCategory;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.ImportRuntimeHints;

@Configuration(proxyBeanMethods = false)
@ImportRuntimeHints(AppContextNativeRuntimeHints.Hints.class)
class AppContextNativeRuntimeHints {

    static final class Hints implements RuntimeHintsRegistrar {

        @Override
        public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
            for (Class<?> type : new Class<?>[]{
                    AppContext.class,
                    BasicAppContext.class,
                    ChangeAwareBasicAppContext.class,
                    ProjectSpec.class,
                    ProjectHealthStatus.class
            }) {
                hints.reflection().registerType(type, hint -> hint.withMembers(MemberCategory.values()));
            }
        }
    }
}
