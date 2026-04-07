package dev.promptlm.domain;

import tools.jackson.databind.MapperFeature;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.SerializationFeature;
import tools.jackson.databind.cfg.DateTimeFeature;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.dataformat.yaml.YAMLMapper;
import tools.jackson.dataformat.yaml.YAMLWriteFeature;

public class ObjectMapperFactory {
    public static ObjectMapper createYamlMapper() {
        return YAMLMapper.builder()
                .enable(YAMLWriteFeature.WRITE_DOC_START_MARKER, YAMLWriteFeature.MINIMIZE_QUOTES)
                .disable(SerializationFeature.FAIL_ON_EMPTY_BEANS)
                .configure(DateTimeFeature.WRITE_DATES_AS_TIMESTAMPS, false)
                .configure(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY, false)
                .build();
    }

    public static JsonMapper createJsonMapper() {
        JsonMapper.Builder builder = JsonMapper.builder()
                .disable(SerializationFeature.FAIL_ON_EMPTY_BEANS)
                .configure(DateTimeFeature.WRITE_DATES_AS_TIMESTAMPS, false)
                .configure(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY, false);

        // MapperFeature.REQUIRE_HANDLERS_FOR_JAVA8_OPTIONALS is not available in all Jackson versions.
        try {
            MapperFeature optionalFeature = MapperFeature.valueOf("REQUIRE_HANDLERS_FOR_JAVA8_OPTIONALS");
            builder.configure(optionalFeature, false);
        } catch (IllegalArgumentException ignored) {
            // Feature not present in this Jackson version; safe to ignore.
        }
        return builder.build();
    }
}
