# Agent Instructions

## OpenAPI-generated stubs usage rules (UI)

- Treat the OpenAPI specification as the single source of truth for HTTP endpoints and DTOs.
- Route HTTP calls for spec-covered endpoints through `@promptlm/api-client` generated services.
- Do not introduce handwritten HTTP clients for endpoints already in the OpenAPI spec.
- Treat OpenAPI-generated request/response models as canonical wire types; do not create shadow DTOs.
- Use OpenAPI service calls in the integration layer (for example `src/api-common/*`, `src/api/hooks.ts`), not directly in presentation components/pages.
- If API DTOs are not UI-friendly, create explicit view models and centralized mappers rather than ad-hoc per-component mapping.
- Do not maintain dual clients for the same API surface.
- When the spec changes: regenerate `@promptlm/api-client`, then update integration code and centralized mappers; do not patch mismatches with shadow fields/types.
