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
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.annotation.Import;

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
                        // Disable Spring Shell's InteractiveShellRunner so a `promptlm-cli`
                        // invocation with arguments dispatches once through the built-in
                        // NonInteractiveShellRunner instead of also entering an interactive
                        // REPL. Previously we additionally registered a custom
                        // `cliShellApplicationRunner` that re-dispatched every command
                        // through a second NonInteractiveShellRunner — that caused every
                        // CLI command to execute twice in the native binary (see #144),
                        // surfacing as `PromptSpecAlreadyExistsException` /
                        // `JGitInternalException: Destination path ... already exists` in
                        // NativeCliSmokeTest. The built-in runner alone is sufficient.
                        "spring.shell.interactive.enabled=false",
                        "logging.level.dev.promptlm.infrastructure.config.SerializingAppContext=ERROR",
                        "spring.autoconfigure.exclude="
                                + "org.springframework.boot.micrometer.metrics.autoconfigure.jvm.JvmMetricsAutoConfiguration"
                )
                .run(args);
    }
}
