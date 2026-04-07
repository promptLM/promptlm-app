package dev.promptlm.store.github;

import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.Locale;
import java.util.regex.Pattern;

// TODO: MOve out of Git module
@Component
class GitFileNameStrategy {

    private static final Pattern SAFE_SEGMENT_PATTERN = Pattern.compile("[a-z0-9._-]+");

    String buildPromptPath(String group, String name) {
        String normalizedGroup = normalizeSegment(group, "group");
        String normalizedName = normalizeSegment(name, "name");

        return Path.of("prompts")
                .resolve(normalizedGroup)
                .resolve(normalizedName)
                .resolve("promptlm.yml")
                .toString();
    }

    private String normalizeSegment(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " must not be null or empty");
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (normalized.contains("/") || normalized.contains("\\") || normalized.contains("..")) {
            throw new IllegalArgumentException(fieldName + " contains invalid path segment");
        }
        if (!SAFE_SEGMENT_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException(fieldName + " contains unsupported characters");
        }

        return normalized;
    }

}
