---
author: $SKILL_AUTHOR
name: spring-boot-test-authoring
description: Write, review, and refactor high-quality Spring Boot 4 tests with strict conventions. Use when choosing between Spring test slices and full-context tests, creating Testcontainers-backed integration tests with @ServiceConnection, writing Spring Modulith module tests, enforcing JUnit 6 naming/assertion style, or adding deterministic test quality gates.
---

# Spring Boot Test Authoring

## Overview
Use this skill to produce fast, deterministic Spring Boot tests by defaulting to the narrowest valid test scope and enforcing strict test style.

## Workflow
1. Classify the intent: `controller`, `json`, `rest-client`, `data-jpa`, `full-integration`, or `modulith`.
2. Check required tools with `bash scripts/ensure-tools.sh --profile <lint|verify-maven|verify-gradle>`.
3. Use `--install-missing` when automatic installation is allowed; otherwise follow printed install command and rerun.
4. Choose scope with `bash scripts/select-test-module.sh`.
5. Generate skeleton with `bash scripts/scaffold-test.sh`.
6. Fill behavior-specific setup, action, and assertions.
7. Enforce style with `bash scripts/lint-test-style.sh`.
8. Execute focused verification with `bash scripts/verify-test.sh`.

## Hard Rules
- Prefer slice tests over `@SpringBootTest` unless full-context behavior is required.
- Prefer `@MockitoBean` over legacy `@MockBean` for Spring bean overrides.
- Name each `@Test` method in `shouldXWhenY` form.
- Keep one behavior per test method.
- Require strong assertions in each test (`assertThat(...)`, `Assertions...`, or `MockMvc.andExpect(...)`).
- Avoid `@DirtiesContext`; if required, include comment `dirties-context-justification: ...`.
- Prefer `@ServiceConnection` for Testcontainers wiring instead of manual property plumbing.
- For Modulith tests, use `@ApplicationModuleTest` and verify events/scenarios explicitly.

## Script Entry Points
- `bash scripts/ensure-tools.sh`: check tools and optionally install missing tools (`--install-missing`).
- `bash scripts/select-test-module.sh`: choose annotation/module strategy.
- `bash scripts/scaffold-test.sh`: generate strict Java test skeletons.
- `bash scripts/lint-test-style.sh`: fail on style/annotation anti-patterns (`--install-missing` supported).
- `bash scripts/verify-test.sh`: run focused Maven/Gradle verification (`--install-missing` supported).

## References
- `references/annotation-decision-matrix.md`
- `references/test-patterns.md`
- `references/testcontainers-patterns.md`
- `references/modulith-testing.md`
