package dev.promptlm.domain.promptspec;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Specification of evaluations for a {@link PromptSpec}.
 */
public class EvaluationSpec {

    private final List<Evaluation> evaluations;

    public EvaluationSpec(@JsonProperty("evaluations") List<Evaluation> evaluations) {
        this.evaluations = evaluations;
    }

    public List<Evaluation> getEvaluations() {
        return evaluations;
    }
}
