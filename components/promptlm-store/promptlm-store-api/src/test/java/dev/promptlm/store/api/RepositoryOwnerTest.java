package dev.promptlm.store.api;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RepositoryOwnerTest {

    @Test
    void defaultsDisplayNameAndTypeWhenNotProvided() {
        RepositoryOwner owner = new RepositoryOwner("octocat", null, null);

        assertEquals("octocat", owner.id());
        assertEquals("octocat", owner.displayName());
        assertEquals(RepositoryOwner.Type.USER, owner.type());
    }

    @Test
    void validatesIdIsNotBlank() {
        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> new RepositoryOwner(" ", "name", RepositoryOwner.Type.USER));

        assertEquals("id must not be blank", exception.getMessage());
    }

    @Test
    void factoryMethodsSetExpectedType() {
        RepositoryOwner user = RepositoryOwner.user("u1", "User 1");
        RepositoryOwner org = RepositoryOwner.organization("o1", "Org 1");

        assertEquals(RepositoryOwner.Type.USER, user.type());
        assertEquals(RepositoryOwner.Type.ORGANIZATION, org.type());
    }
}
