package dev.promptlm.prompt.control;

import dev.promptlm.prompt.evaluation.PromptLmEvaluatedEvent;
import dev.promptlm.prompt.execution.PromptLmExecutedEvent;
import dev.promptlm.prompt.core.PromptLmChangedEvent;
import org.springframework.modulith.events.ApplicationModuleListener;

public class PromptLMApplicationControl {

    @ApplicationModuleListener
    void onApplicationModuleEvent(PromptLmChangedEvent changed) {

    }

    @ApplicationModuleListener
    void onApplicationModuleEvent(PromptLmExecutedEvent executed) {

    }

    @ApplicationModuleListener
    void onApplicationModuleEvent(PromptLmEvaluatedEvent evaluated) {

    }

}
