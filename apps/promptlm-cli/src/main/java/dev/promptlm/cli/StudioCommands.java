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

package dev.promptlm.cli;

import org.springframework.shell.core.command.annotation.Command;
import org.springframework.shell.core.command.annotation.Option;
import org.springframework.stereotype.Component;

/**
 * Spring Shell command for launching PromptLM Studio.
 */
@Component
public class StudioCommands {

    private final PromptLmStudioLauncher promptLmStudioLauncher;

    public StudioCommands(PromptLmStudioLauncher promptLmStudioLauncher) {
        this.promptLmStudioLauncher = promptLmStudioLauncher;
    }

    @Command(
            name = "studio",
            description = "Start PromptLM Studio in the foreground."
    )
    public String studio(
            @Option(longName = "port", defaultValue = "8085", description = "Port used by PromptLM Studio.") int port,
            @Option(longName = "no-browser", defaultValue = "false", description = "Do not auto-open the browser after startup.") boolean noBrowser
    ) {
        return promptLmStudioLauncher.launch(port, noBrowser);
    }
}
