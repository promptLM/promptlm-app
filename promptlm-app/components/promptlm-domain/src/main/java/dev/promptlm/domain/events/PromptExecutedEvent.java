package dev.promptlm.domain.events;

import dev.promptlm.domain.promptspec.PromptSpec;

public record PromptExecutedEvent(PromptSpec promptSpec) {
}
