package dev.promptlm.store.api;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public record RepositoryOwner(
        @JsonProperty("id") String id,
        @JsonProperty("displayName") String displayName,
        @JsonProperty("type") Type type
) {

    @JsonCreator
    public RepositoryOwner {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("id must not be blank");
        }
        if (displayName == null || displayName.isBlank()) {
            displayName = id;
        }
        if (type == null) {
            type = Type.USER;
        }
    }

    public static RepositoryOwner user(String id, String displayName) {
        return new RepositoryOwner(id, displayName, Type.USER);
    }

    public static RepositoryOwner organization(String id, String displayName) {
        return new RepositoryOwner(id, displayName, Type.ORGANIZATION);
    }

    public enum Type {
        USER,
        ORGANIZATION
    }
}

