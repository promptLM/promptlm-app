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

import java.util.regex.Pattern;

/**
 * Strips credential and payload fragments from vendor exception messages before
 * they reach HTTP response bodies or log lines.
 */
final class VendorMessageSanitizer {

    // Patterns applied in order — order matters: API_KEY before JWT so an sk-... key fragment
    // is consumed before the dot-based JWT pattern can match remnants.
    private static final Pattern API_KEY =
            Pattern.compile("sk-[A-Za-z0-9_-]{10,}");

    // Bearer: base64url + standard base64 alphabet (+/=) to cover opaque OAuth2 tokens.
    private static final Pattern BEARER_TOKEN =
            Pattern.compile("(?i)bearer\\s+[A-Za-z0-9._\\-+/=]+");

    // Three base64url segments each ≥ 10 chars — avoids false positives on dotted version strings.
    private static final Pattern JWT =
            Pattern.compile("[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}");

    // Stop at whitespace and common delimiters so the match does not consume surrounding text
    // (e.g. a URL inside quotes or parentheses).
    private static final Pattern URL =
            Pattern.compile("https?://[^\\s\"'<>)\\]]+");

    // Control characters and ANSI escape sequences that could corrupt log lines.
    private static final Pattern LOG_UNSAFE =
            Pattern.compile("[\r\n]");

    private static final int JSON_REDACT_THRESHOLD = 50;

    private VendorMessageSanitizer() {}

    static String sanitize(String message) {
        if (message == null) {
            return null;
        }
        message = API_KEY.matcher(message).replaceAll("<redacted-api-key>");
        message = BEARER_TOKEN.matcher(message).replaceAll("Bearer <redacted>");
        message = JWT.matcher(message).replaceAll("<redacted-token>");
        message = URL.matcher(message).replaceAll("<redacted-url>");
        message = redactLongJsonFragments(message);
        message = LOG_UNSAFE.matcher(message).replaceAll(" ");
        return message;
    }

    private static String redactLongJsonFragments(String message) {
        StringBuilder result = new StringBuilder(message.length());
        int i = 0;
        while (i < message.length()) {
            char c = message.charAt(i);
            if (c == '{' || c == '[') {
                char closeChar = c == '{' ? '}' : ']';
                int end = matchingClose(message, i, c, closeChar);
                if (end > 0) {
                    if ((end - i) > JSON_REDACT_THRESHOLD) {
                        result.append("<redacted-json>");
                        i = end;
                    } else {
                        result.append(c);
                        i++;
                    }
                } else {
                    // No matching close — if the remaining text from here exceeds the threshold,
                    // redact to end of string to prevent leaking truncated JSON payloads.
                    int remaining = message.length() - i;
                    if (remaining > JSON_REDACT_THRESHOLD) {
                        result.append("<redacted-json>");
                        i = message.length();
                    } else {
                        result.append(c);
                        i++;
                    }
                }
            } else {
                result.append(c);
                i++;
            }
        }
        return result.toString();
    }

    private static int matchingClose(String s, int openIdx, char openChar, char closeChar) {
        int depth = 1;
        int i = openIdx + 1;
        while (i < s.length()) {
            char c = s.charAt(i);
            if (c == openChar) {
                depth++;
            } else if (c == closeChar) {
                depth--;
                if (depth == 0) {
                    return i + 1;
                }
            }
            i++;
        }
        return -1;
    }
}
