// prompt-form.jsx — Prompt create/edit form
//
// Matches the existing editor architecture in promptlm-web-ui:
// 6 sections, each as a card with inline validation.
//
//   1. Metadata          — name, group, description, repositoryUrl, version, revision
//   2. Model             — vendor, model, url, modelSnapshot + parameters
//   3. Placeholders      — list with name/type/required + start/end patterns
//   4. Messages          — system / user / assistant / tool with role-aware content
//   5. Tool configs      — for MCP mocking: name, scenario, notes, mockResponse
//   6. Evaluation plan   — gated behind a toggle (Pro · disable until evals ship)
//
// Validation rules taken verbatim from validation.ts in the repo.
// Sample data uses the same SAMPLE_PROMPT shape as prompt-detail.jsx.

const SLUG_RE = /^[A-Za-z0-9_-]+$/;
const URL_RE = /^https?:\/\//i;

// ── Initial draft state (matches PromptDraftInput shape) ────────
const EMPTY_DRAFT = {
  name: '',
  group: '',
  description: '',
  repositoryUrl: '',
  version: '0.1.0',
  revision: 'r1',
  request: {
    type: 'chat',
    vendor: 'anthropic',
    model: 'claude-sonnet-4-5',
    modelSnapshot: '',
    url: '',
    parameters: {
      temperature: 0.2,
      topP: 1.0,
      maxTokens: 1024,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    messages: [
      { role: 'system', content: '' },
      { role: 'user', content: '' },
    ],
  },
  placeholders: {
    startPattern: '{{',
    endPattern: '}}',
    list: [],
  },
  toolConfigs: [],
  evaluations: [],
};

// Pre-filled sample so the form renders something realistic on first load
const SAMPLE_DRAFT = {
  name: 'doc-rag-answer',
  group: 'rag',
  description: 'Answer a user question grounded in retrieved doc chunks. Used by the help-center bot and the internal Q&A surface.',
  repositoryUrl: 'https://github.com/acme/agents',
  version: '1.8.0',
  revision: 'r34',
  request: {
    type: 'chat',
    vendor: 'openai',
    model: 'gpt-4.1',
    modelSnapshot: '2025-04-14',
    url: '',
    parameters: { temperature: 0.1, topP: 1.0, maxTokens: 1200, frequencyPenalty: 0, presencePenalty: 0 },
    messages: [
      { role: 'system', content: 'You are a careful technical-writing assistant. Answer ONLY from the provided chunks. If the answer is not present, say so plainly.' },
      { role: 'user', content: 'Question: {{question}}\n\nChunks:\n{{chunks}}' },
    ],
  },
  placeholders: {
    startPattern: '{{',
    endPattern: '}}',
    list: [
      { name: 'question', type: 'string', required: true,  description: 'The end-user question, verbatim.' },
      { name: 'chunks',   type: 'string', required: true,  description: 'Retrieved doc chunks, separated by ---.' },
      { name: 'tone',     type: 'string', required: false, description: 'Optional tone override (default: neutral).' },
    ],
  },
  toolConfigs: [
    { name: 'search_docs', scenario: 'happy-path', notes: 'Returns ranked chunks for the question.',     mockResponse: '[{"id":"c-913","score":0.91,"text":"…"}]' },
    { name: 'search_docs', scenario: 'empty',      notes: 'No chunks found — verify graceful fallback.', mockResponse: '[]' },
  ],
  evaluations: [
    { evaluator: 'groundedness',   type: 'llm-judge', description: 'Every claim must be supported by a chunk.' },
    { evaluator: 'concise-answer', type: 'rubric',    description: 'Answer < 120 words, no fluff.' },
  ],
};

// ── Validation (mirrors repo validation.ts) ─────────────────────
function validateDraft(draft, evalEnabled) {
  const e = { metadata: {}, model: {}, params: {}, placeholders: {}, placeholderItems: [], messages: {}, messageItems: [], tools: {}, toolItems: [], evals: {}, evalItems: [] };

  // metadata
  if (!draft.name.trim())            e.metadata.name = 'Enter a prompt name.';
  else if (!SLUG_RE.test(draft.name)) e.metadata.name = "Name may only contain letters, numbers, '-' or '_'.";
  if (!draft.group.trim())            e.metadata.group = 'Select a prompt group.';
  else if (!SLUG_RE.test(draft.group)) e.metadata.group = "Group may only contain letters, numbers, '-' or '_'.";
  if (!draft.description.trim())      e.metadata.description = 'Add a short description so collaborators understand the prompt.';

  // model
  if (!draft.request.vendor.trim())   e.model.vendor = 'Select an LLM provider.';
  if (!draft.request.model.trim())    e.model.model = 'Select a deployed model.';
  if (draft.request.url && !URL_RE.test(draft.request.url)) e.model.url = 'Provide a valid HTTP(S) endpoint.';

  const p = draft.request.parameters;
  if (p.temperature < 0 || p.temperature > 2)    e.params.temperature = 'Must be between 0 and 2.';
  if (p.topP < 0 || p.topP > 1)                  e.params.topP = 'Must be between 0 and 1.';
  if (p.maxTokens <= 0)                          e.params.maxTokens = 'Must be greater than 0.';
  if (p.frequencyPenalty < -2 || p.frequencyPenalty > 2) e.params.frequencyPenalty = 'Must be between -2 and 2.';
  if (p.presencePenalty < -2 || p.presencePenalty > 2)   e.params.presencePenalty = 'Must be between -2 and 2.';

  // placeholders
  const phList = draft.placeholders.list;
  if (phList.length > 0 && !draft.placeholders.startPattern) e.placeholders.startPattern = 'Start pattern is required when defining placeholders.';
  if (phList.length > 0 && !draft.placeholders.endPattern)   e.placeholders.endPattern = 'End pattern is required when defining placeholders.';
  const seen = new Map();
  phList.forEach(ph => { const k = ph.name.trim().toLowerCase(); if (k) seen.set(k, (seen.get(k) || 0) + 1); });
  e.placeholderItems = phList.map(ph => {
    const item = {};
    if (!ph.name.trim()) item.name = 'Placeholder name is required.';
    else if ((seen.get(ph.name.trim().toLowerCase()) || 0) > 1) item.name = 'Placeholder names must be unique.';
    return item;
  });

  // messages
  if (!draft.request.messages.some(m => m.role === 'user' && m.content.trim())) e.messages.general = 'Add at least one user message with content.';
  e.messageItems = draft.request.messages.map(m => {
    const item = {};
    if (!m.content.trim()) item.content = 'Message content cannot be empty.';
    if (m.role === 'tool' && !m.name?.trim()) item.name = 'Tool messages must include the tool name.';
    return item;
  });

  // tools
  e.toolItems = draft.toolConfigs.map(t => {
    const item = {};
    if (!t.name.trim())         item.name = 'Tool name is required.';
    if (!t.scenario.trim())     item.scenario = 'Scenario label is required.';
    if (!t.notes.trim())        item.notes = 'Tool description is required.';
    if (!t.mockResponse.trim()) item.mockResponse = 'Mock response preview is required.';
    return item;
  });

  // evaluations
  if (evalEnabled) {
    if (draft.evaluations.length === 0) e.evals.general = 'Add at least one evaluator or disable the evaluation plan.';
    e.evalItems = draft.evaluations.map(ev => {
      const item = {};
      if (!ev.evaluator.trim())   item.evaluator = 'Evaluator name is required.';
      if (!ev.type.trim())        item.type = 'Specify the evaluation type.';
      if (!ev.description.trim()) item.description = 'Describe what this evaluation checks.';
      return item;
    });
  }

  const hasErrors =
    Object.keys(e.metadata).length || Object.keys(e.model).length || Object.keys(e.params).length ||
    Object.keys(e.placeholders).length || e.placeholderItems.some(x => Object.keys(x).length) ||
    Object.keys(e.messages).length || e.messageItems.some(x => Object.keys(x).length) ||
    Object.keys(e.tools).length || e.toolItems.some(x => Object.keys(x).length) ||
    Object.keys(e.evals).length || e.evalItems.some(x => Object.keys(x).length);

  return { ...e, hasErrors };
}

// ── Tiny atoms ──────────────────────────────────────────────────
const FormMono = ({ children, style, size = 11, color = 'var(--pl-ink-700)' }) => (
  <span style={{ fontFamily: 'var(--pl-mono)', fontSize: size, color, letterSpacing: '-0.005em', ...style }}>{children}</span>
);

function FieldLabel({ children, required }) {
  return (
    <label style={{
      display: 'block', marginBottom: 6,
      fontFamily: 'var(--pl-mono)', fontSize: 10.5,
      letterSpacing: '0.10em', textTransform: 'uppercase',
      color: 'var(--pl-ink-600)', fontWeight: 500,
    }}>
      {children}
      {required && <span style={{ color: 'oklch(0.55 0.16 25)', marginLeft: 4 }}>*</span>}
    </label>
  );
}

function FieldError({ children }) {
  if (!children) return null;
  return (
    <div style={{
      marginTop: 5, fontFamily: 'var(--pl-mono)', fontSize: 10.5,
      color: 'oklch(0.45 0.15 25)', display: 'flex', gap: 6, alignItems: 'flex-start',
    }}>
      <span style={{ marginTop: 1 }}>!</span>
      <span>{children}</span>
    </div>
  );
}

function FieldHint({ children }) {
  return (
    <div style={{
      marginTop: 5, fontFamily: 'var(--pl-display)', fontSize: 11.5,
      color: 'var(--pl-ink-500)', lineHeight: 1.45,
    }}>{children}</div>
  );
}

const inputBase = {
  width: '100%', padding: '8px 10px',
  fontFamily: 'var(--pl-display)', fontSize: 13.5,
  color: 'var(--pl-ink-900)',
  background: 'var(--pl-paper)',
  border: '1px solid var(--pl-ink-200)',
  borderRadius: 4,
  outline: 'none', boxSizing: 'border-box',
};
// Inject a one-time stylesheet so input placeholders are visibly muted —
// browsers default to ~70% opacity which looks too much like real values.
if (typeof document !== 'undefined' && !document.getElementById('__form-placeholder-css')) {
  const s = document.createElement('style');
  s.id = '__form-placeholder-css';
  s.textContent = `input::placeholder, textarea::placeholder { color: var(--pl-ink-400); opacity: 1; }`;
  document.head.appendChild(s);
}
const inputMono = { ...inputBase, fontFamily: 'var(--pl-mono)', fontSize: 12.5 };
const inputErr = { borderColor: 'oklch(0.65 0.15 25)' };

function TextInput({ value, onChange, placeholder, error, mono }) {
  return (
    <input
      type="text" value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...(mono ? inputMono : inputBase), ...(error ? inputErr : {}) }}
    />
  );
}

function TextArea({ value, onChange, rows = 4, error, mono = true }) {
  return (
    <textarea
      value={value} onChange={e => onChange(e.target.value)} rows={rows}
      style={{
        ...(mono ? inputMono : inputBase),
        ...(error ? inputErr : {}),
        resize: 'vertical', lineHeight: 1.55,
      }}
    />
  );
}

function NumberInput({ value, onChange, step = 0.1, min, max, error }) {
  return (
    <input
      type="number" value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      step={step} min={min} max={max}
      style={{ ...inputMono, ...(error ? inputErr : {}), width: 100 }}
    />
  );
}

function Select({ value, onChange, options, error }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ ...inputBase, ...(error ? inputErr : {}), cursor: 'pointer' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--pl-signal-deep)' }} />
      <span style={{ fontFamily: 'var(--pl-display)', fontSize: 13, color: 'var(--pl-ink-800)' }}>{label}</span>
    </label>
  );
}

function GhostButton({ children, onClick, danger }) {
  return (
    <button onClick={onClick} type="button" style={{
      padding: '6px 12px',
      fontFamily: 'var(--pl-mono)', fontSize: 11, letterSpacing: '0.04em',
      background: 'transparent',
      border: `1px solid ${danger ? 'oklch(0.75 0.13 25)' : 'var(--pl-ink-200)'}`,
      color: danger ? 'oklch(0.45 0.15 25)' : 'var(--pl-ink-700)',
      borderRadius: 4, cursor: 'pointer',
    }}>{children}</button>
  );
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} type="button" disabled={disabled} style={{
      padding: '8px 16px',
      fontFamily: 'var(--pl-display)', fontSize: 13, fontWeight: 500,
      background: disabled ? 'var(--pl-ink-300)' : 'var(--pl-ink-900)',
      color: 'var(--pl-paper)',
      border: 'none', borderRadius: 4,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}>{children}</button>
  );
}

// ── Section card ────────────────────────────────────────────────
function Section({ num, title, subtitle, children, errorCount, action }) {
  return (
    <section style={{
      background: 'var(--pl-paper)',
      border: '1px solid var(--pl-ink-200)',
      borderRadius: 8,
      marginBottom: 24,
      overflow: 'hidden',
    }}>
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--pl-ink-200)',
        display: 'flex', alignItems: 'baseline', gap: 14, background: 'var(--pl-canvas)',
      }}>
        <FormMono color="var(--pl-signal-deep)" style={{ letterSpacing: '0.14em', fontWeight: 500 }}>§ {num}</FormMono>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--pl-display)', fontSize: 18, fontWeight: 500, color: 'var(--pl-ink-900)', letterSpacing: '-0.01em' }}>
            {title}
          </h3>
          {subtitle && <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--pl-ink-600)' }}>{subtitle}</p>}
        </div>
        {errorCount > 0 && (
          <span style={{
            padding: '3px 8px',
            background: 'oklch(0.95 0.04 25)',
            border: '1px solid oklch(0.85 0.10 25)',
            color: 'oklch(0.45 0.15 25)',
            fontFamily: 'var(--pl-mono)', fontSize: 10.5,
            borderRadius: 999, fontWeight: 500,
          }}>
            {errorCount} {errorCount === 1 ? 'error' : 'errors'}
          </span>
        )}
        {action}
      </header>
      <div style={{ padding: 24 }}>{children}</div>
    </section>
  );
}

// ── Sections ────────────────────────────────────────────────────
function MetadataSection({ draft, set, errors }) {
  return (
    <Section num="01" title="Metadata" subtitle="How collaborators find this prompt." errorCount={Object.keys(errors).length}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div>
          <FieldLabel required>Name</FieldLabel>
          <TextInput value={draft.name} onChange={v => set({ name: v })} error={errors.name} mono placeholder="doc-rag-answer" />
          <FieldError>{errors.name}</FieldError>
          <FieldHint>Slug only — letters, numbers, dashes, underscores.</FieldHint>
        </div>
        <div>
          <FieldLabel required>Group</FieldLabel>
          <TextInput value={draft.group} onChange={v => set({ group: v })} error={errors.group} mono placeholder="rag" />
          <FieldError>{errors.group}</FieldError>
          <FieldHint>Foldering for the catalog. Slug only.</FieldHint>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <FieldLabel required>Description</FieldLabel>
          <TextArea value={draft.description} onChange={v => set({ description: v })} rows={2} error={errors.description} mono={false} />
          <FieldError>{errors.description}</FieldError>
        </div>
        <div>
          <FieldLabel>Repository URL</FieldLabel>
          <TextInput value={draft.repositoryUrl} onChange={v => set({ repositoryUrl: v })} mono placeholder="https://github.com/…" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div>
            <FieldLabel>Version</FieldLabel>
            <TextInput value={draft.version} onChange={v => set({ version: v })} mono />
          </div>
          <div>
            <FieldLabel>Revision</FieldLabel>
            <TextInput value={draft.revision} onChange={v => set({ revision: v })} mono />
            <FieldHint>Auto-incremented on save.</FieldHint>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ModelSection({ draft, setReq, errors, paramErrors }) {
  const errCount = Object.keys(errors).length + Object.keys(paramErrors).length;
  return (
    <Section num="02" title="Model" subtitle="Which LLM, how it's called." errorCount={errCount}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, marginBottom: 18 }}>
        <div>
          <FieldLabel>Type</FieldLabel>
          <Select value={draft.request.type} onChange={v => setReq({ type: v })}
            options={[{ value: 'chat', label: 'Chat completion' }, { value: 'completion', label: 'Text completion' }]} />
        </div>
        <div>
          <FieldLabel required>Vendor</FieldLabel>
          <Select value={draft.request.vendor} onChange={v => setReq({ vendor: v })} error={errors.vendor}
            options={[
              { value: '',          label: '— select —' },
              { value: 'anthropic', label: 'Anthropic' },
              { value: 'openai',    label: 'OpenAI' },
              { value: 'google',    label: 'Google' },
              { value: 'azure',     label: 'Azure OpenAI' },
              { value: 'custom',    label: 'Custom endpoint' },
            ]} />
          <FieldError>{errors.vendor}</FieldError>
        </div>
        <div>
          <FieldLabel required>Model</FieldLabel>
          <TextInput value={draft.request.model} onChange={v => setReq({ model: v })} error={errors.model} mono placeholder="claude-sonnet-4-5" />
          <FieldError>{errors.model}</FieldError>
        </div>
        <div>
          <FieldLabel>Endpoint URL</FieldLabel>
          <TextInput value={draft.request.url} onChange={v => setReq({ url: v })} error={errors.url} mono placeholder="(default)" />
          <FieldError>{errors.url}</FieldError>
          <FieldHint>Override only for self-hosted / proxied endpoints.</FieldHint>
        </div>
        <div>
          <FieldLabel>Model snapshot</FieldLabel>
          <TextInput value={draft.request.modelSnapshot} onChange={v => setReq({ modelSnapshot: v })} mono placeholder="2025-04-14" />
          <FieldHint>Pin a specific snapshot (optional).</FieldHint>
        </div>
      </div>

      <div style={{
        borderTop: '1px solid var(--pl-ink-200)', paddingTop: 18,
      }}>
        <FormMono size={10.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', marginBottom: 14 }}>
          Parameters
        </FormMono>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 18 }}>
          {[
            { k: 'temperature',      label: 'Temperature',  min: 0, max: 2,  step: 0.1 },
            { k: 'topP',             label: 'Top P',        min: 0, max: 1,  step: 0.05 },
            { k: 'maxTokens',        label: 'Max tokens',   min: 1,          step: 64 },
            { k: 'frequencyPenalty', label: 'Freq penalty', min: -2, max: 2, step: 0.1 },
            { k: 'presencePenalty',  label: 'Pres penalty', min: -2, max: 2, step: 0.1 },
          ].map(p => (
            <div key={p.k}>
              <FieldLabel>{p.label}</FieldLabel>
              <NumberInput value={draft.request.parameters[p.k]}
                onChange={v => setReq({ parameters: { ...draft.request.parameters, [p.k]: v } })}
                step={p.step} min={p.min} max={p.max} error={paramErrors[p.k]} />
              <FieldError>{paramErrors[p.k]}</FieldError>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function PlaceholdersSection({ draft, setPh, errors, itemErrors }) {
  const errCount = Object.keys(errors).length + itemErrors.filter(x => Object.keys(x).length).length;
  const list = draft.placeholders.list;
  const update = (i, patch) => {
    const next = [...list]; next[i] = { ...next[i], ...patch };
    setPh({ list: next });
  };
  const remove = (i) => setPh({ list: list.filter((_, idx) => idx !== i) });
  const add = () => setPh({ list: [...list, { name: '', type: 'string', required: false, description: '' }] });

  return (
    <Section num="03" title="Placeholders" subtitle="Variables substituted at runtime." errorCount={errCount}
      action={<GhostButton onClick={add}>+ Add</GhostButton>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <div>
          <FieldLabel>Start pattern</FieldLabel>
          <TextInput value={draft.placeholders.startPattern} onChange={v => setPh({ startPattern: v })} error={errors.startPattern} mono />
          <FieldError>{errors.startPattern}</FieldError>
        </div>
        <div>
          <FieldLabel>End pattern</FieldLabel>
          <TextInput value={draft.placeholders.endPattern} onChange={v => setPh({ endPattern: v })} error={errors.endPattern} mono />
          <FieldError>{errors.endPattern}</FieldError>
        </div>
      </div>
      {list.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--pl-ink-500)', fontSize: 13, border: '1px dashed var(--pl-ink-300)', borderRadius: 6 }}>
          No placeholders. Click + Add to define one.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {list.map((ph, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1.2fr 0.8fr auto 2fr auto', gap: 12, alignItems: 'flex-start',
              padding: 14, background: 'var(--pl-canvas)', borderRadius: 6, border: '1px solid var(--pl-ink-200)',
            }}>
              <div>
                <FormMono size={9.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Name</FormMono>
                <TextInput value={ph.name} onChange={v => update(i, { name: v })} error={itemErrors[i]?.name} mono placeholder="user_query" />
                <FieldError>{itemErrors[i]?.name}</FieldError>
              </div>
              <div>
                <FormMono size={9.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Type</FormMono>
                <Select value={ph.type} onChange={v => update(i, { type: v })}
                  options={[{ value: 'string', label: 'string' }, { value: 'number', label: 'number' }, { value: 'boolean', label: 'boolean' }, { value: 'json', label: 'json' }]} />
              </div>
              <div style={{ paddingTop: 22 }}>
                <Checkbox checked={ph.required} onChange={v => update(i, { required: v })} label="Required" />
              </div>
              <div>
                <FormMono size={9.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Description</FormMono>
                <TextInput value={ph.description} onChange={v => update(i, { description: v })} mono={false} />
              </div>
              <div style={{ paddingTop: 22 }}>
                <GhostButton onClick={() => remove(i)} danger>×</GhostButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function MessagesSection({ draft, setReq, errors, itemErrors }) {
  const errCount = Object.keys(errors).length + itemErrors.filter(x => Object.keys(x).length).length;
  const messages = draft.request.messages;
  const update = (i, patch) => {
    const next = [...messages]; next[i] = { ...next[i], ...patch };
    setReq({ messages: next });
  };
  const remove = (i) => setReq({ messages: messages.filter((_, idx) => idx !== i) });
  const add = (role) => setReq({ messages: [...messages, { role, content: '', name: role === 'tool' ? '' : undefined }] });

  const roleColor = {
    system:    'oklch(0.55 0.08 270)',
    user:      'var(--pl-signal-deep)',
    assistant: 'oklch(0.50 0.12 155)',
    tool:      'oklch(0.55 0.13 70)',
  };

  return (
    <Section num="04" title="Messages" subtitle="The conversation template. Use {{placeholders}} to inject runtime values." errorCount={errCount}
      action={
        <div style={{ display: 'flex', gap: 6 }}>
          <GhostButton onClick={() => add('system')}>+ system</GhostButton>
          <GhostButton onClick={() => add('user')}>+ user</GhostButton>
          <GhostButton onClick={() => add('assistant')}>+ assistant</GhostButton>
          <GhostButton onClick={() => add('tool')}>+ tool</GhostButton>
        </div>
      }>
      {errors.general && <FieldError>{errors.general}</FieldError>}
      <div style={{ display: 'grid', gap: 14 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            border: '1px solid var(--pl-ink-200)', borderRadius: 6,
            background: 'var(--pl-canvas)', overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: '1px solid var(--pl-ink-200)', background: 'var(--pl-paper)',
            }}>
              <span style={{
                padding: '2px 8px', borderRadius: 3,
                background: roleColor[m.role] + '15',
                color: roleColor[m.role],
                fontFamily: 'var(--pl-mono)', fontSize: 10.5, fontWeight: 500,
                letterSpacing: '0.10em', textTransform: 'uppercase',
              }}>{m.role}</span>
              {m.role === 'tool' && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FormMono size={10.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>tool name</FormMono>
                  <input type="text" value={m.name || ''} onChange={e => update(i, { name: e.target.value })}
                    style={{ ...inputMono, ...(itemErrors[i]?.name ? inputErr : {}), width: 200, padding: '4px 8px' }} />
                </div>
              )}
              <div style={{ flex: 1 }} />
              <FormMono size={10} color="var(--pl-ink-500)">message {i + 1}</FormMono>
              <GhostButton onClick={() => remove(i)} danger>×</GhostButton>
            </div>
            <div style={{ padding: 12 }}>
              <TextArea value={m.content} onChange={v => update(i, { content: v })} rows={4} error={itemErrors[i]?.content} />
              <FieldError>{itemErrors[i]?.content}</FieldError>
              <FieldError>{itemErrors[i]?.name}</FieldError>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ToolsSection({ draft, setTools, itemErrors }) {
  const errCount = itemErrors.filter(x => Object.keys(x).length).length;
  const list = draft.toolConfigs;
  const update = (i, patch) => {
    const next = [...list]; next[i] = { ...next[i], ...patch };
    setTools(next);
  };
  const remove = (i) => setTools(list.filter((_, idx) => idx !== i));
  const add = () => setTools([...list, { name: '', scenario: 'happy-path', notes: '', mockResponse: '' }]);

  return (
    <Section num="05" title="MCP tool mocks" subtitle="Stub responses used during dev runs and tests. Real MCP catalog is loaded at runtime." errorCount={errCount}
      action={<GhostButton onClick={add}>+ Add mock</GhostButton>}>
      {list.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--pl-ink-500)', fontSize: 13, border: '1px dashed var(--pl-ink-300)', borderRadius: 6 }}>
          No tool mocks. Optional — only needed if this prompt calls MCP tools.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {list.map((t, i) => (
            <div key={i} style={{
              border: '1px solid var(--pl-ink-200)', borderRadius: 6,
              background: 'var(--pl-canvas)', padding: 16,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto', gap: 14, marginBottom: 14 }}>
                <div>
                  <FieldLabel required>Tool name</FieldLabel>
                  <TextInput value={t.name} onChange={v => update(i, { name: v })} error={itemErrors[i]?.name} mono placeholder="search_docs" />
                  <FieldError>{itemErrors[i]?.name}</FieldError>
                </div>
                <div>
                  <FieldLabel required>Scenario</FieldLabel>
                  <Select value={t.scenario} onChange={v => update(i, { scenario: v })} error={itemErrors[i]?.scenario}
                    options={[
                      { value: 'happy-path', label: 'happy-path' },
                      { value: 'empty',      label: 'empty' },
                      { value: 'error',      label: 'error' },
                      { value: 'timeout',    label: 'timeout' },
                      { value: 'malformed',  label: 'malformed' },
                    ]} />
                  <FieldError>{itemErrors[i]?.scenario}</FieldError>
                </div>
                <div style={{ paddingTop: 22 }}>
                  <GhostButton onClick={() => remove(i)} danger>×</GhostButton>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <FieldLabel required>Notes</FieldLabel>
                <TextInput value={t.notes} onChange={v => update(i, { notes: v })} error={itemErrors[i]?.notes} mono={false} />
                <FieldError>{itemErrors[i]?.notes}</FieldError>
              </div>
              <div>
                <FieldLabel required>Mock response</FieldLabel>
                <TextArea value={t.mockResponse} onChange={v => update(i, { mockResponse: v })} rows={3} error={itemErrors[i]?.mockResponse} />
                <FieldError>{itemErrors[i]?.mockResponse}</FieldError>
                <FieldHint>JSON, plain text, or a fixture path. Returned verbatim during dev runs.</FieldHint>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function EvaluationSection({ draft, setEvals, evalEnabled, setEvalEnabled, errors, itemErrors }) {
  const errCount = Object.keys(errors).length + itemErrors.filter(x => Object.keys(x).length).length;
  const list = draft.evaluations;
  const update = (i, patch) => { const next = [...list]; next[i] = { ...next[i], ...patch }; setEvals(next); };
  const remove = (i) => setEvals(list.filter((_, idx) => idx !== i));
  const add = () => setEvals([...list, { evaluator: '', type: 'llm-judge', description: '' }]);

  return (
    <Section num="06" title={
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        Evaluation plan
        <span style={{
          padding: '2px 7px',
          background: 'oklch(0.92 0.05 70)', color: 'oklch(0.45 0.13 70)',
          fontFamily: 'var(--pl-mono)', fontSize: 10, letterSpacing: '0.10em', textTransform: 'uppercase',
          borderRadius: 3, fontWeight: 500,
        }}>Pro · coming soon</span>
      </span>
    } subtitle="Define how this prompt is evaluated. Editing is allowed; execution requires the eval runner."
      errorCount={errCount}
      action={<Checkbox checked={evalEnabled} onChange={setEvalEnabled} label="Enable plan" />}>

      {!evalEnabled ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--pl-ink-500)', fontSize: 13 }}>
          Evaluation plan is disabled. Toggle "Enable plan" to define evaluators.
        </div>
      ) : (
        <>
          {errors.general && <FieldError>{errors.general}</FieldError>}
          <div style={{ display: 'grid', gap: 12, marginTop: errors.general ? 12 : 0 }}>
            {list.map((ev, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 12, alignItems: 'flex-start',
                padding: 14, background: 'var(--pl-canvas)', borderRadius: 6, border: '1px solid var(--pl-ink-200)',
              }}>
                <div>
                  <FormMono size={9.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Evaluator</FormMono>
                  <TextInput value={ev.evaluator} onChange={v => update(i, { evaluator: v })} error={itemErrors[i]?.evaluator} mono />
                  <FieldError>{itemErrors[i]?.evaluator}</FieldError>
                </div>
                <div>
                  <FormMono size={9.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Type</FormMono>
                  <Select value={ev.type} onChange={v => update(i, { type: v })} error={itemErrors[i]?.type}
                    options={[
                      { value: 'llm-judge', label: 'llm-judge' },
                      { value: 'rubric',    label: 'rubric' },
                      { value: 'exact',     label: 'exact match' },
                      { value: 'regex',     label: 'regex' },
                      { value: 'custom',    label: 'custom' },
                    ]} />
                  <FieldError>{itemErrors[i]?.type}</FieldError>
                </div>
                <div>
                  <FormMono size={9.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Description</FormMono>
                  <TextInput value={ev.description} onChange={v => update(i, { description: v })} error={itemErrors[i]?.description} mono={false} />
                  <FieldError>{itemErrors[i]?.description}</FieldError>
                </div>
                <div style={{ paddingTop: 22 }}>
                  <GhostButton onClick={() => remove(i)} danger>×</GhostButton>
                </div>
              </div>
            ))}
            <GhostButton onClick={add}>+ Add evaluator</GhostButton>
          </div>
        </>
      )}
    </Section>
  );
}

// ── Page ────────────────────────────────────────────────────────
function PromptFormPage({ mode = 'edit' }) {
  const [draft, setDraft] = React.useState(mode === 'create' ? EMPTY_DRAFT : SAMPLE_DRAFT);
  const [evalEnabled, setEvalEnabled] = React.useState(mode === 'edit');
  const errors = React.useMemo(() => validateDraft(draft, evalEnabled), [draft, evalEnabled]);

  const set = (patch) => setDraft(d => ({ ...d, ...patch }));
  const setReq = (patch) => setDraft(d => ({ ...d, request: { ...d.request, ...patch } }));
  const setPh = (patch) => setDraft(d => ({ ...d, placeholders: { ...d.placeholders, ...patch } }));

  return (
    <div style={{ background: 'var(--pl-canvas)', minHeight: '100vh', fontFamily: 'var(--pl-display)' }}>
      {/* Sticky header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--pl-paper)', borderBottom: '1px solid var(--pl-ink-200)',
        padding: '14px 56px', display: 'flex', alignItems: 'center', gap: 18,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 26, height: 26, borderRadius: 5,
            background: 'var(--pl-ink-900)', color: 'var(--pl-paper)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--pl-mono)', fontSize: 11, fontWeight: 600,
          }}>
            <span>p</span><span style={{ color: 'var(--pl-signal)' }}>L</span><span>M</span>
          </span>
          <FormMono size={11} color="var(--pl-ink-500)">
            <a href="#/prompts" style={{ color: 'var(--pl-ink-500)', textDecoration: 'none' }}>catalog</a>
            {'  /  '}
            <span style={{ color: 'var(--pl-ink-900)' }}>{mode === 'create' ? 'new prompt' : draft.name || 'untitled'}</span>
          </FormMono>
        </span>
        <span style={{
          padding: '3px 8px',
          background: mode === 'create' ? 'oklch(0.95 0.04 200)' : 'oklch(0.95 0.04 270)',
          color: mode === 'create' ? 'oklch(0.40 0.13 200)' : 'oklch(0.40 0.10 270)',
          fontFamily: 'var(--pl-mono)', fontSize: 10, letterSpacing: '0.10em', textTransform: 'uppercase',
          borderRadius: 3, fontWeight: 500,
        }}>{mode === 'create' ? 'New' : 'Editing'}</span>
        <div style={{ flex: 1 }} />
        <FormMono size={11} color={errors.hasErrors ? 'oklch(0.50 0.15 25)' : 'oklch(0.45 0.12 155)'}>
          {errors.hasErrors ? '! validation errors' : '✓ ready to save'}
        </FormMono>
        <GhostButton>Cancel</GhostButton>
        <GhostButton>Save draft</GhostButton>
        <PrimaryButton disabled={errors.hasErrors}>
          {mode === 'create' ? 'Create prompt' : 'Save & release'}
        </PrimaryButton>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 56px 80px' }}>
        <div style={{ marginBottom: 24 }}>
          <FormMono size={11} color="var(--pl-signal-deep)" style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500 }}>
            {mode === 'create' ? 'New prompt' : 'Edit prompt'}
          </FormMono>
          <h1 style={{
            margin: '8px 0 8px', fontFamily: 'var(--pl-display)',
            fontSize: 36, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.1,
            color: 'var(--pl-ink-900)',
          }}>
            {mode === 'create' ? 'Define a new prompt.' : draft.name || 'Untitled prompt'}
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--pl-ink-600)', maxWidth: 720 }}>
            All fields are saved to the spec file. Errors below must be resolved before
            release; draft saves are always allowed.
          </p>
        </div>

        <MetadataSection draft={draft} set={set} errors={errors.metadata} />
        <ModelSection draft={draft} setReq={setReq} errors={errors.model} paramErrors={errors.params} />
        <PlaceholdersSection draft={draft} setPh={setPh} errors={errors.placeholders} itemErrors={errors.placeholderItems} />
        <MessagesSection draft={draft} setReq={setReq} errors={errors.messages} itemErrors={errors.messageItems} />
        <ToolsSection draft={draft} setTools={(v) => setDraft(d => ({ ...d, toolConfigs: v }))} itemErrors={errors.toolItems} />
        <EvaluationSection draft={draft}
          setEvals={(v) => setDraft(d => ({ ...d, evaluations: v }))}
          evalEnabled={evalEnabled} setEvalEnabled={setEvalEnabled}
          errors={errors.evals} itemErrors={errors.evalItems} />

        {/* Footer */}
        <footer style={{
          marginTop: 16, padding: '20px 24px',
          background: 'var(--pl-paper)', border: '1px solid var(--pl-ink-200)', borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <FormMono size={11} color="var(--pl-ink-500)">
            spec → {draft.group || '<group>'}/{draft.name || '<name>'}.toml
          </FormMono>
          <div style={{ flex: 1 }} />
          <GhostButton>Cancel</GhostButton>
          <GhostButton>Save draft</GhostButton>
          <PrimaryButton disabled={errors.hasErrors}>
            {mode === 'create' ? 'Create prompt' : 'Save & release'}
          </PrimaryButton>
        </footer>
      </div>
    </div>
  );
}

window.PromptFormPage = PromptFormPage;
