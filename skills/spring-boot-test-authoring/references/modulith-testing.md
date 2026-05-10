# Spring Modulith Testing Patterns

## Core Goal
Validate module boundaries and event-driven interactions without defaulting to whole-application integration tests.

## Primary Annotation
- Use `@ApplicationModuleTest` for module-scoped integration testing.
- Choose bootstrap mode intentionally based on dependency reach needed by the scenario.

## Scenario-Based Assertions
- Inject `Scenario` for event orchestration and asynchronous verification.
- Assert domain outcomes and module-observable effects, not only method invocation counts.

## Pattern

```java
@ApplicationModuleTest
class OrderModuleTest {

    @Autowired
    Scenario scenario;

    @Test
    void shouldPublishDomainEventWhenOrderIsPlaced() {
        // Arrange
        // Act
        // Assert with Scenario event expectations
    }
}
```

## Rules
- Keep tests module-focused; do not pull unrelated modules into setup.
- Prefer explicit event names/types in assertions.
- Use full `@SpringBootTest` only when requirements cross module boundaries beyond what module testing can represent.
