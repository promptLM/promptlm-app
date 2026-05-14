/*
 * Copyright 2025 promptLM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package dev.promptlm.web;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class VendorMessageSanitizerTest {

    // --- null / clean ---

    @Test
    void nullReturnsNull() {
        assertThat(VendorMessageSanitizer.sanitize(null)).isNull();
    }

    @Test
    void cleanMessageIsUnchanged() {
        String message = "Rate limit exceeded. Please retry after 60 seconds.";
        assertThat(VendorMessageSanitizer.sanitize(message)).isEqualTo(message);
    }

    // --- API key ---

    @Test
    void apiKeyIsRedacted() {
        String message = "Incorrect API key provided: sk-proj-abc123XYZ_test-keyABCDEF";
        String sanitized = VendorMessageSanitizer.sanitize(message);
        assertThat(sanitized).doesNotContain("sk-proj-abc123XYZ_test-keyABCDEF");
        assertThat(sanitized).contains("<redacted-api-key>");
        assertThat(sanitized).startsWith("Incorrect API key provided: ");
    }

    @Test
    void shortSkPrefixNotRedacted() {
        // "sk-ab" is too short to be a real API key — should pass through
        String message = "Error code sk-ab occurred";
        assertThat(VendorMessageSanitizer.sanitize(message)).isEqualTo(message);
    }

    // --- Bearer token ---

    @Test
    void bearerTokenIsRedacted() {
        String message = "Authorization failed: Bearer eyJhbGciOiJSUzI1NiJ9.payload.sig";
        String sanitized = VendorMessageSanitizer.sanitize(message);
        assertThat(sanitized).doesNotContain("eyJhbGciOiJSUzI1NiJ9");
        assertThat(sanitized).contains("Bearer <redacted>");
    }

    @Test
    void bearerTokenRedactionIsCaseInsensitive() {
        String message = "BEARER supersecrettoken123";
        String sanitized = VendorMessageSanitizer.sanitize(message);
        assertThat(sanitized).doesNotContain("supersecrettoken123");
        assertThat(sanitized).contains("Bearer <redacted>");
    }

    @Test
    void bearerTokenWithStandardBase64CharsIsRedacted() {
        // OAuth2 opaque tokens use +, /, = (standard base64, not base64url)
        String message = "Bearer abc123+XYZ/foo=bar==";
        String sanitized = VendorMessageSanitizer.sanitize(message);
        assertThat(sanitized).doesNotContain("abc123+XYZ/foo=bar==");
        assertThat(sanitized).contains("Bearer <redacted>");
    }

    // --- JWT ---

    @Test
    void jwtIsRedacted() {
        String jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV";
        String message = "Token invalid: " + jwt;
        String sanitized = VendorMessageSanitizer.sanitize(message);
        assertThat(sanitized).doesNotContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
        assertThat(sanitized).contains("<redacted-token>");
    }

    @Test
    void shortVersionStringIsNotRedactedAsJwt() {
        String message = "Unsupported model version 1.2.3";
        assertThat(VendorMessageSanitizer.sanitize(message)).isEqualTo(message);
    }

    @Test
    void messageWithApiKeyAndJwtBothRedacted() {
        String message = "key=sk-abcdefghijklmnop jwt=eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyMSJ9.SomeSignature123";
        String sanitized = VendorMessageSanitizer.sanitize(message);
        assertThat(sanitized)
                .doesNotContain("sk-abcdefghijklmnop")
                .doesNotContain("eyJhbGciOiJSUzI1NiJ9")
                .contains("<redacted-api-key>")
                .contains("<redacted-token>");
    }

    // --- URL ---

    @Test
    void urlIsRedacted() {
        String message = "POST https://api.openai.com/v1/chat/completions returned 401";
        String sanitized = VendorMessageSanitizer.sanitize(message);
        assertThat(sanitized).doesNotContain("https://api.openai.com/v1/chat/completions");
        assertThat(sanitized).contains("<redacted-url>");
        assertThat(sanitized).contains("POST");
        assertThat(sanitized).contains("returned 401");
    }

    @Test
    void urlInsideQuotesDoesNotConsumeTrailingQuote() {
        // The URL regex must stop at the closing quote
        String message = "Error at \"https://api.example.com/v1/endpoint\" in request";
        String sanitized = VendorMessageSanitizer.sanitize(message);
        assertThat(sanitized).doesNotContain("https://api.example.com");
        assertThat(sanitized).contains("<redacted-url>");
        assertThat(sanitized).contains("\" in request");
    }

    // --- JSON fragments ---

    @Test
    void shortJsonPassesThrough() {
        // Under the 50-char threshold
        String message = "Error: {\"code\":42}";
        assertThat(VendorMessageSanitizer.sanitize(message)).isEqualTo(message);
    }

    @Test
    void longJsonObjectIsRedacted() {
        String json = "{\"error\":{\"message\":\"Incorrect API key\",\"type\":\"invalid_request_error\",\"code\":\"invalid_api_key\"}}";
        String message = "Vendor error: " + json;
        String sanitized = VendorMessageSanitizer.sanitize(message);
        assertThat(sanitized).doesNotContain("invalid_request_error");
        assertThat(sanitized).contains("<redacted-json>");
        assertThat(sanitized).startsWith("Vendor error: ");
    }

    @Test
    void longJsonArrayIsRedacted() {
        String json = "[\"model\",\"gpt-4\",\"temperature\",\"0.7\",\"max_tokens\",\"2048\",\"extra_padding_to_exceed_threshold\"]";
        String message = "Payload: " + json;
        String sanitized = VendorMessageSanitizer.sanitize(message);
        assertThat(sanitized).doesNotContain("gpt-4");
        assertThat(sanitized).contains("<redacted-json>");
    }

    @Test
    void unclosedLongJsonIsRedacted() {
        // Truncated vendor payload — no closing brace but over threshold
        String message = "Payload: {\"model\":\"gpt-4\",\"messages\":[{\"role\":\"user\",\"content\":\"secret prompt here";
        String sanitized = VendorMessageSanitizer.sanitize(message);
        assertThat(sanitized).doesNotContain("secret prompt here");
        assertThat(sanitized).contains("<redacted-json>");
    }

    @Test
    void adjacentJsonObjectsAreEachEvaluatedIndependently() {
        // First object is short (passes through); second is long (redacted)
        String shortJson = "{\"a\":1}";
        String longJson = "{\"error\":{\"message\":\"Incorrect API key\",\"type\":\"invalid_request_error\",\"code\":\"invalid_api_key\"}}";
        String message = "first=" + shortJson + " second=" + longJson;
        String sanitized = VendorMessageSanitizer.sanitize(message);
        assertThat(sanitized).contains(shortJson);
        assertThat(sanitized).doesNotContain("invalid_request_error");
        assertThat(sanitized).contains("<redacted-json>");
    }

    // --- Log injection ---

    @Test
    void newlinesAreStripped() {
        String message = "Error line one\ninjected log line\rcarriage return";
        String sanitized = VendorMessageSanitizer.sanitize(message);
        assertThat(sanitized).doesNotContain("\n").doesNotContain("\r");
    }

    // --- Multiple secrets ---

    @Test
    void multipleSecretsInOneMessageAreAllRedacted() {
        String message = "key=sk-abcdefghijklmnop url=https://secret.internal/path token=Bearer abcdefghijklmnop";
        String sanitized = VendorMessageSanitizer.sanitize(message);
        assertThat(sanitized)
                .doesNotContain("sk-abcdefghijklmnop")
                .doesNotContain("https://secret.internal/path")
                .doesNotContain("token=Bearer abcdefghijklmnop")
                .contains("<redacted-api-key>")
                .contains("<redacted-url>")
                .contains("Bearer <redacted>");
    }
}
