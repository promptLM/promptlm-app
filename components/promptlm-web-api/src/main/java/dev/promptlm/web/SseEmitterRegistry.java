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

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registry for {@link SseEmitter} instances. Emitters are automatically removed
 * from the registry when they complete or time out.
 */
@Component
public class SseEmitterRegistry {

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    /**
     * Register the given emitter using the provided key. The emitter is removed
     * from the registry when it completes or times out.
     *
     * @param key the identifier associated with the emitter
     * @param emitter the SSE emitter to register
     */
    public void register(String key, SseEmitter emitter) {
        emitter.onCompletion(() -> remove(key));
        emitter.onTimeout(() -> remove(key));
        this.emitters.put(key, emitter);
    }

    public void remove(String key) {
        emitters.remove(key);
    }

    public Optional<SseEmitter> findEmitter(String key) {
        return Optional.ofNullable(emitters.get(key));
    }
}

