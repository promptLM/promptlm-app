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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

/**
 * Publishes status updates to SSE clients that are registered in {@link SseEmitterRegistry}.
 */
@Component
public class SseStatusPublisher {

    private static final Logger log = LoggerFactory.getLogger(SseStatusPublisher.class);
    private static final String EVENT_NAME = "status";

    private final SseEmitterRegistry emitterRegistry;

    public SseStatusPublisher(SseEmitterRegistry emitterRegistry) {
        this.emitterRegistry = emitterRegistry;
    }

    public void sendStatus(String key,
                           String operation,
                           String status,
                           String message,
                           Map<String, Object> details) {
        if (!StringUtils.hasText(key)) {
            return;
        }
        emitterRegistry.findEmitter(key).ifPresent(emitter -> {
            Map<String, Object> normalizedDetails = details != null && !details.isEmpty() ? Map.copyOf(details) : null;
            StoreStatusEvent payload = new StoreStatusEvent(
                    operation,
                    status,
                    message,
                    Instant.now(),
                    normalizedDetails
            );
            try {
                emitter.send(SseEmitter.event().name(EVENT_NAME).data(payload));
            } catch (IOException ex) {
                log.debug("Removing SSE emitter for key '{}' after send failure: {}", key, ex.getMessage());
                emitterRegistry.remove(key);
            }
        });
    }

    public void connected(String key, String operation, Map<String, Object> details) {
        sendStatus(key, operation, "connected", "SSE stream connected", details);
    }

    public void started(String key, String operation, String message, Map<String, Object> details) {
        sendStatus(key, operation, "started", message, details);
    }

    public void progress(String key, String operation, String message, Map<String, Object> details) {
        sendStatus(key, operation, "progress", message, details);
    }

    public void completed(String key, String operation, String message, Map<String, Object> details) {
        sendStatus(key, operation, "completed", message, details);
    }

    public void failed(String key, String operation, String message, Map<String, Object> details) {
        sendStatus(key, operation, "failed", message, details);
    }
}
