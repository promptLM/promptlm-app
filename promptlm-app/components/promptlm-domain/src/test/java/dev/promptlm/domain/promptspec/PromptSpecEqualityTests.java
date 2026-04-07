package dev.promptlm.domain.promptspec;

import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.Request;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PromptSpecEqualityTests {

    private PromptSpec createPromptSpec(String id, String name, String group, String version, int revision) {
        Request request = ChatCompletionRequest.builder().build();
        return PromptSpec.builder()
                .withGroup(group)
                .withName(name)
                .withVersion(version)
                .withRevision(revision)
                .withDescription("desc")
                .withRequest(request)
                .build()
                .withId(id);
    }

    @Test
    void promptSpecsWithSameIdentityAreEqual() {
        PromptSpec spec1 = createPromptSpec("id1", "name", "group1", "1", 1);
        PromptSpec spec2 = createPromptSpec("id2", "name", "group1", "1", 1);
        assertEquals(spec1, spec2);
        assertEquals(spec1.hashCode(), spec2.hashCode());
    }

    @Test
    void promptSpecsWithDifferentNameAreNotEqual() {
        PromptSpec spec1 = createPromptSpec("id", "name1", "group1", "1", 1);
        PromptSpec spec2 = createPromptSpec("id", "name2", "group1", "1", 1);
        assertNotEquals(spec1, spec2);
    }

    @Test
    void promptSpecsWithDifferentGroupAreNotEqual() {
        PromptSpec spec1 = createPromptSpec("id", "name", "group1", "1", 1);
        PromptSpec spec2 = createPromptSpec("id", "name", "group2", "1", 1);
        assertNotEquals(spec1, spec2);
    }

    @Test
    void promptSpecsWithDifferentVersionAreNotEqual() {
        PromptSpec spec1 = createPromptSpec("id", "name", "group1", "1", 1);
        PromptSpec spec2 = createPromptSpec("id", "name", "group1", "2", 1);
        assertNotEquals(spec1, spec2);
    }

    @Test
    void promptSpecsWithDifferentRevisionAreNotEqual() {
        PromptSpec spec1 = createPromptSpec("id", "name", "group1", "1", 1);
        PromptSpec spec2 = createPromptSpec("id", "name", "group1", "1", 2);
        assertNotEquals(spec1, spec2);
    }
}
