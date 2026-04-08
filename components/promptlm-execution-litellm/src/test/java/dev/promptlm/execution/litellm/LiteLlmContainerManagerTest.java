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

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Queue;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LiteLlmContainerManagerTest {

    private LiteLlmGatewayProperties createProperties() {
        LiteLlmGatewayProperties properties = new LiteLlmGatewayProperties();
        properties.setBaseUrl("http://localhost:4000");
        properties.getDocker().setManage(true);
        properties.getDocker().setContainerName("litellm-test");
        properties.getDocker().setReadinessPath("/health");
        properties.getDocker().setReadinessTimeout(Duration.ofSeconds(5));
        return properties;
    }

    @Test
    void ensureRunningSkipsDockerWhenManagementDisabled() {
        LiteLlmGatewayProperties properties = createProperties();
        properties.getDocker().setManage(false);
        RecordingCommandRunner commandRunner = new RecordingCommandRunner();
        StubReadinessProbe readinessProbe = StubReadinessProbe.always(true);

        LiteLlmContainerManager manager = new LiteLlmContainerManager(properties, StubProbe.available(), commandRunner,
                readinessProbe);

        assertThat(manager.ensureRunning()).isTrue();
        assertThat(commandRunner.executedCommands).isEmpty();
    }

    @Test
    void ensureRunningFailsWhenDockerUnavailable() {
        LiteLlmGatewayProperties properties = createProperties();
        RecordingCommandRunner commandRunner = new RecordingCommandRunner();
        StubReadinessProbe readinessProbe = StubReadinessProbe.always(true);

        LiteLlmContainerManager manager = new LiteLlmContainerManager(properties, StubProbe.unavailable(),
                commandRunner, readinessProbe);

        assertThat(manager.ensureRunning()).isFalse();
        assertThat(commandRunner.executedCommands).isEmpty();
    }

    @Test
    void ensureRunningStartsContainerAndWaitsForReadiness() {
        LiteLlmGatewayProperties properties = createProperties();
        RecordingCommandRunner commandRunner = new RecordingCommandRunner(0, 0, 0);
        StubReadinessProbe readinessProbe = StubReadinessProbe.sequence(true);

        LiteLlmContainerManager manager = new LiteLlmContainerManager(properties, StubProbe.available(),
                commandRunner, readinessProbe);

        assertThat(manager.ensureRunning()).isTrue();
        assertThat(commandRunner.executedCommands).hasSize(3);
        assertThat(commandRunner.executedCommands.get(0)).containsExactly("docker", "image", "inspect", properties.resolveImage());
        assertThat(commandRunner.executedCommands.get(1)).containsExactly("docker", "rm", "-f", "litellm-test");
        assertThat(commandRunner.executedCommands.get(2)).startsWith("docker");

        // Subsequent call should be a no-op
        assertThat(manager.ensureRunning()).isTrue();
        assertThat(commandRunner.executedCommands).hasSize(3);
    }

    @Test
    void ensureRunningPullsImageWhenMissingLocally() {
        LiteLlmGatewayProperties properties = createProperties();
        RecordingCommandRunner commandRunner = new RecordingCommandRunner(1, 0, 0, 0);
        StubReadinessProbe readinessProbe = StubReadinessProbe.sequence(true);

        LiteLlmContainerManager manager = new LiteLlmContainerManager(properties, StubProbe.available(),
                commandRunner, readinessProbe);

        assertThat(manager.ensureRunning()).isTrue();
        assertThat(commandRunner.executedCommands).hasSize(4);
        assertThat(commandRunner.executedCommands.get(0)).containsExactly("docker", "image", "inspect", properties.resolveImage());
        assertThat(commandRunner.executedCommands.get(1)).containsExactly("docker", "pull", properties.resolveImage());
        assertThat(commandRunner.executedCommands.get(2)).containsExactly("docker", "rm", "-f", "litellm-test");
    }

    @Test
    void ensureRunningStopsContainerWhenReadinessFails() {
        LiteLlmGatewayProperties properties = createProperties();
        RecordingCommandRunner commandRunner = new RecordingCommandRunner(0, 0, 0, 0);
        StubReadinessProbe readinessProbe = StubReadinessProbe.sequence(false);

        LiteLlmContainerManager manager = new LiteLlmContainerManager(properties, StubProbe.available(),
                commandRunner, readinessProbe);

        assertThat(manager.ensureRunning()).isFalse();
        assertThat(commandRunner.executedCommands).hasSize(4);
        assertThat(commandRunner.executedCommands.get(3)).containsExactly("docker", "rm", "-f", "litellm-test");
    }

    @Test
    void stopRemovesManagedContainer() {
        LiteLlmGatewayProperties properties = createProperties();
        RecordingCommandRunner commandRunner = new RecordingCommandRunner(0, 0, 0, 0);
        StubReadinessProbe readinessProbe = StubReadinessProbe.sequence(true);

        LiteLlmContainerManager manager = new LiteLlmContainerManager(properties, StubProbe.available(),
                commandRunner, readinessProbe);

        assertThat(manager.ensureRunning()).isTrue();
        manager.stop();
        assertThat(commandRunner.executedCommands).hasSize(4);
        assertThat(commandRunner.executedCommands.get(3)).containsExactly("docker", "rm", "-f", "litellm-test");
    }

    @Test
    void ensureRunningFailsFastWhenVersionAndImageMissing() {
        LiteLlmGatewayProperties properties = createProperties();
        properties.setVersion(null);
        properties.getDocker().setImage(null);

        LiteLlmContainerManager manager = new LiteLlmContainerManager(properties, StubProbe.available(),
                new RecordingCommandRunner(), StubReadinessProbe.always(true));

        assertThatThrownBy(manager::ensureRunning)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("version");
    }

    @Test
    void ensureRunningFailsFastWhenImageUsesLatestTag() {
        LiteLlmGatewayProperties properties = createProperties();
        properties.getDocker().setImage("ghcr.io/berriai/litellm:latest");

        LiteLlmContainerManager manager = new LiteLlmContainerManager(properties, StubProbe.available(),
                new RecordingCommandRunner(), StubReadinessProbe.always(true));

        assertThatThrownBy(manager::ensureRunning)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(":latest");
    }

    @Test
    void ensureRunningFailsFastWhenEnvironmentKeyInvalid() {
        LiteLlmGatewayProperties properties = createProperties();
        properties.setEnvironment(Map.of("INVALID-KEY", "secret"));

        LiteLlmContainerManager manager = new LiteLlmContainerManager(properties, StubProbe.available(),
                new RecordingCommandRunner(), StubReadinessProbe.always(true));

        assertThatThrownBy(manager::ensureRunning)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("environment key");
    }

    @Test
    void ensureRunningFailsFastWhenEnvironmentValueNull() {
        LiteLlmGatewayProperties properties = createProperties();
        Map<String, String> environment = new HashMap<>();
        environment.put("OPENAI_API_KEY", null);
        properties.setEnvironment(environment);

        LiteLlmContainerManager manager = new LiteLlmContainerManager(properties, StubProbe.available(),
                new RecordingCommandRunner(), StubReadinessProbe.always(true));

        assertThatThrownBy(manager::ensureRunning)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("must not be null");
    }

    private static final class RecordingCommandRunner implements LiteLlmContainerManager.CommandRunner {

        private final Queue<Integer> exitCodes;

        private final List<String[]> executedCommands = new ArrayList<>();

        private RecordingCommandRunner(int... exitCodes) {
            this.exitCodes = new ArrayDeque<>();
            for (int exitCode : exitCodes) {
                this.exitCodes.add(exitCode);
            }
        }

        private RecordingCommandRunner() {
            this.exitCodes = new ArrayDeque<>();
        }

        @Override
        public int execute(String... command) {
            executedCommands.add(command);
            return exitCodes.isEmpty() ? 0 : exitCodes.remove();
        }
    }

    private static final class StubProbe extends DockerAvailabilityProbe {

        private final boolean available;

        private StubProbe(boolean available) {
            this.available = available;
        }

        static StubProbe available() {
            return new StubProbe(true);
        }

        static StubProbe unavailable() {
            return new StubProbe(false);
        }

        @Override
        public boolean isDockerAvailable() {
            return available;
        }
    }

    private static final class StubReadinessProbe extends LiteLlmReadinessProbe {

        private final Queue<Boolean> readinessStates;

        private StubReadinessProbe(boolean... readinessStates) {
            this.readinessStates = new ArrayDeque<>();
            for (boolean state : readinessStates) {
                this.readinessStates.add(state);
            }
            if (this.readinessStates.isEmpty()) {
                this.readinessStates.add(true);
            }
        }

        static StubReadinessProbe always(boolean state) {
            return new StubReadinessProbe(state);
        }

        static StubReadinessProbe sequence(boolean... states) {
            return new StubReadinessProbe(states);
        }

        @Override
        public boolean waitUntilReady(String readinessUrl, Duration timeout) {
            return readinessStates.isEmpty() ? true : readinessStates.remove();
        }
    }
}
