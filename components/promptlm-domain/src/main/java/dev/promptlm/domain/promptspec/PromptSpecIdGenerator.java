package dev.promptlm.domain.promptspec;

import java.util.List;

public interface PromptSpecIdGenerator {
    String generateId(String group, String name, List<ChatCompletionRequest.Message> userMessage);

    default PromptSpec generateAndAttachPromptSpecId(PromptSpec promptSpec) {
        if (promptSpec == null) {
            return null;
        }
        List<ChatCompletionRequest.Message> messages = List.of();
        Request request = promptSpec.getRequest();
        if (request instanceof ChatCompletionRequest chatCompletionRequest && chatCompletionRequest.getMessages() != null) {
            messages = chatCompletionRequest.getMessages();
        }
        String id = generateId(promptSpec.getGroup(), promptSpec.getName(), messages);
        return promptSpec.withId(id);
    }
}
