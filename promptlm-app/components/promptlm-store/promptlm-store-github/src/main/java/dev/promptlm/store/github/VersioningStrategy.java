package dev.promptlm.store.github;

import dev.promptlm.domain.promptspec.PromptSpec;

public interface VersioningStrategy {
    String getNextDevelopmentVersion(PromptSpec completed);

    String calculateReleaseVersion(PromptSpec completed);

    String calculateReleaseTag(PromptSpec picked);
}
