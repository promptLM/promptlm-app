package dev.promptlm.store.github;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpecIdGenerator;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
class GitBasedPromptSpecIdGenerator implements PromptSpecIdGenerator {

    private final ObjectMapper modelYamlMapper;

    public GitBasedPromptSpecIdGenerator(@Qualifier("modelYamlMapper") ObjectMapper modelYamlMapper) {
        this.modelYamlMapper = modelYamlMapper;
    }

    @Override
    public String generateId(String group, String name, List<ChatCompletionRequest.Message> userMessage) {
        try {
            String safeGroup = group == null ? "" : group;
            String safeName = name == null ? "" : name;
            List<ChatCompletionRequest.Message> safeMessages = userMessage == null ? List.of() : userMessage;

            Map<String, Object> payload = new HashMap<>();
            payload.put("group", safeGroup);
            payload.put("name", safeName);
            payload.put("message", safeMessages);

            String serializedPrompt = modelYamlMapper.writeValueAsString(payload);
            String promptId = hashPromptContent(serializedPrompt);
            return promptId;
        } catch (JacksonException e) {
            throw new RuntimeException(e);
        }
    }

    private String hashPromptContent(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                hexString.append(String.format("%02x", b));
            }
            return hexString.substring(0, 8);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Failed to hash prompt content", e);
        }
    }

}
