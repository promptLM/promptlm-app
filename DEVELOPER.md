# Developer Guide

Technical details for working on the promptLM application.

## Running the webapp locally (IntelliJ)

If you launch `promptlm-webapp` directly from IntelliJ and the browser shows:

```
PromptLM UI bundle placeholder
```

…it means the frontend bundle was never built. The committed
`apps/promptlm-webapp/src/main/resources/static/index.html` is only a
placeholder. The real `@promptlm/web-ui` bundle is produced by the
`frontend-maven-plugin`, whose `npm-build` execution is bound to the Maven
**`prepare-package`** phase and writes to `target/classes/static`. IntelliJ's
run only compiles classes and copies `src/main/resources`, so it never runs
that phase — leaving the placeholder in place.

To serve the real UI, build the bundle once with Maven, then run from
IntelliJ:

```bash
./mvnw -pl apps/promptlm-webapp -am prepare-package -DskipTests
```

This populates `target/classes/static` with the compiled UI. Afterwards, run
the app from IntelliJ as usual — but do **not** let IntelliJ rebuild/recopy
resources, as that overwrites `target/classes/static` with the placeholder
again. (For active frontend work, run the Vite dev server instead:
`npm --workspace @promptlm/web-ui run dev`.)
