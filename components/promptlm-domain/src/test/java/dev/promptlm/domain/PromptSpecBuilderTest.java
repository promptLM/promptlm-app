package dev.promptlm.domain;

import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.PromptSpecBuilder;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PromptSpecBuilderTest {

    @Test
    void withMessagePreservesRole() {
        PromptSpec promptSpec = PromptSpecBuilder.builder()
                .withMessage(ChatCompletionRequest.Message.builder()
                        .withRole("system")
                        .withContent("System message")
                        .build())
                .withMessage(ChatCompletionRequest.Message.builder()
                        .withRole("assistant")
                        .withContent("Assistant response")
                        .build())
                .build();

        ChatCompletionRequest request = (ChatCompletionRequest) promptSpec.getRequest();
        List<ChatCompletionRequest.Message> messages = request.getMessages();
        assertEquals("system", messages.get(0).getRole());
        assertEquals("assistant", messages.get(1).getRole());
    }
}
