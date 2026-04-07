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

import dev.promptlm.infrastructure.config.ObjectMapperConfiguration;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.shell.core.NonInteractiveShellRunner;
import org.springframework.shell.core.ShellRunner;
import org.springframework.shell.core.command.CommandParser;
import org.springframework.shell.core.command.CommandRegistry;
import org.springframework.shell.core.command.annotation.EnableCommand;

@SpringBootApplication
@EnableCommand({
        dev.promptlm.cli.PromptCommands.class,
        dev.promptlm.cli.RepositoryCommands.class,
        dev.promptlm.cli.UiCommands.class
})
@Import(ObjectMapperConfiguration.class)
public class CliApplication {

    public static void main(String[] args) {
        new SpringApplicationBuilder(CliApplication.class)
                .web(WebApplicationType.NONE)
                .lazyInitialization(true)
                .headless(false)
                .logStartupInfo(false)
                .properties(
                        "debug=false",
                        "spring.main.banner-mode=off",
                        "spring.autoconfigure.exclude=org.springframework.modulith.runtime.autoconfigure.SpringModulithRuntimeAutoConfiguration"
                )
                .run(args);
    }

    @Bean
    ApplicationRunner cliShellApplicationRunner(ShellRunner shellRunner,
                                                CommandParser commandParser,
                                                CommandRegistry commandRegistry,
                                                ConfigurableApplicationContext applicationContext) {
        return applicationArguments -> {
            String[] sourceArgs = normalizeArgs(applicationArguments.getSourceArgs());
            try {
                if (sourceArgs.length == 0) {
                    shellRunner.run(sourceArgs);
                }
                else {
                    new NonInteractiveShellRunner(commandParser, commandRegistry).run(sourceArgs);
                }
            }
            finally {
                applicationContext.close();
            }
        };
    }

    private static String[] normalizeArgs(String[] sourceArgs) {
        if (sourceArgs.length == 1) {
            return switch (sourceArgs[0]) {
                case "--help", "-h" -> new String[]{"help"};
                case "--version", "-V" -> new String[]{"version"};
                default -> sourceArgs;
            };
        }
        return sourceArgs;
    }
}
