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

import dev.promptlm.domain.PathToStringSerializer;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.ChatCompletionResponse;
import dev.promptlm.domain.promptspec.Evaluation;
import dev.promptlm.domain.promptspec.EvaluationExtensions;
import dev.promptlm.domain.promptspec.EvaluationResult;
import dev.promptlm.domain.promptspec.EvaluationResults;
import dev.promptlm.domain.promptspec.EvaluationSpec;
import dev.promptlm.domain.promptspec.EvaluationStatus;
import dev.promptlm.domain.promptspec.Execution;
import dev.promptlm.domain.promptspec.ImagesGenerationsRequest;
import dev.promptlm.domain.promptspec.PromptEvaluationDefinition;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.ReleaseExtensions;
import dev.promptlm.domain.promptspec.ReleaseMetadata;
import dev.promptlm.domain.promptspec.Request;
import dev.promptlm.domain.promptspec.Response;
import dev.promptlm.domain.promptspec.ResponseFormat;
import org.eclipse.jgit.diff.DiffAlgorithm;
import org.eclipse.jgit.lib.CoreConfig;
import org.springframework.aot.hint.MemberCategory;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.ImportRuntimeHints;

/**
 * Runtime hints required for JGit behavior in native images.
 */
@Configuration(proxyBeanMethods = false)
@ImportRuntimeHints(GitNativeRuntimeHints.JGitRuntimeHints.class)
class GitNativeRuntimeHints {

    static final class JGitRuntimeHints implements RuntimeHintsRegistrar {

        private static final Class<?>[] PROMPT_SPEC_TYPES = new Class[]{
                ChatCompletionRequest.class,
                ChatCompletionResponse.class,
                Evaluation.class,
                EvaluationExtensions.class,
                EvaluationResult.class,
                EvaluationResults.class,
                EvaluationSpec.class,
                EvaluationStatus.class,
                Execution.class,
                ImagesGenerationsRequest.class,
                PromptEvaluationDefinition.class,
                PromptSpec.class,
                PathToStringSerializer.class,
                ReleaseExtensions.class,
                ReleaseMetadata.class,
                Request.class,
                Response.class,
                ResponseFormat.class,
                GitRepositoryMetadataFile.class
        };

        @Override
        public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
            hints.resources().registerPattern("repo-template.zip");
            registerPromptSpecTypes(hints);
            registerJGitEnumTypes(hints);
        }

        private static void registerPromptSpecTypes(RuntimeHints hints) {
            for (Class<?> type : PROMPT_SPEC_TYPES) {
                registerTypeAndNestedTypes(hints, type);
            }
        }

        private static void registerJGitEnumTypes(RuntimeHints hints) {
            registerNestedEnumTypes(hints, CoreConfig.class);
            registerNestedEnumTypes(hints, DiffAlgorithm.class);
        }

        private static void registerNestedEnumTypes(RuntimeHints hints, Class<?> typeWithNestedEnums) {
            for (Class<?> nestedClass : typeWithNestedEnums.getDeclaredClasses()) {
                if (!nestedClass.isEnum()) {
                    continue;
                }
                hints.reflection().registerType(nestedClass, hint -> hint.withMembers(
                        MemberCategory.INVOKE_PUBLIC_METHODS,
                        MemberCategory.INVOKE_DECLARED_METHODS
                ));
            }
        }

        private static void registerTypeAndNestedTypes(RuntimeHints hints, Class<?> type) {
            hints.reflection().registerType(type, hint -> hint.withMembers(MemberCategory.values()));
            for (Class<?> nestedClass : type.getDeclaredClasses()) {
                hints.reflection().registerType(nestedClass, hint -> hint.withMembers(MemberCategory.values()));
            }
        }
    }
}
