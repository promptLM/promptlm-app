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

public class ImagesGenerationsRequest extends BaseRequest {

    public static final String TYPE = "images/generations";
    private String imageUrl;

    public String getImageUrl() {
        return imageUrl;
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

    public interface ImageUrlStep {
        BuildStep withImageUrl(String imageUrl);
    }

    public interface BuildStep {
        ImagesGenerationsRequest build();
    }

    public static class Builder extends BaseRequestBuilder<ImagesGenerationsRequest, Builder>
            implements ImageUrlStep, BuildStep {

        private final ImagesGenerationsRequest instance;

        public Builder() {
            this.instance = new ImagesGenerationsRequest();
        }

        @Override
        public BuildStep withImageUrl(String imageUrl) {
            instance.imageUrl = imageUrl;
            return this;
        }

        @Override
        protected ImagesGenerationsRequest getInstance() {
            return instance;
        }

        @Override
        public ImagesGenerationsRequest build() {
            return instance;
        }

    }
}
