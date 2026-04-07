package dev.promptlm.domain.promptspec;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

public class Execution {
    private String id;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant timestamp;

    private Response response;

    private List<Placeholder> placeholders;

    private List<EvaluationResult> evaluations;

    public Execution(String id, Instant timestamp, Response response, List<Placeholder> placeholders, List<EvaluationResult> evaluations) {

        this.id = id;
        this.timestamp = timestamp;
        this.response = response;
        this.placeholders = placeholders;
        this.evaluations = evaluations;
    }

    public Execution() {

    }

    public String getId() {

        return this.id;
    }

    public Instant getTimestamp() {

        return this.timestamp;
    }

    public Response getResponse() {

        return this.response;
    }

    public List<Placeholder> getPlaceholders() {

        return this.placeholders;
    }

    public List<EvaluationResult> getEvaluations() {

        return this.evaluations;
    }

    public void setId(String id) {

        this.id = id;
    }

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    public void setTimestamp(Instant timestamp) {

        this.timestamp = timestamp;
    }

    public void setResponse(Response response) {

        this.response = response;
    }

    public void setPlaceholders(List<Placeholder> placeholders) {

        this.placeholders = placeholders;
    }

    public void setEvaluations(List<EvaluationResult> evaluations) {

        this.evaluations = evaluations;
    }

    public boolean equals(final Object o) {

        if (o == this)
            return true;
        if (!(o instanceof Execution))
            return false;
        final Execution other = (Execution) o;
        if (!other.canEqual((Object) this))
            return false;
        final Object this$id = this.getId();
        final Object other$id = other.getId();
        if (this$id == null ? other$id != null : !this$id.equals(other$id))
            return false;
        final Object this$timestamp = this.getTimestamp();
        final Object other$timestamp = other.getTimestamp();
        if (this$timestamp == null ? other$timestamp != null : !this$timestamp.equals(other$timestamp))
            return false;
        final Object this$response = this.getResponse();
        final Object other$response = other.getResponse();
        if (this$response == null ? other$response != null : !this$response.equals(other$response))
            return false;
        final Object this$placeholders = this.getPlaceholders();
        final Object other$placeholders = other.getPlaceholders();
        if (this$placeholders == null ? other$placeholders != null : !this$placeholders.equals(other$placeholders))
            return false;
        final Object this$evaluations = this.getEvaluations();
        final Object other$evaluations = other.getEvaluations();
        if (this$evaluations == null ? other$evaluations != null : !this$evaluations.equals(other$evaluations))
            return false;
        return true;
    }

    protected boolean canEqual(final Object other) {

        return other instanceof Execution;
    }

    public int hashCode() {

        final int PRIME = 59;
        int result = 1;
        final Object $id = this.getId();
        result = result * PRIME + ($id == null ? 43 : $id.hashCode());
        final Object $timestamp = this.getTimestamp();
        result = result * PRIME + ($timestamp == null ? 43 : $timestamp.hashCode());
        final Object $response = this.getResponse();
        result = result * PRIME + ($response == null ? 43 : $response.hashCode());
        final Object $placeholders = this.getPlaceholders();
        result = result * PRIME + ($placeholders == null ? 43 : $placeholders.hashCode());
        final Object $evaluations = this.getEvaluations();
        result = result * PRIME + ($evaluations == null ? 43 : $evaluations.hashCode());
        return result;
    }

    public String toString() {

        return "Execution(id=" + this.getId() + ", timestamp=" + this.getTimestamp() + ", response=" + this.getResponse() + ", placeholders=" + this.getPlaceholders() + ", evaluations=" + this.getEvaluations() + ")";
    }

    public static class Placeholder {
        private String name;
        @JsonProperty("defaultValue")
        private String defaultValue;

        public Placeholder(String name, String defaultValue) {

            this.name = name;
            this.defaultValue = defaultValue;
        }

        public Placeholder() {

        }

        public String getName() {

            return this.name;
        }

        public String getDefaultValue() {

            return this.defaultValue;
        }

        public void setName(String name) {

            this.name = name;
        }

        @JsonProperty("defaultValue")
        public void setDefaultValue(String defaultValue) {

            this.defaultValue = defaultValue;
        }

        public boolean equals(final Object o) {

            if (o == this)
                return true;
            if (!(o instanceof Placeholder))
                return false;
            final Placeholder other = (Placeholder) o;
            if (!other.canEqual((Object) this))
                return false;
            final Object this$name = this.getName();
            final Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name))
                return false;
            final Object this$defaultValue = this.getDefaultValue();
            final Object other$defaultValue = other.getDefaultValue();
            if (this$defaultValue == null ? other$defaultValue != null : !this$defaultValue.equals(other$defaultValue))
                return false;
            return true;
        }

        protected boolean canEqual(final Object other) {

            return other instanceof Placeholder;
        }

        public int hashCode() {

            final int PRIME = 59;
            int result = 1;
            final Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            final Object $defaultValue = this.getDefaultValue();
            result = result * PRIME + ($defaultValue == null ? 43 : $defaultValue.hashCode());
            return result;
        }

        public String toString() {

            return "Execution.Placeholder(name=" + this.getName() + ", defaultValue=" + this.getDefaultValue() + ")";
        }
    }
}
