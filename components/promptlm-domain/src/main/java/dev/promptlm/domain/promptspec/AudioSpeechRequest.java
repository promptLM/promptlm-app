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

package dev.promptlm.domain.promptspec;


import tools.jackson.core.JacksonException;
import dev.promptlm.domain.ObjectMapperFactory;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Model for <a href="https://platform.openai.com/docs/api-reference/audio/createSpeech">https://api.openai.com/v1/audio/speech</a>
 */
class AudioSpeechRequest extends BaseRequest {

    public static final String TYPE = "audio/speech";
    /**
     * The text to generate audio for.
     */
    private String input;
    /**
     * The voice to use when generating the audio.
     */
    private String voice;
    /**
     * The format to audio in.
     */
    private ResponseFormat responseFormat;
    /**
     * The speed of the generated audio.
     * Select a value from 0.25 to 4.0. 1.0 is the default.
     */
    private float speed = 0.8f;

    public AudioSpeechRequest() {
    }

    public String getInput() {
        return input;
    }

    public String getVoice() {
        return voice;
    }

    public ResponseFormat getResponseFormat() {
        return responseFormat;
    }

    public float getSpeed() {
        return speed;
    }

    public static Builder builder() {
        return new Builder();
    }

    @Schema(allowableValues = TYPE, example = TYPE)
    public String getType() {
        return TYPE;
    }

    @Override
    public String renderBody() {
        try {
            return ObjectMapperFactory.createJsonMapper().writeValueAsString(this);
        } catch (JacksonException e) {
            throw new RuntimeException(e);
        }
    }


    interface BuilderSteps {

        interface InputStep {
            VoiceStep withInput(String input);
        }

        public interface VoiceStep {
            Builder withVoice(String voice);
        }
    }

    public static class Builder extends BaseRequestBuilder<AudioSpeechRequest, Builder>
            implements BuilderSteps.InputStep, BuilderSteps.VoiceStep, CommonBuilderSteps.BuildStep<AudioSpeechRequest> {

        private final AudioSpeechRequest instance;

        public Builder() {
            super();
            this.instance = new AudioSpeechRequest();
        }

        @Override
        public BuilderSteps.VoiceStep withInput(String input) {
            instance.input = input;
            return this;
        }

        public Builder withResponseFormat(ResponseFormat responseFormat) {
            instance.responseFormat = responseFormat;
            return this;
        }

        public Builder withSpeed(float speed) {
            instance.speed = speed;
            return this;
        }

        @Override
        public Builder withVoice(String voice) {
            instance.voice = voice;
            return this;
        }

        @Override
        public AudioSpeechRequest getInstance() {
            return instance;
        }

        @Override
        public AudioSpeechRequest build() {
            return instance;
        }

    }
}
