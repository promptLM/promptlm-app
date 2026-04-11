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
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class SseStatusPublisherTest {

    @Test
    void shouldSendStatusEventToRegisteredEmitter() throws IOException {
        SseEmitterRegistry registry = new SseEmitterRegistry();
        SseEmitter emitter = mock(SseEmitter.class);
        registry.register("op-1", emitter);
        SseStatusPublisher publisher = new SseStatusPublisher(registry);

        publisher.started("op-1", "clone-store", "started cloning", Map.of("operationId", "op-1"));

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    void shouldRemoveEmitterAfterSendFailure() throws IOException {
        SseEmitterRegistry registry = new SseEmitterRegistry();
        SseEmitter emitter = mock(SseEmitter.class);
        doThrow(new IOException("boom")).when(emitter).send(any(SseEmitter.SseEventBuilder.class));
        registry.register("op-2", emitter);
        SseStatusPublisher publisher = new SseStatusPublisher(registry);

        publisher.failed("op-2", "clone-store", "clone failed", Map.of("operationId", "op-2"));

        assertThat(registry.findEmitter("op-2")).isEmpty();
    }
}
