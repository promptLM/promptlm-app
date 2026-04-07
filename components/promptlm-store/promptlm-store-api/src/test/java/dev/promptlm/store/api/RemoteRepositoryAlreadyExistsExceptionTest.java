package dev.promptlm.store.api;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RemoteRepositoryAlreadyExistsExceptionTest {

    @Test
    void exposesBaseUrlAndRepositoryName() {
        RemoteRepositoryAlreadyExistsException exception =
                new RemoteRepositoryAlreadyExistsException("https://github.com", "acme", "prompts");

        assertEquals("https://github.com", exception.getBaseUrl());
        assertEquals("acme/prompts", exception.getRepositoryName());
        assertTrue(exception.getMessage().contains("https://github.com/acme/prompts"));
    }
}
