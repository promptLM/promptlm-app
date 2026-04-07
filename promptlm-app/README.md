# promptLM

promptLM is an open-source framework designed to help you manage, version, and release prompts.

With the client SDKs, you can fetch released prompt specifications and use them in your application.

## Java SDK

The Java client SDK is maintained in https://github.com/promptLM/promptlm-client-sdk.

Maven:

```xml
<dependency>
  <groupId>dev.promptlm</groupId>
  <artifactId>client-library</artifactId>
  <version>0.1.0-SNAPSHOT</version>
</dependency>
```

Gradle:

```kotlin
dependencies {
  implementation("dev.promptlm:client-library:0.1.0-SNAPSHOT")
}
```

TypeScript client (used by the webapp): [apps/promptlm-webapp/src/api-common](apps/promptlm-webapp/src/api-common)

## Features

- **Prompt specifications:** Define prompts as prompt specifications that can be versioned and released.
- **Versioning & releases:** Track prompt versions and publish releases.
- **Client SDKs:** Use promptLM from your application via the Java and TypeScript client SDKs.
- **Multi-model execution:** Route prompts to OpenAI or Anthropic via Spring AI, or through an optional LiteLLM proxy gateway.
- **Configurable parameters:** Tune model settings (e.g., temperature, max tokens) and reuse prompts with placeholders.

## LiteLLM Gateway

PromptLM can route requests through a LiteLLM OpenAI-compatible proxy.

- Enable it with `promptlm.gateway.litellm.enabled=true`.
- By default PromptLM manages a local Docker container for LiteLLM. Set `promptlm.gateway.litellm.docker.manage=false` if you want to point at an existing LiteLLM deployment instead.
- PromptLM checks Docker availability, pulls the configured image when it is missing, waits for the configured readiness endpoint, and leaves the gateway inactive with warnings if startup fails.

Example configuration:

```yaml
promptlm:
  gateway:
    litellm:
      enabled: true
      base-url: http://localhost:4000
      vendor: litellm
      model-aliases:
        gpt-4o: openai/gpt-4o
      environment:
        OPENAI_API_KEY: ${OPENAI_API_KEY}
        MODEL_LIST: ${LITELLM_MODEL_LIST:}
      docker:
        image: ghcr.io/berriai/litellm:latest
        container-name: promptlm-litellm
        port: 4000
        readiness-path: /health
      discovery:
        enabled: true
        models-path: /v1/models
```

Relevant settings:

- `promptlm.gateway.litellm.model-aliases.<prompt-model>` maps PromptLM model ids to LiteLLM routes.
- `promptlm.gateway.litellm.environment.<KEY>` passes upstream API keys or model-map configuration into the container.
- `promptlm.gateway.litellm.discovery.*` enables optional model discovery from LiteLLM.

## Development Quickstart

1. Clone the repository:
   ```
   git clone https://github.com/fabapp2/promptlm.git
   cd promptlm
   ```

2. Create a `.env` file (optional) based on `.env.example`.

3. Run a local build using:
   ```
   ./build-jdk.sh
   ```

## CLI

This repository produces a command line interface via the `apps/promptlm-cli` module.

Build an executable JAR:

```bash
mvn -pl apps/promptlm-cli -am package
```

Run the CLI (interactive when no command is provided):

```bash
java -jar apps/promptlm-cli/target/promptlm-cli-<version>-exec.jar
```

Run a command (non-interactive):

```bash
java -jar apps/promptlm-cli/target/promptlm-cli-<version>-exec.jar help
```

Build a native binary (GraalVM):

```bash
mvn -Pnative -pl apps/promptlm-cli -am package
```

Run the native binary:

```bash
./apps/promptlm-cli/target/promptlm-cli --help
```

## Full Lifecycle Management

promptLM supports the prompt lifecycle up to release and deployment:

- **Design:** Create and version prompt specifications.
- **Release:** Publish prompt versions for consumers.
- **Deploy:** Use released prompts in your application via the client SDK.
