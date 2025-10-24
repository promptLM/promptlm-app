package dev.promptlm.prompt.control;

public interface PromptLmCommand<I, O> {

    O execute(I input);

}
