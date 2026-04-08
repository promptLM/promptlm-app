# Prompt Editor Architecture

This feature owns the end-user prompt authoring experience in `@promptlm/web-ui`.

## Composition

- `PromptEditorPage.tsx`
  - orchestrates page-level state and async flows (save, release, run).
  - wires generated API client mutations via `usePromptEditorData`.
  - delegates UI sections to shared `@promptlm/ui` prompt-editor components.
- `draftState.ts`
  - reducer-driven editor state for metadata, request, placeholders, messages, and evaluations.
  - central place for deterministic draft mutation behavior.
- `validation.ts`
  - section-scoped validation model (`metadata`, `modelConfiguration`, `placeholders`, `messages`, `toolConfigs`, `evaluationPlan`).
  - returns inline-friendly error structures used by section cards.
- `editorActions.ts`
  - pure async action helpers for save and release result handling.
  - isolates success/error outcomes from React component concerns.
- `usePromptEditorData.ts`
  - bridge from feature to API hooks/client (`usePromptDetails`, `usePromptMutations`, `useActiveProject`, generated prompt specs API).

## Data Boundaries

- API contract source of truth remains generated OpenAPI/AsyncAPI models in `@promptlm/api-client`.
- `PromptEditorPage` works on `PromptDraftInput` and converts through `buildPromptSpecCreationRequest` / `buildExecutePromptRequest`.
- Placeholder value substitution is applied only to runtime/request payload content before save/run.

## Testing Strategy

- Unit tests:
  - `draftState.test.ts` for reducer mutation behavior.
  - `validation.test.ts` for section error shape coverage.
  - `editorActions.test.ts` for save/release success + failure paths and execution selection behavior.
- Component-level tests:
  - `promptEditorSections.test.tsx` validates inline error rendering and disclosure/accessibility wiring in shared section cards.

## Extending the Editor

1. Add/extend draft fields in `PromptDraftInput` and `draftState.ts`.
2. Extend `validation.ts` with section-local errors that can be rendered inline.
3. Wire new fields through `PromptEditorPage` section props.
4. Keep contract mapping in `promptPayloads.ts` generated-model aligned; avoid handwritten parallel API contracts.
5. Add/extend tests in `__tests__` to cover both success and error paths.
