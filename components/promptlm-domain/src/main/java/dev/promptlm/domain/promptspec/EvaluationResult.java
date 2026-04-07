package dev.promptlm.domain.promptspec;

public class EvaluationResult {
    private String evaluator;
    private String type;
    private Double score;
    private String reasoning;
    private String comments;

    public EvaluationResult(String evaluator, String type, Double score, String reasoning, String comments) {

        this.evaluator = evaluator;
        this.type = type;
        this.score = score;
        this.reasoning = reasoning;
        this.comments = comments;
    }

    public EvaluationResult() {

    }

    public boolean success() {

        return score == null || score > 0;
    }

    public String getEvaluator() {

        return this.evaluator;
    }

    public String getType() {

        return this.type;
    }

    public Double getScore() {

        return this.score;
    }

    public String getReasoning() {

        return this.reasoning;
    }

    public String getComments() {

        return this.comments;
    }

    public void setEvaluator(String evaluator) {

        this.evaluator = evaluator;
    }

    public void setType(String type) {

        this.type = type;
    }

    public void setScore(Double score) {

        this.score = score;
    }

    public void setReasoning(String reasoning) {

        this.reasoning = reasoning;
    }

    public void setComments(String comments) {

        this.comments = comments;
    }

    public boolean equals(final Object o) {

        if (o == this)
            return true;
        if (!(o instanceof EvaluationResult))
            return false;
        final EvaluationResult other = (EvaluationResult) o;
        if (!other.canEqual((Object) this))
            return false;
        final Object this$evaluator = this.getEvaluator();
        final Object other$evaluator = other.getEvaluator();
        if (this$evaluator == null ? other$evaluator != null : !this$evaluator.equals(other$evaluator))
            return false;
        final Object this$type = this.getType();
        final Object other$type = other.getType();
        if (this$type == null ? other$type != null : !this$type.equals(other$type))
            return false;
        final Object this$score = this.getScore();
        final Object other$score = other.getScore();
        if (this$score == null ? other$score != null : !this$score.equals(other$score))
            return false;
        final Object this$reasoning = this.getReasoning();
        final Object other$reasoning = other.getReasoning();
        if (this$reasoning == null ? other$reasoning != null : !this$reasoning.equals(other$reasoning))
            return false;
        final Object this$comments = this.getComments();
        final Object other$comments = other.getComments();
        if (this$comments == null ? other$comments != null : !this$comments.equals(other$comments))
            return false;
        return true;
    }

    protected boolean canEqual(final Object other) {

        return other instanceof EvaluationResult;
    }

    public int hashCode() {

        final int PRIME = 59;
        int result = 1;
        final Object $evaluator = this.getEvaluator();
        result = result * PRIME + ($evaluator == null ? 43 : $evaluator.hashCode());
        final Object $type = this.getType();
        result = result * PRIME + ($type == null ? 43 : $type.hashCode());
        final Object $score = this.getScore();
        result = result * PRIME + ($score == null ? 43 : $score.hashCode());
        final Object $reasoning = this.getReasoning();
        result = result * PRIME + ($reasoning == null ? 43 : $reasoning.hashCode());
        final Object $comments = this.getComments();
        result = result * PRIME + ($comments == null ? 43 : $comments.hashCode());
        return result;
    }

    public String toString() {

        return "EvaluationResult(evaluator=" + this.getEvaluator() + ", type=" + this.getType() + ", score=" + this.getScore() + ", reasoning=" + this.getReasoning() + ", comments=" + this.getComments() + ")";
    }
}
