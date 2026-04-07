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
