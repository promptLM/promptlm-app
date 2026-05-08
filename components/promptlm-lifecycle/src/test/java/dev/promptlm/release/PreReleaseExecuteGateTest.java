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

package dev.promptlm.release;

import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.ChatCompletionResponse;
import dev.promptlm.domain.promptspec.Execution;
import dev.promptlm.domain.promptspec.ExecutionKind;
import dev.promptlm.domain.promptspec.FailureClass;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.lifecycle.application.PromptExecutionPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PreReleaseExecuteGateTest {

    private PreReleaseExecuteProperties properties;
    private StubExecutionPort executionPort;
    private PreReleaseExecuteGate gate;
    private PromptSpec spec;

    @BeforeEach
    void setUp() {
        properties = new PreReleaseExecuteProperties();
        executionPort = new StubExecutionPort();
        gate = new PreReleaseExecuteGate(executionPort, properties);

        spec = PromptSpec.builder()
                .withGroup("g")
                .withName("n")
                .withVersion("1.0.0-SNAPSHOT")
                .withRevision(1)
                .withDescription("d")
                .withRequest(ChatCompletionRequest.builder()
                        .withVendor("openai").withModel("gpt-4").withMessages(List.of()).build())
                .build()
                .withId("g/n");
    }

    @Test
    void enabled_by_default() {
        assertThat(gate.isEnabled()).isTrue();
    }

    @Test
    void runs_and_appends_pre_release_execution_on_success() {
        executionPort.respondWith(new ChatCompletionResponse());

        PromptSpec gated = gate.runOrThrow(spec, OnInfraFailure.REJECT);

        assertThat(gated.getExecutions()).hasSize(1);
        Execution recorded = gated.getExecutions().get(0);
        assertThat(recorded.getKind()).isEqualTo(ExecutionKind.PRE_RELEASE);
        assertThat(recorded.getOk()).isTrue();
        assertThat(recorded.getFailureClass()).isNull();
    }

    @Test
    void prompt_failure_throws_and_carries_failed_execution() {
        executionPort.failWith(new IllegalArgumentException("placeholder X missing"));

        assertThatThrownBy(() -> gate.runOrThrow(spec, OnInfraFailure.REJECT))
                .isInstanceOf(PreReleasePromptFailure.class)
                .satisfies(thrown -> {
                    PreReleasePromptFailure failure = (PreReleasePromptFailure) thrown;
                    assertThat(failure.code()).isEqualTo(PreReleasePromptFailure.CODE);
                    assertThat(failure.failedExecution().getKind()).isEqualTo(ExecutionKind.PRE_RELEASE);
                    assertThat(failure.failedExecution().getFailureClass()).isEqualTo(FailureClass.PROMPT);
                    assertThat(failure.failedExecution().getOk()).isFalse();
                });
    }

    @Test
    void infra_failure_soft_blocks_under_default_reject() {
        executionPort.failWith(wrap(new SocketTimeoutException("vendor timeout")));

        assertThatThrownBy(() -> gate.runOrThrow(spec, OnInfraFailure.REJECT))
                .isInstanceOf(PreReleaseInfrastructureFailure.class)
                .satisfies(thrown -> {
                    PreReleaseInfrastructureFailure failure = (PreReleaseInfrastructureFailure) thrown;
                    assertThat(failure.code()).isEqualTo(PreReleaseInfrastructureFailure.CODE);
                    assertThat(failure.failedExecution().getFailureClass()).isEqualTo(FailureClass.INFRASTRUCTURE);
                });
    }

    @Test
    void infra_failure_records_and_returns_under_record_override() {
        executionPort.failWith(wrap(new IOException("connection reset")));

        PromptSpec gated = gate.runOrThrow(spec, OnInfraFailure.RECORD);

        assertThat(gated.getExecutions()).hasSize(1);
        Execution recorded = gated.getExecutions().get(0);
        assertThat(recorded.getOk()).isFalse();
        assertThat(recorded.getFailureClass()).isEqualTo(FailureClass.INFRASTRUCTURE);
        assertThat(recorded.getKind()).isEqualTo(ExecutionKind.PRE_RELEASE);
    }

    @Test
    void classify_fails_closed_for_unknown_runtime() {
        assertThat(PreReleaseExecuteGate.classify(new IllegalStateException("schema mismatch")))
                .isEqualTo(FailureClass.PROMPT);
    }

    @Test
    void classify_unwraps_nested_io_to_infrastructure() {
        RuntimeException wrapped = new RuntimeException("client failed", new IOException("eof"));
        assertThat(PreReleaseExecuteGate.classify(wrapped)).isEqualTo(FailureClass.INFRASTRUCTURE);
    }

    private static RuntimeException wrap(Throwable cause) {
        return new RuntimeException("wrapper", cause);
    }

    private static class StubExecutionPort implements PromptExecutionPort {

        private ChatCompletionResponse response;
        private RuntimeException error;

        void respondWith(ChatCompletionResponse response) {
            this.response = response;
            this.error = null;
        }

        void failWith(RuntimeException error) {
            this.error = error;
            this.response = null;
        }

        @Override
        public PromptSpec runAndAttachResponse(PromptSpec promptSpec) {
            if (error != null) {
                throw error;
            }
            return promptSpec.withResponse(response);
        }
    }
}
