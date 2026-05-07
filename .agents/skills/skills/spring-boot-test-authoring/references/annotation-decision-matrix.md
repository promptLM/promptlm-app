# Annotation Decision Matrix

Use this matrix to pick the smallest valid Spring testing scope.

| Intent | Primary Annotation | Typical Focus | Prefer | Avoid |
|---|---|---|---|---|
| `controller` | `@WebMvcTest` | Request mapping, status, serialization edges, validation | `MockMvc`, `@MockitoBean` for controller collaborators | `@SpringBootTest` for pure MVC behavior |
| `json` | `@JsonTest` | Serialization and deserialization contracts | `JacksonTester` assertions for round-trip behavior | Full app context for JSON-only checks |
| `rest-client` | `@RestClientTest` | Outbound HTTP contract from a client component | `MockRestServiceServer` and focused response handling assertions | Real network calls in unit-style tests |
| `data-jpa` | `@DataJpaTest` | Repository queries, mapping, constraints, transactions | Container DB for dialect fidelity when needed | `@SpringBootTest` for repository-only behavior |
| `full-integration` | `@SpringBootTest` | Multi-layer wiring, app startup, end-to-end behavior | Explicit `webEnvironment`, containerized dependencies via `@ServiceConnection` | Mixing with slice annotations in same class |
| `modulith` | `@ApplicationModuleTest` | Module boundaries, events, scenario flows | Explicit module bootstrap intent and `Scenario` verification | Broad app tests that skip module boundaries |

## Selection Rules
- Start from `controller`, `json`, `rest-client`, or `data-jpa`.
- Escalate to `full-integration` only when behavior crosses multiple auto-configuration boundaries.
- Use `modulith` when assertions are about module boundaries or event choreography.

## Compatibility Notes
- Spring Boot 4.0 keeps many classic `org.springframework.boot.test.autoconfigure...` annotations while introducing additional module-scoped packages for some slices.
- Verify imports against your project’s Spring Boot version before committing generated skeletons.
- For bean overrides in tests, prefer `org.springframework.test.context.bean.override.mockito.MockitoBean`.
