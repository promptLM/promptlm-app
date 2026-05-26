// Copyright 2025 promptLM
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Request-discriminator round-trip spec for issue #255 (epic #248, phase B3).
 *
 * The design (`.claude/orchestration/design-mock-and-fixture.md` § 1.4 —
 * polymorphism) makes `PromptSpec.request` a `oneOf` union of three
 * subtypes that share a single `type` discriminator:
 *
 *   - `ChatCompletionRequest`        → `type: 'chat/completion'`
 *   - `ImagesGenerationsRequest`     → `type: 'images/generations'`
 *   - `AudioSpeechRequest`           → `type: 'audio/speech'`
 *
 * This spec proves the *wire format* preserves the discriminator across a
 * save → read round-trip in each direction, so once B3 lands the
 * `instanceof ChatCompletionRequest` + message-body assertions in
 * `HappyPathUserJourneyTest@Order(20)` can be trimmed by B4 (#256)
 * without losing coverage.
 *
 * Three `test()` cases:
 *
 *   A. ChatCompletionRequest — the only request kind the editor can
 *      produce today. Drive `/prompts/new` to save through the UI, then
 *      `getPromptById` and assert `type === 'chat/completion'`, the
 *      role of the last message, and the verbatim content (including
 *      placeholder tokens).
 *
 *   B. ImagesGenerationsRequest — no editor path yet, seeded directly
 *      via `BackendFixture.seedPrompt`. The fixture's `Partial<PromptSpec>`
 *      shape already permits the polymorphic `request` field — see
 *      `tests/fixtures/backend.types.ts` (#251). The mock's
 *      `materialisePromptFromCreationRequest` was extended in this PR to
 *      preserve the `request` payload across save/read; `seedPrompt`
 *      goes straight into state, so the round-trip stays observable
 *      even without the editor path.
 *
 *   C. AudioSpeechRequest — same shape as B with `audio/speech`.
 *
 * Notes on values used:
 *   - The actual discriminator literals come from the generated OpenAPI
 *     spec (`apps/promptlm-webapp/target/generated/openapi/...`). The
 *     spec uses `images/generations` (plural) — not `image/generations` —
 *     because that's the literal the springdoc-generated subtype enum
 *     emits. See `ImagesGenerationsRequest` in
 *     `components/promptlm-api-client/src/generated/client/models/`.
 *   - The default placeholder delimiters in the editor are `{{` / `}}`
 *     (see `EMPTY_DRAFT` in `components/ui/src/prompts-v2/form/types.ts`).
 *     B1 (#253) is the spec that exercises non-default delimiters; this
 *     spec uses the defaults so it can land independently of B1.
 *   - All ids are UUIDs because the OpenAPI spec declares `format: uuid`
 *     on `PromptSpec.uuid` and the schema validator inside the mock
 *     rejects non-UUID identifiers (see A3, PR #279 + the smoke spec
 *     comments).
 */

import {
  ChatCompletionRequest,
  ImagesGenerationsRequest,
  AudioSpeechRequest,
} from '@promptlm/api-client';

import { test, expect } from '../../fixtures/backend';

/* ---------------------------------------------------------------------------
 * Fixed-prefix UUIDs (mirrors the style used by the existing schema-contract,
 * navigation, and smoke specs — distinct prefix per spec so a failure
 * message identifies the originating test at a glance).
 * ------------------------------------------------------------------------- */
const PROJECT_ID = '66666666-6666-4666-8666-666666666601';
// Test A creates its prompt via the editor save path; the SPA omits the
// `id` field on the wire so the mock derives `${group}/${name}` —
// `b3/chat-discriminator` (no UUID assignment under our control).
const IMAGE_PROMPT_ID = '66666666-6666-4666-8666-666666666603';
const AUDIO_PROMPT_ID = '66666666-6666-4666-8666-666666666604';

const USER_MESSAGE_BODY =
  'Number one {{number_one}} plus number two {{number_two}} equals?';

/**
 * Compile-time anchors for the discriminator literals. The codegen emits
 * `namespace ChatCompletionRequest { enum type { CHAT_COMPLETION = 'chat/completion' } }`
 * etc. — pulling the literal off the namespace means a future codegen
 * change that renames the enum entry (or moves it to a different value)
 * fails the type-check loudly here, rather than the spec silently
 * disagreeing with the wire format.
 *
 * The explicit type annotations on each binding pin the literal to the
 * exact discriminator string the OpenAPI spec declares — see
 * `apps/promptlm-webapp/target/generated/openapi/promptlm-webapp-openapi.json`
 * (`components.schemas.ChatCompletionRequest.allOf[1].properties.type.enum`).
 * The `images/generations` spelling is plural — that's the spec literal,
 * not a typo.
 */
const CHAT_DISCRIMINATOR: 'chat/completion' = ChatCompletionRequest.type.CHAT_COMPLETION;
const IMAGE_DISCRIMINATOR: 'images/generations' =
  ImagesGenerationsRequest.type.IMAGES_GENERATIONS;
const AUDIO_DISCRIMINATOR: 'audio/speech' = AudioSpeechRequest.type.AUDIO_SPEECH;

/* ---------------------------------------------------------------------------
 * Test A — ChatCompletionRequest via the editor save path
 * ------------------------------------------------------------------------- */

test('chat/completion discriminator survives editor save → getPromptById', async ({
  page,
  backend,
}) => {
  // Seed an active project so the editor's save action passes its
  // `activeProjectId` guard (see `editorActions.ts → savePromptDraftAction`).
  await backend.seedProject({ id: PROJECT_ID, name: 'B3 chat project' });

  // Deep-link to the editor in create mode.
  await page.goto('/prompts/new');
  await expect(page.getByTestId('prompt-editor-heading')).toBeVisible();

  // Fill identity fields (slug pattern requires `^[a-zA-Z0-9\-_]+$`; pick
  // a deterministic group/name we can verify on the way back out).
  await page.getByTestId('prompt-name-input').fill('chat-discriminator');
  await page.getByTestId('prompt-group-input').fill('b3');
  // The description TextArea control carries `testId="description-text"`
  // on the underlying `<textarea>` element.
  await page.getByTestId('description-text').fill('B3 — chat discriminator round-trip');

  // Pick a vendor + model. `createEmptyPromptDraft` in the SPA seeds both
  // with empty strings (see `draftState.ts`), so model-configuration
  // validation fails the save until we set them. The vendor `<select>` is
  // a fixed five-entry static list (`VENDOR_OPTIONS` in
  // `components/ui/src/prompts-v2/form/sections.tsx`); the model is a
  // free-text input. Pick `openai` / `gpt-4o-mini` to align with the
  // seeded `ModelCatalogResponse` (see `buildSeedModelCatalog` in
  // `components/promptlm-api-client/src/mock/defaults.ts`).
  await page
    .getByTestId('request-vendor-select')
    .selectOption('openai');
  await page.getByTestId('request-model-select').fill('gpt-4o-mini');

  // The default request scaffold has `[system, user]` messages with empty
  // content; fill the *last user message* via the `prompt-text` testid
  // (the trailing user-role TextArea in `MessagesEditor` —
  // `components/ui/src/prompts-v2/form/sections.tsx`). The verbatim
  // content includes `{{number_one}}` / `{{number_two}}` tokens with the
  // editor's default placeholder delimiters; if a future change flips
  // the defaults the assertion below catches it.
  await page.getByTestId('prompt-text').fill(USER_MESSAGE_BODY);

  // Click the create-action button. `PromptFormPage` renders the primary
  // action with testid `save-prompt-button` when the release flow is
  // disabled (the e2e-mock profile leaves `VITE_FEATURE_RELEASE_FLOW`
  // unset — see `featureFlags.ts` `releaseFlow`). Button label: "Create".
  await page.getByTestId('save-prompt-button').click();

  // The mock's `handleCreatePromptSpec` invokes
  // `materialisePromptFromCreationRequest` which (post-B3) preserves the
  // `request` payload on the stored spec. The SPA derives the id as
  // `${group}/${name}` when the request omits one — match that here.
  const expectedId = 'b3/chat-discriminator';

  // Wait for the create call to land in the mock's call log. `expectCalled`
  // retries via Playwright's `expect` poller so a slow save doesn't flake.
  await backend.expectCalled('createPromptSpec', { times: 1 });

  // Read the stored spec back through the fixture's inspection surface.
  // The SPA may navigate to `/prompts/:id` after save which races with
  // our follow-up read, but the in-memory mock stores synchronously, so
  // listing-then-matching is robust either way.
  const prompts = await backend.listPrompts();
  const stored =
    (await backend.getPromptById(expectedId)) ??
    prompts.find((p) => p.name === 'chat-discriminator' && p.group === 'b3');
  expect(
    stored,
    `expected a stored spec at id ${expectedId} or matching name/group; ` +
      `observed ids: ${prompts.map((p) => p.id).join(', ')}`,
  ).toBeDefined();
  const request = stored!.request;
  expect(request, 'expected stored spec to carry a request payload').toBeDefined();

  // The discriminator literal must round-trip verbatim. Compare against
  // the namespace-scoped enum literal so a typo on either side fails the
  // type-check (the equality below is then a redundant runtime guard).
  expect(request!.type).toBe(CHAT_DISCRIMINATOR);

  // Narrow the polymorphic union to the chat branch so we can inspect
  // `messages` without an `any` cast.
  expect(
    'messages' in (request as object),
    'chat/completion request should carry messages',
  ).toBe(true);
  const chatRequest = request as ChatCompletionRequest;
  const messages = chatRequest.messages ?? [];

  // Pick the last user-role message — the editor scaffold has
  // `[system, user]`; we filled the trailing user row.
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => (m.role ?? '').toLowerCase() === 'user');
  expect(lastUserMessage, 'expected a user-role message in the stored spec').toBeDefined();
  // The SPA normalises message roles to uppercase on the wire (see
  // `normalizeMessageRole` in `promptPayloads.ts`); accept either casing
  // here so the assertion stays robust to that convention.
  expect(['user', 'USER']).toContain(lastUserMessage!.role);
  // The body content must round-trip verbatim — placeholder tokens
  // `{{number_one}}` and `{{number_two}}` are preserved as plain text
  // (the editor never expands placeholders on save).
  expect(lastUserMessage!.content).toBe(USER_MESSAGE_BODY);
});

/* ---------------------------------------------------------------------------
 * Test B — ImagesGenerationsRequest seeded via fixture
 * ------------------------------------------------------------------------- */

test('images/generations discriminator survives seed → getPromptById', async ({
  backend,
}) => {
  // Seed a project so the mock's inspection surface has a context to
  // resolve the prompt against. The active project isn't strictly
  // required for `getPromptById`, but seeding it keeps parity with the
  // other tests in this file.
  await backend.seedProject({ id: PROJECT_ID, name: 'B3 image project' });

  // The fixture's `seedPrompt` accepts `Partial<PromptSpec>` whose
  // `request` field is already the polymorphic union (see
  // `PromptSpec.request` in `generated/client/models/PromptSpec.ts`).
  // No interface extension required — the union already permits all
  // three subtypes.
  await backend.seedPrompt({
    id: IMAGE_PROMPT_ID,
    name: 'image-gen',
    group: 'b3',
    request: {
      // Discriminator literal sourced from the codegen enum to keep this
      // spec in lockstep with the generated types.
      type: ImagesGenerationsRequest.type.IMAGES_GENERATIONS,
      // The `Request` base requires only `type`; `vendor` and `model`
      // are optional but worth seeding for realism. `imageUrl` is the
      // single subtype-specific field on `ImagesGenerationsRequest`
      // (see `generated/client/models/ImagesGenerationsRequest.ts`).
      // The seed value is a tiny gpt-image-1-style URL — purely
      // illustrative; nothing dereferences it.
      vendor: 'openai',
      model: 'gpt-image-1',
      imageUrl: 'https://example.test/cat.png',
    } as ImagesGenerationsRequest,
  });

  const stored = await backend.getPromptById(IMAGE_PROMPT_ID);
  expect(stored, `expected a stored spec at id ${IMAGE_PROMPT_ID}`).toBeDefined();
  const request = stored!.request;
  expect(request, 'expected stored spec to carry a request payload').toBeDefined();

  expect(request!.type).toBe(IMAGE_DISCRIMINATOR);
  // Narrow to the images branch.
  const imageRequest = request as ImagesGenerationsRequest;
  expect(imageRequest.imageUrl).toBe('https://example.test/cat.png');
  expect(imageRequest.model).toBe('gpt-image-1');
});

/* ---------------------------------------------------------------------------
 * Test C — AudioSpeechRequest seeded via fixture
 * ------------------------------------------------------------------------- */

test('audio/speech discriminator survives seed → getPromptById', async ({
  backend,
}) => {
  await backend.seedProject({ id: PROJECT_ID, name: 'B3 audio project' });

  await backend.seedPrompt({
    id: AUDIO_PROMPT_ID,
    name: 'audio-tts',
    group: 'b3',
    request: {
      type: AudioSpeechRequest.type.AUDIO_SPEECH,
      vendor: 'openai',
      model: 'tts-1',
      // The subtype-specific fields on `AudioSpeechRequest` are `input`,
      // `voice`, `responseFormat`, and `speed`. The `responseFormat`
      // enum is namespace-scoped (`AudioSpeechRequest.responseFormat`)
      // so we source the literal from there for the same drift-resistance
      // reason as the discriminator.
      input: 'Hello from the B3 spec.',
      voice: 'alloy',
      responseFormat: AudioSpeechRequest.responseFormat.MP3,
      speed: 1.0,
    } as AudioSpeechRequest,
  });

  const stored = await backend.getPromptById(AUDIO_PROMPT_ID);
  expect(stored, `expected a stored spec at id ${AUDIO_PROMPT_ID}`).toBeDefined();
  const request = stored!.request;
  expect(request, 'expected stored spec to carry a request payload').toBeDefined();

  expect(request!.type).toBe(AUDIO_DISCRIMINATOR);
  const audioRequest = request as AudioSpeechRequest;
  expect(audioRequest.input).toBe('Hello from the B3 spec.');
  expect(audioRequest.voice).toBe('alloy');
  expect(audioRequest.responseFormat).toBe(AudioSpeechRequest.responseFormat.MP3);
});
