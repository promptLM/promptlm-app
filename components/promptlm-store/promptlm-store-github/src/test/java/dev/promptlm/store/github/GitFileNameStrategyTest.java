package dev.promptlm.store.github;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GitFileNameStrategyTest {

    private final GitFileNameStrategy strategy = new GitFileNameStrategy();

    @Test
    void buildPromptPathNormalizesToLowercaseSafeSegments() {
        String path = strategy.buildPromptPath("Support-Team", "Quarterly_Report");

        assertThat(path).isEqualTo("prompts/support-team/quarterly_report/promptlm.yml");
    }

    @Test
    void buildPromptPathRejectsTraversalInGroupSegment() {
        assertThatThrownBy(() -> strategy.buildPromptPath("../secrets", "name"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("group contains invalid path segment");
    }

    @Test
    void buildPromptPathRejectsTraversalInNameSegment() {
        assertThatThrownBy(() -> strategy.buildPromptPath("group", "..\\secret"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("name contains invalid path segment");
    }

    @Test
    void buildPromptPathRejectsUnsupportedCharacters() {
        assertThatThrownBy(() -> strategy.buildPromptPath("group one", "name"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("group contains unsupported characters");
    }
}
