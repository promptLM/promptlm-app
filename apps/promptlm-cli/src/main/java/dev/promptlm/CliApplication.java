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
import org.springframework.shell.core.command.CommandExecutionException;
import org.springframework.shell.core.command.CommandNotFoundException;
import org.springframework.shell.core.command.CommandRegistry;

@SpringBootApplication
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
                        "spring.autoconfigure.exclude="
                                + "org.springframework.modulith.runtime.autoconfigure.SpringModulithRuntimeAutoConfiguration,"
                                + "org.springframework.boot.micrometer.metrics.autoconfigure.jvm.JvmMetricsAutoConfiguration"
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
                    runNonInteractive(sourceArgs, commandParser, commandRegistry);
                }
            }
            finally {
                applicationContext.close();
            }
        };
    }

    private static void runNonInteractive(String[] sourceArgs,
                                          CommandParser commandParser,
                                          CommandRegistry commandRegistry) throws Exception {
        try {
            new NonInteractiveShellRunner(commandParser, commandRegistry).run(sourceArgs);
        }
        catch (CommandNotFoundException ex) {
            throw new IllegalArgumentException("Command '%s' not found.".formatted(ex.getCommandName()), ex);
        }
        catch (CommandExecutionException ex) {
            Throwable rootCause = ex;
            while (rootCause.getCause() != null && rootCause.getCause() != rootCause) {
                rootCause = rootCause.getCause();
            }
            String message = rootCause != ex
                    ? "Error executing command: " + rootCause
                    : "Error executing command.";
            throw new IllegalStateException(message, ex);
        }
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
