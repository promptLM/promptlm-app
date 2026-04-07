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

public class BatchCommands {

//    private final BatchExecutionFlow flowManager;
//
//    public BatchCommands(BatchExecutionFlow flowManager) {
//        this.flowManager = flowManager;
//    }
//
//    @ShellMethod(key = "watch")
//    public String watch(
//            @ShellOption(value = "source") String source,
//            @ShellOption(value = "processing") String processing,
//            @ShellOption(value = "completed") String completed
//    ) {
//
//        Path s = getAbsolutePath(source);
//        Path p = getAbsolutePath(processing);
//        Path c = getAbsolutePath(completed);
//
//        validatePaths(s, p, c);
//
//        BatchFileTrackingStrategy tracking = new DirectoryBasedBatchFileTrackingStrategy(s, p, c);
//        flowManager.start(tracking);
//        return "Started batch processing.";
//    }
//
//    private void validatePaths(Path... paths) {
//        List<Path> nonExistant = Stream.of(paths).filter(Files::notExists).toList();
//        if (!nonExistant.isEmpty()) {
//            throw new IllegalArgumentException("These path(s) don't exist: %s".formatted(paths));
//        }
//    }
//
//    private static Path getAbsolutePath(String source) {
//        Path path = Path.of(source).toAbsolutePath().normalize();
//        return path;
//    }

}
