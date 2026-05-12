# Evals Extension — Agent Handover Dossier

**Audience.** An agent planning a new evaluation extension against promptLM-app.
**Goal of this doc.** Hand you everything you need to design and integrate without re-discovering the codebase. Read top to bottom; every claim names a file:line.

---

## 1. Current state in one paragraph

promptLM has an evaluation core (`components/promptlm-evaluation`) wired into the
prompt lifecycle as a Spring Modulith event listener. It runs `Evaluation`
implementations sequentially after each prompt execution and attaches results to
the `PromptSpec`. The only built-in evaluator is a regex matcher
([`PromptEvaluationDefinition`](../../components/promptlm-domain/src/main/java/dev/promptlm/domain/promptspec/PromptEvaluationDefinition.java)).
The UI/handoff treats evals as "future / Pro feature" — the form has a locked
"Available with promptLM Pro" eval section
([design/handoff/playbook/surfaces/form.html:95](handoff/playbook/surfaces/form.html)).
There is no separate `promptlm-evaluation-<vendor>` module yet — yours will be the
first. Follow the `promptlm-execution-litellm` pattern.

---

## 2. Integration points (the SPI)

### 2.1 The contract — `Evaluation`
[`components/promptlm-domain/src/main/java/dev/promptlm/domain/promptspec/Evaluation.java:22`](../../components/promptlm-domain/src/main/java/dev/promptlm/domain/promptspec/Evaluation.java)

```java
public interface Evaluation {
    EvaluationResult evaluate(Response response);
}
```

That's the entire contract. One method, takes the model's `Response`, returns one
`EvaluationResult`. A custom evaluator implements this interface.

### 2.2 The output — `EvaluationResult`
[`components/promptlm-domain/.../EvaluationResult.java:23`](../../components/promptlm-domain/src/main/java/dev/promptlm/domain/promptspec/EvaluationResult.java)

Fields: `evaluator: String`, `type: String`, `score: Double`, `reasoning: String`,
`comments: String`. Mutable POJO with no-arg + all-args ctors (Jackson-friendly).
Success is `score == null || score > 0` — see `success()` at line 45. **Score
convention is 0.0 for fail, 1.0 for pass; null = "not scored, treat as success".**
The orchestrator aggregates across results: any `success() == false` flips the
overall status to `EVALUATED_FAILED`
([`EvaluationResults.java`](../../components/promptlm-domain/src/main/java/dev/promptlm/domain/promptspec/EvaluationResults.java)
factory `failed(...)` line ~49).

### 2.3 The orchestrator — `PromptEvaluator`
[`components/promptlm-evaluation/.../PromptEvaluator.java:32`](../../components/promptlm-evaluation/src/main/java/dev/promptlm/evaluation/PromptEvaluator.java)

`@Service public PromptSpec evaluateAndAttachResults(PromptSpec)`. Loop body at
line 71 calls `evaluation.evaluate(response)` for each configured evaluator,
**sequentially** (comment at line 68: "implementations may not be thread-safe").
Returns `EVALUATED_FAILED` on null result (line 73), runtime exception (line 87),
or missing response (line 56). Results attach via `EvaluationExtensionSupport.withResults(...)`.

### 2.4 The trigger — `PromptEvaluationListener`
[`components/promptlm-evaluation/.../PromptEvaluationListener.java:28`](../../components/promptlm-evaluation/src/main/java/dev/promptlm/evaluation/PromptEvaluationListener.java)

```java
@ApplicationModuleListener
public void onPromptExecuted(PromptExecutedEvent event) { ... }
```

Listens for `PromptExecutedEvent` (published by
[`components/promptlm-execution/.../PromptExecutionListener.java:37`](../../components/promptlm-execution/src/main/java/dev/promptlm/execution/PromptExecutionListener.java))
and re-publishes `PromptEvaluatedEvent` after eval. Persistence layer
(`promptlm-lifecycle/PromptPersistenceListener`) saves the result. **You do not
publish or subscribe to events yourself** — your extension only contributes
`Evaluation` beans.

### 2.5 The configuration — `EvaluationSpec`
[`components/promptlm-domain/.../EvaluationSpec.java:26`](../../components/promptlm-domain/src/main/java/dev/promptlm/domain/promptspec/EvaluationSpec.java)

A `List<Evaluation>` attached to a `PromptSpec`. The orchestrator reads it via two
paths in priority order
([`EvaluationExtensionSupport.extractSpec`](../../components/promptlm-evaluation/src/main/java/dev/promptlm/evaluation/EvaluationExtensionSupport.java) line 43–46):

1. **Extensions JSON path** — `promptSpec.extensions["x-evaluation"]["spec"]`,
   deserialized into `PromptEvaluationDefinition` objects only (line 131 — see
   gotcha §6.1).
2. **Programmatic path** — `promptSpec.getEvaluationSpec()` (the in-memory field).

---

## 3. Requirements from promptLM-app's perspective

Hard rules your extension must respect:

1. **Implement `Evaluation`, return `EvaluationResult` non-null.** Returning null
   short-circuits the whole batch into `EVALUATED_FAILED`
   ([PromptEvaluator.java:73](../../components/promptlm-evaluation/src/main/java/dev/promptlm/evaluation/PromptEvaluator.java)).
2. **Don't throw across the boundary.** A `RuntimeException` aborts the batch and
   fabricates a single failure result (lines 87–98). If your evaluator hits a
   recoverable error (model timeout, rate limit), catch it and return a 0.0-scored
   `EvaluationResult` with `reasoning`/`comments` describing the failure.
3. **Be idempotent and side-effect free w.r.t. the `Response`.** The same response
   may be evaluated more than once (re-runs); `Response.getContent()` is the only
   thing you should read.
4. **Sequential execution is assumed.** Don't rely on parallel invocation; conversely,
   if your evaluator is fast, don't spawn threads — the orchestrator deliberately
   serialises calls.
5. **Score in [0.0, 1.0] (or null).** The `success()` rule is `score == null || score > 0`,
   so 0.0 = fail, anything > 0 = pass. If you produce a continuous score (e.g.
   semantic similarity), still pick a pass threshold and reflect it in the score —
   the aggregation logic is binary.
6. **Populate `evaluator` and `type` for traceability.** The orchestrator falls
   back to `evaluation.getClass().getSimpleName()` when synthesising error results,
   but in the happy path it just stores what you return verbatim.
7. **Apache 2.0 license header on every `.java` source file.** Enforced by
   `pre-commit run insert-license --all-files`; see `.licenserc.yaml` and
   `.license-header.txt`.
8. **Spring Boot 3 / Java 21 / Spring Modulith.** Inherit from `promptlm-parent`;
   don't pin Spring versions yourself.
9. **No data leaves the host.** From the design handoff README §"Execution capture":
   *"local-only data … never sent anywhere."* If your evaluator calls an external
   judge LLM, that's the user's choice — but make the endpoint configurable, default
   to off, and document the data flow. Don't bake in a hosted endpoint as default.

---

## 4. How to integrate (the recipe)

### 4.1 Module skeleton — copy `promptlm-execution-litellm`

Reference: [`components/promptlm-execution-litellm/`](../../components/promptlm-execution-litellm).

Layout:
```
components/promptlm-evaluation-<name>/
├── pom.xml
└── src/
    ├── main/
    │   ├── java/dev/promptlm/evaluation/<name>/
    │   │   ├── package-info.java
    │   │   ├── <Name>Evaluation.java          # implements Evaluation
    │   │   ├── <Name>EvaluationProperties.java # @ConfigurationProperties
    │   │   └── <Name>AutoConfiguration.java   # @AutoConfiguration
    │   └── resources/
    │       └── META-INF/spring/
    │           └── org.springframework.boot.autoconfigure.AutoConfiguration.imports
    └── test/java/...
```

### 4.2 `pom.xml` template

Copy [`components/promptlm-execution-litellm/pom.xml`](../../components/promptlm-execution-litellm/pom.xml)
verbatim, change the `artifactId`, and swap the `promptlm-execution` dependency
for `promptlm-evaluation` + `promptlm-domain`:

```xml
<dependency>
    <groupId>dev.promptlm</groupId>
    <artifactId>promptlm-evaluation</artifactId>
    <version>${project.version}</version>
</dependency>
<dependency>
    <groupId>dev.promptlm</groupId>
    <artifactId>promptlm-domain</artifactId>
    <version>${project.version}</version>
</dependency>
```

Inherit from `promptlm-parent` (relative path `../../pom.xml`). Don't declare
Spring versions — they come from the parent BOM.

### 4.3 Auto-configuration

Pattern from
[`LiteLlmAutoConfiguration.java:41`](../../components/promptlm-execution-litellm/src/main/java/dev/promptlm/execution/litellm/LiteLlmAutoConfiguration.java):

```java
@AutoConfiguration
@EnableConfigurationProperties(MyEvalProperties.class)
@ConditionalOnProperty(prefix = "promptlm.evaluation.<name>", name = "enabled", havingValue = "true")
public class MyEvalAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public MyEvalEvaluation myEvalEvaluation(MyEvalProperties props) { ... }
}
```

Register it in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`
(one fully-qualified class name per line — see the litellm file for the exact
shape).

**Disabled by default.** Use `@ConditionalOnProperty(... havingValue = "true")`
exactly like litellm does. Users opt in via `application.yml`.

### 4.4 Wire your `Evaluation` bean into a `PromptSpec`

**This is the unsolved-by-default part.** The orchestrator only picks up an
evaluator if it's listed inside an `EvaluationSpec` on the `PromptSpec`. There are
two ways:

- **A) Programmatic** — a service somewhere builds a `PromptSpec` and calls
  `withEvaluationSpec(new EvaluationSpec(List.of(myEvalBean)))` before publishing
  `PromptCreatedEvent`. Today nothing does this generically; it would be your
  extension's responsibility (or a follow-up integration patch).
- **B) Extensions JSON** — set `extensions["x-evaluation"]["spec"]["evaluations"]`
  on the spec. Today only `PromptEvaluationDefinition` shape (`evaluator`/`type`/`description`)
  round-trips through this path — see §6.1.

**Recommendation.** Plan to add a small `EvaluationSpecResolver` that collects all
`Evaluation` beans by name and builds a spec from a config-driven list of names.
Discuss with the user before adding it — it's the missing wiring layer and is the
right scope-question for the planning phase.

### 4.5 Register the new module in the root build

Add one line to [`pom.xml:37`](../../pom.xml):

```xml
<module>components/promptlm-evaluation-<name></module>
```

Place it next to `<module>components/promptlm-evaluation</module>` (line 37) for
locality. The build is `mvn clean verify` from the repo root.

---

## 5. Data model summary

| Type | Fields | Purpose |
|---|---|---|
| `Evaluation` (interface) | `evaluate(Response) → EvaluationResult` | the SPI |
| `EvaluationResult` | `evaluator, type, score, reasoning, comments` | one evaluator's verdict |
| `EvaluationResults` | `evaluations: List<EvaluationResult>, status: EvaluationStatus` | aggregate |
| `EvaluationStatus` | `NOT_CONFIGURED \| EVALUATED_OK \| EVALUATED_FAILED` | overall verdict |
| `EvaluationSpec` | `evaluations: List<Evaluation>` | configuration |
| `PromptEvaluationDefinition` | `evaluator, type, description` (impls `Evaluation`) | the only built-in (regex) |

Storage: serialised under `PromptSpec.extensions["x-evaluation"]` as
`{ spec: {...}, results: {...} }` — see
[`EvaluationExtensionSupport.java:36`](../../components/promptlm-evaluation/src/main/java/dev/promptlm/evaluation/EvaluationExtensionSupport.java)
for the key constant and lines 53–75 for the merge logic.

Generated TypeScript client mirrors these:
[`design/handoff/api-client/.../models/Evaluation.ts`](handoff/api-client/promptlm-api-client/src/generated/client/models/Evaluation.ts) and siblings.

---

## 6. Things they need to know (gotchas)

### 6.1 The extensions-JSON round trip is hard-coded to `PromptEvaluationDefinition`

[`EvaluationExtensionSupport.java:131`](../../components/promptlm-evaluation/src/main/java/dev/promptlm/evaluation/EvaluationExtensionSupport.java)
deserialises every entry under `x-evaluation.spec.evaluations[]` as
`PromptEvaluationDefinition` — there is no polymorphism. And `canSerializeSpec`
(lines 139–153) **refuses to write the spec back into extensions if it contains
any `Evaluation` that isn't a `PromptEvaluationDefinition`**. Consequence: if your
extension defines its own concrete `Evaluation` subclass and the user puts it on
the spec programmatically, the *results* will be persisted under
`x-evaluation.results` but the *spec* won't round-trip through JSON.

**Mitigation options to weigh in your plan:**
- (a) Make your evaluator a config-driven `PromptEvaluationDefinition`-shaped record
  where `type` selects the implementation — i.e. extend the dispatcher in
  `PromptEvaluationDefinition.evaluate` (today: only `"regex"`). Cheapest, but
  centralises type knowledge.
- (b) Generalise `EvaluationExtensionSupport` to support a Jackson `@JsonTypeInfo`
  registry of `Evaluation` impls. Right answer long-term; touches the core module.
- (c) Bypass JSON round-trip entirely; only support programmatic configuration. Fine
  for an internal extension, brittle for anything user-configurable from the UI.

**Flag this to the user before committing to one.**

### 6.2 The orchestrator runs synchronously inside `@ApplicationModuleListener`

This is "async by event delivery, sync within the listener." A slow evaluator
(e.g. judge-LLM call) blocks the listener thread for the duration. There's no
timeout, no circuit breaker. If you call out to a network service, **wrap with
`resilience4j` retry/timeout** — there's already a dependency precedent in
[`promptlm-execution-litellm/pom.xml`](../../components/promptlm-execution-litellm/pom.xml)
(`io.github.resilience4j:resilience4j-retry`).

### 6.3 The built-in regex evaluator quirk

[`PromptEvaluationDefinition.java:94`](../../components/promptlm-domain/src/main/java/dev/promptlm/domain/promptspec/PromptEvaluationDefinition.java) —
regex mode is triggered by `"regex".equalsIgnoreCase(type) || "regex".equalsIgnoreCase(evaluator)`,
i.e. either field. Don't accidentally name your custom type `"regex"`. If you go
with mitigation (a) above, pick a unique `type` string and dispatch on it.

### 6.4 Evals are explicitly "future" in the design handoff

[`design/handoff/README.md:54`](handoff/README.md): *"Evaluations · ❌ not implemented
(Pro / future feature) · strip from this round."* The form locks the eval section
behind a "Available with promptLM Pro" affordance
([handoff/playbook/surfaces/form.html:95](handoff/playbook/surfaces/form.html)).
Plan with the user whether your extension is the moment to unlock UI surfaces, or
whether it lands as a backend-only first slice.

### 6.5 No telemetry, no PII guard

There's no built-in scrubber on `Response.getContent()` before it's passed to
your evaluator. If your extension forwards content to a third-party judge, that
data leaves the host. The design handoff's "never sent anywhere" promise is
about the platform — *your extension* breaks it the moment you call out. Make
this explicit to users (config, README).

### 6.6 The `Response` interface is minimal

The orchestrator passes a `Response` whose only contract used by evaluators is
`getContent(): String`. If you need request context (model name, latency, tokens,
the original prompt), it's not in the `Response` — you'd need to widen the SPI.
Don't widen it as part of your extension; raise it as a separate planning
decision.

---

## 7. Testing pattern

Reference tests:
- [`PromptEvaluatorTest.java:37`](../../components/promptlm-evaluation/src/test/java/dev/promptlm/evaluation/PromptEvaluatorTest.java) —
  fixture `basePromptSpec()`, scenarios for not-configured / empty / OK / missing-response
  / null-result.
- [`PromptEvaluationListenerTest.java:36`](../../components/promptlm-evaluation/src/test/java/dev/promptlm/evaluation/PromptEvaluationListenerTest.java) —
  Mockito mocks of `PromptEvaluator` and `ApplicationEventPublisher`, verifies
  `PromptEvaluatedEvent` is published.

For your extension:
1. **Unit test the `Evaluation` impl** directly — pass synthetic `Response`s, assert
   `EvaluationResult` fields. Cover: happy path, edge response (empty, null content),
   evaluator-internal error → 0.0 result with reasoning (don't throw).
2. **Spring slice test of the auto-configuration** — `ApplicationContextRunner`
   with the `promptlm.evaluation.<name>.enabled=true` property, assert the bean
   exists; with the property absent or `false`, assert it does not.
3. **Integration test through `PromptEvaluator`** — register your `Evaluation` in
   an `EvaluationSpec`, build a `PromptSpec` with a `Response`, call
   `evaluateAndAttachResults`, assert the result aggregation.

Use `spring-boot-starter-test-classic` (the parent BOM exposes it). Don't pull
in JUnit/Mockito directly — let the starter manage versions.

---

## 8. Recommended planning sequence (suggestion, not prescription)

1. **Pick the evaluator.** What does it score (LLM-as-judge / heuristic / external
   API)? The shape of the answer determines how much wiring you need.
2. **Decide configuration story** — programmatic (§4.4 option A) vs. JSON-driven
   via `PromptEvaluationDefinition` extension (§6.1 option a). Talk to the user.
3. **Design the SPI extension if needed.** If §6.6 is blocking (you need
   request/model context), surface that as a decision before coding.
4. **Module skeleton** (§4.1–§4.3). Get a no-op `Evaluation` returning a stub
   `EvaluationResult`, with auto-config disabled by default. Wire into root pom.
5. **Implement evaluator + tests** (§7).
6. **Wire-up patch** — whatever gets your bean into an `EvaluationSpec` for real
   prompts. This is likely the load-bearing follow-up.
7. **Docs** — short README in your module + a paragraph in
   `design/handoff/playbook/schema.html` noting evals are no longer "future".

---

## 9. Quick navigation index

| Concern | File |
|---|---|
| SPI interface | [`Evaluation.java`](../../components/promptlm-domain/src/main/java/dev/promptlm/domain/promptspec/Evaluation.java) |
| Result POJO | [`EvaluationResult.java`](../../components/promptlm-domain/src/main/java/dev/promptlm/domain/promptspec/EvaluationResult.java) |
| Aggregate | [`EvaluationResults.java`](../../components/promptlm-domain/src/main/java/dev/promptlm/domain/promptspec/EvaluationResults.java) |
| Status enum | [`EvaluationStatus.java`](../../components/promptlm-domain/src/main/java/dev/promptlm/domain/promptspec/EvaluationStatus.java) |
| Spec | [`EvaluationSpec.java`](../../components/promptlm-domain/src/main/java/dev/promptlm/domain/promptspec/EvaluationSpec.java) |
| Built-in regex | [`PromptEvaluationDefinition.java`](../../components/promptlm-domain/src/main/java/dev/promptlm/domain/promptspec/PromptEvaluationDefinition.java) |
| Orchestrator | [`PromptEvaluator.java`](../../components/promptlm-evaluation/src/main/java/dev/promptlm/evaluation/PromptEvaluator.java) |
| Event listener | [`PromptEvaluationListener.java`](../../components/promptlm-evaluation/src/main/java/dev/promptlm/evaluation/PromptEvaluationListener.java) |
| Extensions JSON glue | [`EvaluationExtensionSupport.java`](../../components/promptlm-evaluation/src/main/java/dev/promptlm/evaluation/EvaluationExtensionSupport.java) |
| Reference extension layout | [`promptlm-execution-litellm/`](../../components/promptlm-execution-litellm) |
| Auto-config registration file | [`org.springframework.boot.autoconfigure.AutoConfiguration.imports`](../../components/promptlm-execution-litellm/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports) |
| Root pom modules list | [`pom.xml:30-49`](../../pom.xml) |
| License header | [`.license-header.txt`](../../.license-header.txt), [`.licenserc.yaml`](../../.licenserc.yaml) |
| Contributing rules | [`CONTRIBUTING.md`](../../CONTRIBUTING.md) |
| UI handoff (eval status) | [`design/handoff/README.md:54`](README.md) |

---

*Generated 2026-05-08 from worktree `reverent-varahamihira-5f32af` against branch `claude/reverent-varahamihira-5f32af`.*
