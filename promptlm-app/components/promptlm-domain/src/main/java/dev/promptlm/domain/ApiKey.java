package dev.promptlm.domain;

public class ApiKey {
    private String key;

    public ApiKey(String apiKey) {
        this.key = apiKey;
    }

    public static ApiKey of(String apiKey) {
        return new ApiKey(apiKey);
    }

    public String get() {
        return key;
    }
}
