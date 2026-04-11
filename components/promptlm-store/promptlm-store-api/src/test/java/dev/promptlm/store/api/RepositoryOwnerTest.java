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
