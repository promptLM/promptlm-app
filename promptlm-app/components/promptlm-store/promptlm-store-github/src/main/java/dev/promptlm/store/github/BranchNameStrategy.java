package dev.promptlm.store.github;

import dev.promptlm.domain.promptspec.PromptSpec;
import org.springframework.stereotype.Component;

@Component
class BranchNameStrategy {
    public String buildName(PromptSpec promptSpec) {
        return promptSpec.getName().replace(" ", "_");
    }
}
