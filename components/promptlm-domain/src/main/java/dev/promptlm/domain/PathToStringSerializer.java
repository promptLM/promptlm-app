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

package dev.promptlm.domain;

import tools.jackson.core.JsonGenerator;
import tools.jackson.databind.SerializationContext;
import tools.jackson.databind.ValueSerializer;

import java.nio.file.Path;

/**
 * Jackson serializer that writes a {@link java.nio.file.Path} as its string representation.
 */
public class PathToStringSerializer extends ValueSerializer<Path> {
    @Override
    public void serialize(Path path, JsonGenerator gen, SerializationContext context) {
        gen.writeString(path.toString());
    }
}
