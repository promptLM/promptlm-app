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

package dev.promptlm.restdocs;

import tools.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.responses.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "promptlm.openapi.examples.enabled", havingValue = "true")
public class OpenApiExampleConfig {
    private static final Logger log = LoggerFactory.getLogger(OpenApiExampleConfig.class);

    private static final String MANIFEST_PATH = "openapi/examples/manifest.json";

    @Bean
    public OpenApiCustomizer openApiExampleCustomizer(ObjectMapper objectMapper) {
        return openApi -> {
            ExampleManifest manifest = loadManifest(objectMapper);
            if (manifest == null || manifest.responses() == null) {
                return;
            }

            for (ExampleEntry entry : manifest.responses()) {
                if (entry == null || entry.example() == null) {
                    continue;
                }
                ExampleKey key = new ExampleKey(entry.method(), entry.path(), entry.status());
                Object example = loadExample(objectMapper, entry.example());
                if (example == null) {
                    continue;
                }
                attachExample(openApi, key, example);
            }
        };
    }

    private ExampleManifest loadManifest(ObjectMapper objectMapper) {
        ClassPathResource resource = new ClassPathResource(MANIFEST_PATH);
        if (!resource.exists()) {
            log.warn("OpenAPI example manifest missing: {}", MANIFEST_PATH);
            return null;
        }
        try (InputStream inputStream = resource.getInputStream()) {
            return objectMapper.readValue(inputStream, ExampleManifest.class);
        }
        catch (IOException e) {
            log.warn("Failed to load OpenAPI example manifest {}", MANIFEST_PATH, e);
            return null;
        }
    }

    private Object loadExample(ObjectMapper objectMapper, String resourcePath) {
        ClassPathResource resource = new ClassPathResource(resourcePath);
        if (!resource.exists()) {
            log.warn("OpenAPI example resource missing: {}", resourcePath);
            return null;
        }
        try (InputStream inputStream = resource.getInputStream()) {
            return objectMapper.readValue(inputStream, Object.class);
        }
        catch (IOException e) {
            log.warn("Failed to load OpenAPI example resource {}", resourcePath, e);
            return null;
        }
    }

    private void attachExample(OpenAPI openApi, ExampleKey key, Object example) {
        if (openApi.getPaths() == null) {
            return;
        }
        PathItem pathItem = openApi.getPaths().get(key.path());
        if (pathItem == null) {
            log.debug("OpenAPI path not found for example: {}", key);
            return;
        }
        Operation operation = resolveOperation(pathItem, key.method());
        if (operation == null || operation.getResponses() == null) {
            log.debug("OpenAPI operation not found for example: {}", key);
            return;
        }
        ApiResponse response = operation.getResponses().get(key.status());
        if (response == null) {
            log.debug("OpenAPI response not found for example: {}", key);
            return;
        }
        Content content = response.getContent();
        if (content == null) {
            return;
        }
        MediaType mediaType = content.get("application/json");
        if (mediaType == null) {
            return;
        }
        mediaType.setExample(example);
    }

    private Operation resolveOperation(PathItem pathItem, String method) {
        String normalized = method.toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "GET" -> pathItem.getGet();
            case "POST" -> pathItem.getPost();
            case "PUT" -> pathItem.getPut();
            case "PATCH" -> pathItem.getPatch();
            case "DELETE" -> pathItem.getDelete();
            case "HEAD" -> pathItem.getHead();
            case "OPTIONS" -> pathItem.getOptions();
            case "TRACE" -> pathItem.getTrace();
            default -> null;
        };
    }

    private record ExampleKey(String method, String path, String status) {
        ExampleKey {
            Objects.requireNonNull(method, "method");
            Objects.requireNonNull(path, "path");
            Objects.requireNonNull(status, "status");
        }
    }

    private record ExampleEntry(String method, String path, String status, String example) {
    }

    private record ExampleManifest(List<ExampleEntry> responses) {
    }
}
