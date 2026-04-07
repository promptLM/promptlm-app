package dev.promptlm.store.github;

import dev.promptlm.lifecycle.application.PromptStorePort;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.store.api.PromptStore;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
class PromptStoreAdapter implements PromptStorePort {

    private final PromptStore promptStore;

    PromptStoreAdapter(PromptStore promptStore) {
        this.promptStore = promptStore;
    }

    @Override
    public Optional<PromptSpec> findPromptSpec(String group, String name) {
        return promptStore.findPromptSpec(group, name);
    }

    @Override
    public String findPromptSpecTemplate(String group) {
        return promptStore.findPromptSpecTemplate(group);
    }

    @Override
    public PromptSpec storePrompt(PromptSpec promptSpec) {
        return promptStore.storePrompt(promptSpec);
    }

    @Override
    public Optional<PromptSpec> getLatestVersion(String promptSpecId) {
        return promptStore.getLatestVersion(promptSpecId);
    }

    @Override
    public PromptSpec release(PromptSpec promptSpec) {
        return promptStore.release(promptSpec);
    }
}
