package dev.promptlm.domain;

import tools.jackson.core.JsonGenerator;
import tools.jackson.databind.SerializationContext;
import tools.jackson.databind.ValueSerializer;

import java.nio.file.Path;

public class PathToStringSerializer extends ValueSerializer<Path> {
    @Override
    public void serialize(Path path, JsonGenerator gen, SerializationContext context) {
        gen.writeString(path.toString());
    }
}
