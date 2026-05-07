# Test Patterns

## Method Naming
- Use `shouldXWhenY` for each `@Test`.
- Keep one observable behavior per test method.
- Make `X` and `Y` behavior-specific, not transport-only.

Good:
- `shouldReturnConflictWhenRemoteRepositoryAlreadyExists`
- `shouldEmitProgressEventWhenCloneStarts`

Weak:
- `testController`
- `shouldReturn200`

## Structure Pattern (AAA)
Use Arrange / Act / Assert in strict order.

```java
@Test
void shouldCreateStoreWhenRequestIsValid() throws Exception {
    // Arrange
    CreateStoreRequest request = new CreateStoreRequest();
    request.setRepoName("demo");

    // Act
    mockMvc.perform(post("/api/store")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        // Assert
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("demo"));
}
```

## Assertion Quality
- Include at least one business assertion, not only transport assertions.
- For web tests, status-only assertions are insufficient; assert payload/body semantics.
- For integration tests, assert outcomes visible at system boundary or persistent state.

## Bean Override Style
- Prefer `@MockitoBean` for test-only bean replacement.
- Do not introduce legacy `@MockBean` in new tests.

## Context Reuse Discipline
- Keep context configuration stable to maximize TestContext cache reuse.
- Use `@DirtiesContext` only for tests that truly mutate singleton/application state.
- If `@DirtiesContext` is used, document reason inline:

```java
// dirties-context-justification: Test mutates global static registry state.
@DirtiesContext
class StatefulIntegrationTest {
}
```

## Spring Boot Integration Pattern
- Use `@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)` for real HTTP boundary checks.
- Use `TestRestTemplate` or other HTTP client style consistently within the class.
