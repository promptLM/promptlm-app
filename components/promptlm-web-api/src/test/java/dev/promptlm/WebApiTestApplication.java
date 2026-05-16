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

package dev.promptlm;

import dev.promptlm.lifecycle.failure.DefaultPromptExecutorFailureClassifier;
import dev.promptlm.lifecycle.failure.PromptExecutorFailureClassifier;
import dev.promptlm.lifecycle.failure.PromptExecutorFailureClassifierResolver;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;

import java.util.List;

@SpringBootApplication
public class WebApiTestApplication {

    /**
     * The classifier SPI lives in {@code promptlm-lifecycle}, outside the @WebMvcTest slice's
     * component scan. Provide the resolver + default classifier here so that
     * {@code PromptExecutionExceptionHandler} (under {@code @RestControllerAdvice}) wires
     * cleanly in slice tests without each one having to declare an explicit {@code @MockitoBean}.
     *
     * <p>{@code @ConditionalOnMissingBean} keeps the full-context tests (e.g.
     * {@code @SpringBootTest}) using the real components from {@code promptlm-lifecycle}.
     */
    @Bean
    @ConditionalOnMissingBean
    PromptExecutorFailureClassifier defaultClassifier() {
        return new DefaultPromptExecutorFailureClassifier();
    }

    @Bean
    @ConditionalOnMissingBean
    PromptExecutorFailureClassifierResolver classifierResolver(List<PromptExecutorFailureClassifier> classifiers) {
        return new PromptExecutorFailureClassifierResolver(classifiers);
    }
}
