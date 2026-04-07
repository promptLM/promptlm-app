package dev.promptlm.domain.promptspec;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

/**
 * Serializable evaluation definition used for prompt metadata/configuration.
 */
public class PromptEvaluationDefinition implements Evaluation {

    private final String evaluator;
    private final String type;
    private final String description;

    @JsonCreator
    public PromptEvaluationDefinition(
            @JsonProperty("evaluator") String evaluator,
            @JsonProperty("type") String type,
            @JsonProperty("description") String description
    ) {
        this.evaluator = evaluator;
        this.type = type;
        this.description = description;
    }

    public String getEvaluator() {
        return evaluator;
    }

    public String getType() {
        return type;
    }

    public String getDescription() {
        return description;
    }

    @Override
    public EvaluationResult evaluate(Response response) {
        if (isRegexEvaluation()) {
            String pattern = description == null ? null : description.trim();
            if (pattern == null || pattern.isEmpty()) {
                return new EvaluationResult(
                        evaluator,
                        type,
                        0.0,
                        "Missing regex pattern",
                        "Provide a regex in the description field"
                );
            }
            String content = response == null || response.getContent() == null ? "" : response.getContent();
            try {
                boolean matched = Pattern.compile(pattern).matcher(content).find();
                return new EvaluationResult(
                        evaluator,
                        type,
                        matched ? 1.0 : 0.0,
                        matched ? "Regex matched response content" : "Regex did not match response content",
                        pattern
                );
            } catch (PatternSyntaxException exception) {
                return new EvaluationResult(
                        evaluator,
                        type,
                        0.0,
                        "Invalid regex pattern: " + exception.getDescription(),
                        pattern
                );
            }
        }
        return new EvaluationResult(evaluator, type, null, null, description);
    }

    private boolean isRegexEvaluation() {
        return "regex".equalsIgnoreCase(type) || "regex".equalsIgnoreCase(evaluator);
    }
}
