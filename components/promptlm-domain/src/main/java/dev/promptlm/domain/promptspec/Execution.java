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

import java.time.Instant;
import java.util.List;
import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Records a single execution of a {@link PromptSpec} against an LLM, capturing the timestamp,
 * the concrete response, the placeholder values used, and any evaluation outcomes.
 *
 * <p>Telemetry fields ({@code latencyMs}, {@code tokensIn}, {@code tokensOut}, {@code ok},
 * and the optional {@code fixturePath} / {@code context} / {@code revision} / {@code author} /
 * {@code error}) capture local dev-run metadata produced by the CLI / CI. They are never
 * transmitted off-box; they exist so the UI can render meaningful per-run rows. Older serialized
 * executions that pre-date these fields read back as {@code latencyMs == 0}, {@code tokensIn == 0},
 * {@code tokensOut == 0}, {@code ok == true}, and {@code null} for the optional fields.
 */
@Schema(description = "Single recorded execution of a PromptSpec")
public class Execution {
    private String id;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant timestamp;

    private Response response;

    private List<Placeholder> placeholders;

    private List<EvaluationResult> evaluations;

    @Schema(description = "Wall time of the run in milliseconds", example = "842")
    private Long latencyMs;

    @Schema(description = "Rendered prompt token count", example = "512")
    private Integer tokensIn;

    @Schema(description = "Response token count", example = "256")
    private Integer tokensOut;

    @Schema(description = "Path to the input fixture file used for the run", example = "fixtures/welcome.json")
    private String fixturePath;

    @Schema(description = "Free-form context label for the run", example = "CI · pre-merge")
    private String context;

    @Schema(description = "Revision of the spec that produced this run", example = "r3")
    private String revision;

    @Schema(description = "Git committer or CLI invoker", example = "ada")
    private String author;

    @Schema(description = "Outcome of the run; true when the run succeeded", example = "true")
    private Boolean ok;

    @Schema(description = "Failure message captured when ok is false")
    private String error;

    @Schema(description = "Origin of this execution; null reads as MANUAL for back-compat")
    private ExecutionKind kind;

    @Schema(description = "Failure classification; null when ok is true")
    private FailureClass failureClass;

    public Execution(String id, Instant timestamp, Response response, List<Placeholder> placeholders, List<EvaluationResult> evaluations) {

        this(id, timestamp, response, placeholders, evaluations, null, null, null, null, null, null, null, null, null, null, null);
    }

    public Execution(
            String id,
            Instant timestamp,
            Response response,
            List<Placeholder> placeholders,
            List<EvaluationResult> evaluations,
            Long latencyMs,
            Integer tokensIn,
            Integer tokensOut,
            String fixturePath,
            String context,
            String revision,
            String author,
            Boolean ok,
            String error) {

        this(id, timestamp, response, placeholders, evaluations, latencyMs, tokensIn, tokensOut, fixturePath, context, revision, author, ok, error, null, null);
    }

    public Execution(
            String id,
            Instant timestamp,
            Response response,
            List<Placeholder> placeholders,
            List<EvaluationResult> evaluations,
            Long latencyMs,
            Integer tokensIn,
            Integer tokensOut,
            String fixturePath,
            String context,
            String revision,
            String author,
            Boolean ok,
            String error,
            ExecutionKind kind,
            FailureClass failureClass) {

        this.id = id;
        this.timestamp = timestamp;
        this.response = response;
        this.placeholders = placeholders;
        this.evaluations = evaluations;
        this.latencyMs = latencyMs;
        this.tokensIn = tokensIn;
        this.tokensOut = tokensOut;
        this.fixturePath = fixturePath;
        this.context = context;
        this.revision = revision;
        this.author = author;
        this.ok = ok;
        this.error = error;
        this.kind = kind;
        this.failureClass = failureClass;
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

    /**
     * Wall time of the run in milliseconds. Nullable for backwards compatibility with older
     * serialized executions; callers wanting a default should use {@link #latencyMsOrZero()}.
     */
    public Long getLatencyMs() {

        return this.latencyMs;
    }

    /** Returns {@link #getLatencyMs()} or {@code 0} when null. */
    public long latencyMsOrZero() {

        return this.latencyMs != null ? this.latencyMs : 0L;
    }

    public Integer getTokensIn() {

        return this.tokensIn;
    }

    /** Returns {@link #getTokensIn()} or {@code 0} when null. */
    public int tokensInOrZero() {

        return this.tokensIn != null ? this.tokensIn : 0;
    }

    public Integer getTokensOut() {

        return this.tokensOut;
    }

    /** Returns {@link #getTokensOut()} or {@code 0} when null. */
    public int tokensOutOrZero() {

        return this.tokensOut != null ? this.tokensOut : 0;
    }

    public String getFixturePath() {

        return this.fixturePath;
    }

    public String getContext() {

        return this.context;
    }

    public String getRevision() {

        return this.revision;
    }

    public String getAuthor() {

        return this.author;
    }

    public Boolean getOk() {

        return this.ok;
    }

    /**
     * Outcome of the run. Defaults to {@code true} when the underlying field is {@code null}
     * (older captured executions implied a successful response). Renamed away from
     * {@code isOk()} so Jackson / springdoc do not see two competing getters for the
     * {@code ok} JSON property.
     */
    @JsonIgnore
    public boolean okOrDefault() {

        return this.ok == null || this.ok;
    }

    public String getError() {

        return this.error;
    }

    /**
     * Origin of this execution. Returns null for older serialized runs that pre-date the
     * field; consumers wanting a default should use {@link #kindOrManual()}.
     */
    public ExecutionKind getKind() {

        return this.kind;
    }

    /** Returns {@link #getKind()} or {@link ExecutionKind#MANUAL} when null. */
    @JsonIgnore
    public ExecutionKind kindOrManual() {

        return this.kind != null ? this.kind : ExecutionKind.MANUAL;
    }

    public FailureClass getFailureClass() {

        return this.failureClass;
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

    public void setLatencyMs(Long latencyMs) {

        this.latencyMs = latencyMs;
    }

    public void setTokensIn(Integer tokensIn) {

        this.tokensIn = tokensIn;
    }

    public void setTokensOut(Integer tokensOut) {

        this.tokensOut = tokensOut;
    }

    public void setFixturePath(String fixturePath) {

        this.fixturePath = fixturePath;
    }

    public void setContext(String context) {

        this.context = context;
    }

    public void setRevision(String revision) {

        this.revision = revision;
    }

    public void setAuthor(String author) {

        this.author = author;
    }

    public void setOk(Boolean ok) {

        this.ok = ok;
    }

    public void setError(String error) {

        this.error = error;
    }

    public void setKind(ExecutionKind kind) {

        this.kind = kind;
    }

    public void setFailureClass(FailureClass failureClass) {

        this.failureClass = failureClass;
    }

    public boolean equals(final Object o) {

        if (o == this)
            return true;
        if (!(o instanceof Execution))
            return false;
        final Execution other = (Execution) o;
        if (!other.canEqual((Object) this))
            return false;
        if (!Objects.equals(this.getId(), other.getId()))
            return false;
        if (!Objects.equals(this.getTimestamp(), other.getTimestamp()))
            return false;
        if (!Objects.equals(this.getResponse(), other.getResponse()))
            return false;
        if (!Objects.equals(this.getPlaceholders(), other.getPlaceholders()))
            return false;
        if (!Objects.equals(this.getEvaluations(), other.getEvaluations()))
            return false;
        if (!Objects.equals(this.latencyMs, other.latencyMs))
            return false;
        if (!Objects.equals(this.tokensIn, other.tokensIn))
            return false;
        if (!Objects.equals(this.tokensOut, other.tokensOut))
            return false;
        if (!Objects.equals(this.fixturePath, other.fixturePath))
            return false;
        if (!Objects.equals(this.context, other.context))
            return false;
        if (!Objects.equals(this.revision, other.revision))
            return false;
        if (!Objects.equals(this.author, other.author))
            return false;
        if (!Objects.equals(this.ok, other.ok))
            return false;
        if (!Objects.equals(this.error, other.error))
            return false;
        if (!Objects.equals(this.kind, other.kind))
            return false;
        if (!Objects.equals(this.failureClass, other.failureClass))
            return false;
        return true;
    }

    protected boolean canEqual(final Object other) {

        return other instanceof Execution;
    }

    public int hashCode() {

        return Objects.hash(
                id,
                timestamp,
                response,
                placeholders,
                evaluations,
                latencyMs,
                tokensIn,
                tokensOut,
                fixturePath,
                context,
                revision,
                author,
                ok,
                error,
                kind,
                failureClass);
    }

    public String toString() {

        return "Execution(id=" + this.getId()
                + ", timestamp=" + this.getTimestamp()
                + ", response=" + this.getResponse()
                + ", placeholders=" + this.getPlaceholders()
                + ", evaluations=" + this.getEvaluations()
                + ", latencyMs=" + this.latencyMs
                + ", tokensIn=" + this.tokensIn
                + ", tokensOut=" + this.tokensOut
                + ", fixturePath=" + this.fixturePath
                + ", context=" + this.context
                + ", revision=" + this.revision
                + ", author=" + this.author
                + ", ok=" + this.ok
                + ", error=" + this.error
                + ", kind=" + this.kind
                + ", failureClass=" + this.failureClass
                + ")";
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
