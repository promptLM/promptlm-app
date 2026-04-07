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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Performs lightweight checks to determine whether Docker is available on the host.
 */
public class DockerAvailabilityProbe {

    private static final Logger LOGGER = LoggerFactory.getLogger(DockerAvailabilityProbe.class);

    private final AtomicReference<Boolean> available = new AtomicReference<>();

    private final CommandRunner commandRunner;

    public DockerAvailabilityProbe() {
        this(new ProcessCommandRunner());
    }

    DockerAvailabilityProbe(CommandRunner commandRunner) {
        this.commandRunner = commandRunner;
    }

    /**
     * Returns {@code true} when the Docker CLI is present and responsive.
     */
    public boolean isDockerAvailable() {
        Boolean cached = available.get();
        if (cached != null) {
            return cached;
        }

        boolean detected = invokeDockerInfo();
        available.compareAndSet(null, detected);
        return detected;
    }

    private boolean invokeDockerInfo() {
        int exitCode = commandRunner.execute("docker", "info");
        if (exitCode == 0) {
            return true;
        }

        if (exitCode == -1) {
            LOGGER.warn("LiteLLM gateway disabled because the Docker CLI is unavailable or not executable. Start Docker or set promptlm.gateway.litellm.enabled=false.");
        }
        else {
            LOGGER.warn("LiteLLM gateway disabled because `docker info` exited with code {}. Ensure Docker is running or set promptlm.gateway.litellm.enabled=false.", exitCode);
        }
        return false;
    }

    interface CommandRunner {

        int execute(String... command);
    }

    static final class ProcessCommandRunner implements CommandRunner {

        @Override
        public int execute(String... command) {
            Process process = null;
            try {
                process = new ProcessBuilder(command)
                        .redirectErrorStream(true)
                        .start();

                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                    while (reader.readLine() != null) {
                        // Drain output to prevent blocking.
                    }
                }

                return process.waitFor();
            }
            catch (IOException ex) {
                LOGGER.debug("Docker CLI not available: {}", ex.getMessage());
                return -1;
            }
            catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                LOGGER.warn("Docker availability probe interrupted", ex);
                return -1;
            }
            finally {
                if (process != null) {
                    process.destroyForcibly();
                }
            }
        }
    }
}
