package dev.promptlm.domain.promptspec;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeName;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonTypeName("chat/completion")
public class ChatCompletionResponse implements Response {
    public static final String TYPE = "chat/completion";

    @JsonProperty("duration_ms")
    private Long durationMs;

    private Usage usage;

    private String content;

    public ChatCompletionResponse(Long durationMs, Usage usage, String content) {

        this.durationMs = durationMs;
        this.usage = usage;
        this.content = content;
    }

    public ChatCompletionResponse() {

    }

    @Override
    public Response withContent(String content) {

        return new ChatCompletionResponse(durationMs, usage, content);
    }

    public Long getDurationMs() {

        return this.durationMs;
    }

    public Usage getUsage() {

        return this.usage;
    }

    public String getContent() {

        return this.content;
    }

    @JsonProperty("duration_ms")
    public void setDurationMs(Long durationMs) {

        this.durationMs = durationMs;
    }

    public void setUsage(Usage usage) {

        this.usage = usage;
    }

    public void setContent(String content) {

        this.content = content;
    }

    public boolean equals(final Object o) {

        if (o == this)
            return true;
        if (!(o instanceof ChatCompletionResponse))
            return false;
        final ChatCompletionResponse other = (ChatCompletionResponse) o;
        if (!other.canEqual((Object) this))
            return false;
        final Object this$durationMs = this.getDurationMs();
        final Object other$durationMs = other.getDurationMs();
        if (this$durationMs == null ? other$durationMs != null : !this$durationMs.equals(other$durationMs))
            return false;
        final Object this$usage = this.getUsage();
        final Object other$usage = other.getUsage();
        if (this$usage == null ? other$usage != null : !this$usage.equals(other$usage))
            return false;
        final Object this$content = this.getContent();
        final Object other$content = other.getContent();
        if (this$content == null ? other$content != null : !this$content.equals(other$content))
            return false;
        return true;
    }

    protected boolean canEqual(final Object other) {

        return other instanceof ChatCompletionResponse;
    }

    public int hashCode() {

        final int PRIME = 59;
        int result = 1;
        final Object $durationMs = this.getDurationMs();
        result = result * PRIME + ($durationMs == null ? 43 : $durationMs.hashCode());
        final Object $usage = this.getUsage();
        result = result * PRIME + ($usage == null ? 43 : $usage.hashCode());
        final Object $content = this.getContent();
        result = result * PRIME + ($content == null ? 43 : $content.hashCode());
        return result;
    }

    public String toString() {

        return "ChatCompletionResponse(durationMs=" + this.getDurationMs() + ", usage=" + this.getUsage() + ", content=" + this.getContent() + ")";
    }

    public static class Usage {
        @JsonProperty("input_tokens")
        private Integer inputTokens;
        @JsonProperty("output_tokens")
        private Integer outputTokens;
        private Double cost;

        public Usage(Integer inputTokens, Integer outputTokens, Double cost) {

            this.inputTokens = inputTokens;
            this.outputTokens = outputTokens;
            this.cost = cost;
        }

        public Usage() {

        }

        public Integer getInputTokens() {

            return this.inputTokens;
        }

        public Integer getOutputTokens() {

            return this.outputTokens;
        }

        public Double getCost() {

            return this.cost;
        }

        @JsonProperty("input_tokens")
        public void setInputTokens(Integer inputTokens) {

            this.inputTokens = inputTokens;
        }

        @JsonProperty("output_tokens")
        public void setOutputTokens(Integer outputTokens) {

            this.outputTokens = outputTokens;
        }

        public void setCost(Double cost) {

            this.cost = cost;
        }

        public boolean equals(final Object o) {

            if (o == this)
                return true;
            if (!(o instanceof Usage))
                return false;
            final Usage other = (Usage) o;
            if (!other.canEqual((Object) this))
                return false;
            final Object this$inputTokens = this.getInputTokens();
            final Object other$inputTokens = other.getInputTokens();
            if (this$inputTokens == null ? other$inputTokens != null : !this$inputTokens.equals(other$inputTokens))
                return false;
            final Object this$outputTokens = this.getOutputTokens();
            final Object other$outputTokens = other.getOutputTokens();
            if (this$outputTokens == null ? other$outputTokens != null : !this$outputTokens.equals(other$outputTokens))
                return false;
            final Object this$cost = this.getCost();
            final Object other$cost = other.getCost();
            if (this$cost == null ? other$cost != null : !this$cost.equals(other$cost))
                return false;
            return true;
        }

        protected boolean canEqual(final Object other) {

            return other instanceof Usage;
        }

        public int hashCode() {

            final int PRIME = 59;
            int result = 1;
            final Object $inputTokens = this.getInputTokens();
            result = result * PRIME + ($inputTokens == null ? 43 : $inputTokens.hashCode());
            final Object $outputTokens = this.getOutputTokens();
            result = result * PRIME + ($outputTokens == null ? 43 : $outputTokens.hashCode());
            final Object $cost = this.getCost();
            result = result * PRIME + ($cost == null ? 43 : $cost.hashCode());
            return result;
        }

        public String toString() {

            return "ChatCompletionResponse.Usage(inputTokens=" + this.getInputTokens() + ", outputTokens=" + this.getOutputTokens() + ", cost=" + this.getCost() + ")";
        }
    }
}
