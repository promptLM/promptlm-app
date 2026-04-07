package dev.promptlm.domain.promptspec;

/**
 * Evaluation of {@link PromptSpec} response.
 */
public interface Evaluation {
    EvaluationResult evaluate(Response response);
}
