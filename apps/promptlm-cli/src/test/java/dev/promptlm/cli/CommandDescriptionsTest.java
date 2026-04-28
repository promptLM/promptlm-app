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

import org.junit.jupiter.api.Test;
import org.springframework.shell.core.command.annotation.Command;
import org.springframework.shell.core.command.annotation.Option;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CommandDescriptionsTest {

    @Test
    void allCliCommandsAndOptionsExposeDescriptionsAndStudioCommandOnly() {
        List<Class<?>> commandContainers = List.of(
                PromptCommands.class,
                RepositoryCommands.class,
                StudioCommands.class
        );

        Set<String> declaredCommandNames = new LinkedHashSet<>();

        for (Class<?> commandContainer : commandContainers) {
            for (Method method : commandContainer.getDeclaredMethods()) {
                Command command = method.getAnnotation(Command.class);
                if (command == null) {
                    continue;
                }
                assertTrue(command.description() != null && !command.description().isBlank(),
                        "Command '" + method + "' must provide a non-blank description.");

                declaredCommandNames.addAll(commandNames(command));

                for (Parameter parameter : method.getParameters()) {
                    Option option = parameter.getAnnotation(Option.class);
                    if (option == null) {
                        continue;
                    }
                    assertTrue(option.description() != null && !option.description().isBlank(),
                            "Option '--" + option.longName() + "' in command method '" + method + "' must provide a non-blank description.");
                }
            }
        }

        assertTrue(declaredCommandNames.contains("studio"),
                "CLI command surface must include the studio command.");
        assertFalse(declaredCommandNames.contains("ui"),
                "CLI command surface must not expose a ui command alias.");
    }

    private static List<String> commandNames(Command command) {
        List<String> names = new ArrayList<>();
        if (command.value() != null && !command.value().isBlank()) {
            names.add(command.value());
        }
        for (String name : command.name()) {
            if (name != null && !name.isBlank()) {
                names.add(name);
            }
        }
        return names;
    }
}
