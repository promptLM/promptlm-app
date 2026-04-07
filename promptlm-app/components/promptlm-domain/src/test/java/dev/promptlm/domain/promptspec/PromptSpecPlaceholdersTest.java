package dev.promptlm.domain.promptspec;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PromptSpecPlaceholdersTest {

    @Test
    void getDefaultsAllowsNullValues() {
        PromptSpec.Placeholders placeholders = new PromptSpec.Placeholders();
        placeholders.setList(List.of(new PromptSpec.Placeholder("customer_name", null)));

        Map<String, String> defaults = placeholders.getDefaults();

        assertEquals(1, defaults.size());
        assertNull(defaults.get("customer_name"));
    }

    @Test
    void getDefaultsRejectsDuplicatePlaceholderNames() {
        PromptSpec.Placeholders placeholders = new PromptSpec.Placeholders();
        placeholders.setList(List.of(
                new PromptSpec.Placeholder("customer_name", "Alice"),
                new PromptSpec.Placeholder("customer_name", "Bob")
        ));

        assertThrows(IllegalStateException.class, placeholders::getDefaults);
    }
}

