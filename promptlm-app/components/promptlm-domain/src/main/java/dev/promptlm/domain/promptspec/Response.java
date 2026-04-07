package dev.promptlm.domain.promptspec;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
        @JsonSubTypes.Type(value = ChatCompletionResponse.class, name = ChatCompletionResponse.TYPE),
})
public interface Response {
    Response withContent(String content);
    String getContent();
}
