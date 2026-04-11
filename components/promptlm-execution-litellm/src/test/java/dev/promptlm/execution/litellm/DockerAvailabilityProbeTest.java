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

import org.junit.jupiter.api.Test;

import java.util.ArrayDeque;
import java.util.Queue;

import static org.assertj.core.api.Assertions.assertThat;

class DockerAvailabilityProbeTest {

    @Test
    void shouldReturnTrueWhenDockerInfoSucceeds() {
        RecordingCommandRunner commandRunner = new RecordingCommandRunner(0);
        DockerAvailabilityProbe probe = new DockerAvailabilityProbe(commandRunner);

        assertThat(probe.isDockerAvailable()).isTrue();
        assertThat(commandRunner.invocations).isEqualTo(1);
    }

    @Test
    void shouldReturnFalseWhenDockerInfoFails() {
        RecordingCommandRunner commandRunner = new RecordingCommandRunner(1);
        DockerAvailabilityProbe probe = new DockerAvailabilityProbe(commandRunner);

        assertThat(probe.isDockerAvailable()).isFalse();
        assertThat(commandRunner.invocations).isEqualTo(1);
    }

    @Test
    void shouldCacheProbeResult() {
        RecordingCommandRunner commandRunner = new RecordingCommandRunner(0, 1);
        DockerAvailabilityProbe probe = new DockerAvailabilityProbe(commandRunner);

        assertThat(probe.isDockerAvailable()).isTrue();
        assertThat(probe.isDockerAvailable()).isTrue();
        assertThat(commandRunner.invocations).isEqualTo(1);
    }

    private static final class RecordingCommandRunner implements DockerAvailabilityProbe.CommandRunner {

        private final Queue<Integer> exitCodes = new ArrayDeque<>();

        private int invocations;

        private RecordingCommandRunner(int... exitCodes) {
            for (int exitCode : exitCodes) {
                this.exitCodes.add(exitCode);
            }
        }

        @Override
        public int execute(String... command) {
            invocations++;
            return exitCodes.isEmpty() ? 0 : exitCodes.remove();
        }
    }
}
