package dev.promptlm.domain.promptspec;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class EvaluationResults {

    private final List<EvaluationResult> evaluations;
    private final EvaluationStatus status;

    public EvaluationResults(List<EvaluationResult> evaluations) {
        this(evaluations, null);
    }

    @JsonCreator
    public EvaluationResults(
            @JsonProperty("evaluations") List<EvaluationResult> evaluations,
            @JsonProperty("status") EvaluationStatus status) {
        this.evaluations = evaluations == null ? List.of() : List.copyOf(evaluations);
        this.status = status == null ? deriveStatus(this.evaluations) : status;
    }

    public static EvaluationResults notConfigured() {
        return new EvaluationResults(List.of(), EvaluationStatus.NOT_CONFIGURED);
    }

    public static EvaluationResults failed(List<EvaluationResult> evaluations) {
        return new EvaluationResults(evaluations, EvaluationStatus.EVALUATED_FAILED);
    }

    public List<EvaluationResult> getEvaluations() {
        return evaluations;
    }

    public EvaluationStatus getStatus() {
        return status;
    }

    public boolean success() {
        return status == EvaluationStatus.EVALUATED_OK;
    }

    private static EvaluationStatus deriveStatus(List<EvaluationResult> evaluations) {
        if (evaluations == null || evaluations.isEmpty()) {
            return EvaluationStatus.NOT_CONFIGURED;
        }
        return evaluations.stream().allMatch(evaluation -> evaluation != null && evaluation.success())
                ? EvaluationStatus.EVALUATED_OK
                : EvaluationStatus.EVALUATED_FAILED;
    }
}
