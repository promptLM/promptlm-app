package dev.promptlm.domain.promptspec;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonInclude;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.MapperFeature;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.SerializationFeature;
import tools.jackson.databind.json.JsonMapper;
import dev.promptlm.domain.promptspec.PromptSpec.Placeholders;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@JsonAutoDetect(fieldVisibility = JsonAutoDetect.Visibility.ANY)
final class PromptSpecHash {

    private static final ObjectMapper HASH_MAPPER = JsonMapper.builder()
            .changeDefaultPropertyInclusion(value -> value.withValueInclusion(JsonInclude.Include.NON_NULL))
            .enable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS)
            .enable(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY)
            .build();

    private final RequestHash request;
    private final PlaceholdersHash placeholders;
    private final Object extensionsSpec;

    private PromptSpecHash(RequestHash request,
                           PlaceholdersHash placeholders,
                           Object extensionsSpec) {
        this.request = request;
        this.placeholders = placeholders;
        this.extensionsSpec = extensionsSpec;
    }

    static byte[] serialize(PromptSpec spec) {
        PromptSpecHash hash = new PromptSpecHash(
                RequestHash.from(spec.getRequest()),
                PlaceholdersHash.from(spec.getPlaceholders()),
                canonicalizeExtensionsSpec(spec.getExtensions())
        );
        if (hash.request == null
                && hash.placeholders == null
                && hash.extensionsSpec == null) {
            return null;
        }
        try {
            return HASH_MAPPER.writeValueAsBytes(hash);
        } catch (JacksonException e) {
            throw new IllegalStateException("Unable to serialize PromptSpec hash", e);
        }
    }

    private record RequestHash(
            String requestClass,
            String vendor,
            String model,
            String url,
            ChatCompletionHash chat,
            ImagesGenerationsHash image,
            AudioSpeechHash audio) {

        private static RequestHash from(Request request) {
            if (request == null) {
                return null;
            }
            if (request instanceof ChatCompletionRequest chatRequest) {
                return new RequestHash(
                        request.getClass().getName(),
                        request.getVendor(),
                        request.getModel(),
                        request.getUrl(),
                        ChatCompletionHash.from(chatRequest),
                        null,
                        null
                );
            }
            if (request instanceof ImagesGenerationsRequest imagesRequest) {
                return new RequestHash(
                        request.getClass().getName(),
                        request.getVendor(),
                        request.getModel(),
                        request.getUrl(),
                        null,
                        ImagesGenerationsHash.from(imagesRequest),
                        null
                );
            }
            if (request instanceof AudioSpeechRequest audioRequest) {
                return new RequestHash(
                        request.getClass().getName(),
                        request.getVendor(),
                        request.getModel(),
                        request.getUrl(),
                        null,
                        null,
                        AudioSpeechHash.from(audioRequest)
                );
            }
            return new RequestHash(
                    request.getClass().getName(),
                    request.getVendor(),
                    request.getModel(),
                    request.getUrl(),
                    null,
                    null,
                    null
            );
        }
    }

    private record ChatCompletionHash(
            String type,
            String modelSnapshot,
            Map<String, Object> parameters,
            List<MessageHash> messages) {

        private static ChatCompletionHash from(ChatCompletionRequest request) {
            return new ChatCompletionHash(
                    request.getType(),
                    request.getModelSnapshot(),
                    canonicalizeMap(request.getParameters()),
                    MessageHash.fromMessages(request.getMessages())
            );
        }
    }

    private record MessageHash(String role, String name, String content) {

        private static List<MessageHash> fromMessages(List<ChatCompletionRequest.Message> messages) {
            if (messages == null) {
                return null;
            }
            List<MessageHash> hashes = new ArrayList<>(messages.size());
            for (ChatCompletionRequest.Message message : messages) {
                hashes.add(new MessageHash(message.getRole(), message.getName(), message.getContent()));
            }
            return hashes;
        }
    }

    private record ImagesGenerationsHash(String type, String imageUrl) {

        private static ImagesGenerationsHash from(ImagesGenerationsRequest request) {
            return new ImagesGenerationsHash(request.getType(), request.getImageUrl());
        }
    }

    private record AudioSpeechHash(String type, String input, String voice, String responseFormat, Float speed) {

        private static AudioSpeechHash from(AudioSpeechRequest request) {
            String responseFormat = request.getResponseFormat() == null ? null : request.getResponseFormat().name();
            return new AudioSpeechHash(request.getType(), request.getInput(), request.getVoice(), responseFormat, request.getSpeed());
        }
    }

    private record PlaceholdersHash(String startPattern, String endPattern, List<PlaceholderEntry> list) {

        private static PlaceholdersHash from(Placeholders placeholders) {
            if (placeholders == null) {
                return null;
            }
            List<PlaceholderEntry> entries = PlaceholderEntry.sorted(placeholders.getDefaults());
            return new PlaceholdersHash(placeholders.getStartPattern(), placeholders.getEndPattern(), entries);
        }
    }

    private record PlaceholderEntry(String name, String value) {

        private static List<PlaceholderEntry> sorted(Map<String, String> defaults) {
            if (defaults == null || defaults.isEmpty()) {
                return null;
            }
            return defaults.entrySet().stream()
                    .filter(entry -> entry.getKey() != null)
                    .sorted(Map.Entry.comparingByKey())
                    .map(entry -> new PlaceholderEntry(entry.getKey(), entry.getValue()))
                    .toList();
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> canonicalizeMap(Map<String, Object> map) {
        if (map == null || map.isEmpty()) {
            return null;
        }
        TreeMap<String, Object> sorted = new TreeMap<>(Comparator.nullsFirst(String::compareTo));
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            sorted.put(entry.getKey(), canonicalizeValue(entry.getValue()));
        }
        return sorted;
    }

    private static Object canonicalizeExtensionsSpec(Map<String, tools.jackson.databind.JsonNode> extensions) {
        if (extensions == null || extensions.isEmpty()) {
            return null;
        }
        TreeMap<String, Object> specPayloads = new TreeMap<>(Comparator.nullsFirst(String::compareTo));
        for (Map.Entry<String, tools.jackson.databind.JsonNode> entry : extensions.entrySet()) {
            String key = entry.getKey();
            if (key == null) {
                continue;
            }
            tools.jackson.databind.JsonNode node = entry.getValue();
            if (node == null || !node.isObject()) {
                continue;
            }
            tools.jackson.databind.JsonNode specNode = node.get("spec");
            if (specNode == null || specNode.isNull()) {
                continue;
            }
            Object converted = HASH_MAPPER.convertValue(specNode, Object.class);
            specPayloads.put(key, canonicalizeValue(converted));
        }
        return specPayloads.isEmpty() ? null : specPayloads;
    }

    private static Object canonicalizeValue(Object value) {
        if (value instanceof Map<?, ?> map) {
            TreeMap<String, Object> nested = new TreeMap<>(Comparator.nullsFirst(String::compareTo));
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                nested.put(entry.getKey() == null ? null : entry.getKey().toString(), canonicalizeValue(entry.getValue()));
            }
            return nested;
        }
        if (value instanceof List<?> list) {
            List<Object> canonical = new ArrayList<>(list.size());
            for (Object element : list) {
                canonical.add(canonicalizeValue(element));
            }
            return canonical;
        }
        return value;
    }
}
