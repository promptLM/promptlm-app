package dev.promptlm.domain.promptspec;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
        @JsonSubTypes.Type(value = ChatCompletionRequest.class, name = ChatCompletionRequest.TYPE),
        @JsonSubTypes.Type(value = ImagesGenerationsRequest.class, name = ImagesGenerationsRequest.TYPE),
        @JsonSubTypes.Type(value = AudioSpeechRequest.class, name = AudioSpeechRequest.TYPE)
})
public interface Request {

    String getVendor();

    String getModel();

    String getUrl();

    String renderBody();

    void setVendor(String vendor);

    void setModel(String model);

    void setUrl(String url);
}