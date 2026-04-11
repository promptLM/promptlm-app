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

import dev.promptlm.cli.PromptCommands;
import dev.promptlm.cli.RepositoryCommands;
import dev.promptlm.cli.UiCommands;
import dev.promptlm.domain.BasicAppContext;
import dev.promptlm.domain.projectspec.ProjectHealthStatus;
import dev.promptlm.domain.projectspec.ProjectSpec;
import org.springframework.aot.hint.MemberCategory;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.ImportRuntimeHints;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.shell.core.command.Command;
import org.springframework.shell.core.command.CommandRegistry;
import org.springframework.shell.core.command.annotation.support.CommandFactoryBean;
import org.springframework.shell.core.utils.Utils;

import java.util.Arrays;
import java.lang.reflect.Method;
import java.util.stream.Stream;

/**
 * AOT/native-image configuration for the CLI application.
 * <p>
 * Spring Shell's default annotated command discovery relies on classpath scanning.
 * In native images that scanner does not discover application classes, so command
 * registration is performed explicitly from known command containers.
 */
@Configuration
@ImportRuntimeHints(CliNativeConfiguration.CliRuntimeHints.class)
class CliNativeConfiguration {

    @Bean
    CommandRegistry commandRegistry(ApplicationContext applicationContext) {
        CommandRegistry commandRegistry = new CommandRegistry();

        applicationContext.getBeansOfType(Command.class)
                .values()
                .forEach(commandRegistry::registerCommand);

        registerAnnotatedCommands(applicationContext, commandRegistry, PromptCommands.class);
        registerAnnotatedCommands(applicationContext, commandRegistry, RepositoryCommands.class);
        registerAnnotatedCommands(applicationContext, commandRegistry, UiCommands.class);

        commandRegistry.registerCommand(Utils.QUIT_COMMAND);
        return commandRegistry;
    }

    private static void registerAnnotatedCommands(ApplicationContext applicationContext,
                                                  CommandRegistry commandRegistry,
                                                  Class<?> commandContainerType) {
        Arrays.stream(commandContainerType.getDeclaredMethods())
                .filter(method -> AnnotatedElementUtils.hasAnnotation(
                        method, org.springframework.shell.core.command.annotation.Command.class))
                .forEach(method -> commandRegistry.registerCommand(createCommand(applicationContext, method)));
    }

    private static Command createCommand(ApplicationContext applicationContext, Method method) {
        CommandFactoryBean factoryBean = new CommandFactoryBean(method);
        factoryBean.setApplicationContext(applicationContext);
        return factoryBean.getObject();
    }

    static class CliRuntimeHints implements RuntimeHintsRegistrar {

        @Override
        public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
            Stream.of(PromptCommands.class, RepositoryCommands.class, UiCommands.class)
                    .forEach(cls -> hints.reflection().registerType(cls, hint ->
                            hint.withMembers(
                                    MemberCategory.INVOKE_DECLARED_CONSTRUCTORS,
                                    MemberCategory.INVOKE_DECLARED_METHODS
                            )));

            Stream.of(BasicAppContext.class, ProjectSpec.class, ProjectHealthStatus.class)
                    .forEach(cls -> hints.reflection().registerType(cls, hint ->
                            hint.withMembers(MemberCategory.values())));
        }

    }

}
