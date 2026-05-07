# Testcontainers Patterns for Spring Boot

## Principle
Use container-backed tests when database/broker fidelity affects correctness. Prefer Spring Boot service connections over manual property plumbing.

## Preferred Wiring
- Use `@ServiceConnection` on container bean or field.
- Keep container image tags explicit.
- Keep one container per external dependency type unless behavior requires isolation.

Example pattern:

```java
@TestConfiguration(proxyBeanMethods = false)
class ContainersConfig {
    @Bean
    @ServiceConnection
    PostgreSQLContainer<?> postgres() {
        return new PostgreSQLContainer<>("postgres:16-alpine");
    }
}
```

## Slice + Container Guidance
- `@DataJpaTest` + container DB for dialect-sensitive query behavior.
- `@SpringBootTest` + containers for multi-layer flows requiring real infrastructure behavior.
- Avoid starting containers in pure controller/json/client slice tests.

## Failure Modes to Catch Early
- Missing Docker daemon or socket permissions.
- Missing `spring-boot-testcontainers` dependency.
- Container image pull failures in CI due to registry/network policy.
- Slow startup from per-test container churn; prefer class-scoped lifecycle when isolation is not required.

## Dependency Hints
Maven:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-testcontainers</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>postgresql</artifactId>
  <scope>test</scope>
</dependency>
```

Gradle:

```groovy
testImplementation("org.springframework.boot:spring-boot-testcontainers")
testImplementation("org.testcontainers:postgresql")
```
