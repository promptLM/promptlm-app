// prompt-form.jsx — Prompt create/edit form (compact, two-column)
//
// Layout:
//   ┌─ sticky header: breadcrumb · status · Cancel/Save draft/Release ┐
//   ├─ TAB STRIP: [Editor] [Test] ────────────────────────────────────┤
//   ├─ EDITOR TAB (default) ──────────────────────────────────────────┤
//   │  MAIN (wide, 700px)            │ RAIL (sticky, 360px)           │
//   │  • Identity (name + group)      │  • Model + parameters          │
//   │  • Description                  │  • Placeholders                │
//   │  • Messages                     │  • MCP tool mocks              │
//   │                                 │  • Evaluation plan (Pro)       │
//   ├─ TEST TAB ──────────────────────────────────────────────────────┤
//   │  See prompt-form-test-tab.jsx — three-region layout              │
//   └─────────────────────────────────────────────────────────────────┘
//
// All sections except Messages are collapsible. Collapse defaults differ
// per mode: in CREATE everything is open; in EDIT, sections that rarely
// change (Identity, Model params, Tools, Evals) start collapsed.
//
// Fields resolved from context (not editable in this form):
//   version  → bumped on save
//   revision → derived from git commit
//   repositoryUrl → resolved from project / git remote
//   request.url → resolved from vendor unless explicitly overridden in advanced settings
//   modelSnapshot → optional, shown under "advanced model" disclosure
//
// Validation rules mirror validation.ts in the repo.

const SLUG_RE = /^[A-Za-z0-9_-]+$/;
const URL_RE = /^https?:\/\//i;

// ── Drafts ──────────────────────────────────────────────────────
const EMPTY_DRAFT = {
  name: '',
  group: '',
  description: '',
  request: {
    type: 'chat',
    vendor: 'anthropic',
    model: 'claude-sonnet-4-5',
    modelSnapshot: '',
    parameters: { temperature: 0.2, topP: 1.0, maxTokens: 1024, frequencyPenalty: 0, presencePenalty: 0 },
    messages: [
      { role: 'system', content: '' },
      { role: 'user', content: '' },
    ],
  },
  placeholders: { startPattern: '{{', endPattern: '}}', list: [] },
  toolConfigs: [],
  evaluations: [],
};

const SAMPLE_DRAFT = {
  name: 'doc-rag-answer',
  group: 'rag',
  description: 'Answer a user question grounded in retrieved doc chunks. Used by the help-center bot and the internal Q&A surface.',
  request: {
    type: 'chat',
    vendor: 'openai',
    model: 'gpt-4.1',
    modelSnapshot: '2025-04-14',
    parameters: { temperature: 0.1, topP: 1.0, maxTokens: 1200, frequencyPenalty: 0, presencePenalty: 0 },
    messages: [
      { role: 'system', content: 'You are a careful technical-writing assistant. Answer ONLY from the provided chunks. If the answer is not present, say so plainly. Cite the chunk id inline like [c-913].' },
      { role: 'user', content: 'Question: {{question}}\n\nChunks:\n{{chunks}}\n\nTone: {{tone}}' },
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

// ── Context (resolved server-side, surfaced read-only) ──────────
const CONTEXT_EDIT = {
  version: '1.8.0',          // bumped on save
  revision: 'r34',           // current; next will be r35
  repositoryUrl: 'github.com/acme/agents',
  branch: 'main',
};
const CONTEXT_CREATE = {
  version: '0.1.0',          // initial
  revision: 'r1',
  repositoryUrl: 'github.com/acme/agents',
  branch: 'main',
};

// ── Validation (mirrors validation.ts) ──────────────────────────
function validateDraft(draft, evalEnabled) {
  const e = { metadata: {}, model: {}, params: {}, placeholders: {}, placeholderItems: [], messages: {}, messageItems: [], tools: {}, toolItems: [], evals: {}, evalItems: [] };

  if (!draft.name.trim())             e.metadata.name = 'Enter a prompt name.';
  else if (!SLUG_RE.test(draft.name)) e.metadata.name = "Letters, numbers, '-' or '_' only.";
  if (!draft.group.trim())            e.metadata.group = 'Select a prompt group.';
  else if (!SLUG_RE.test(draft.group)) e.metadata.group = "Letters, numbers, '-' or '_' only.";
  if (!draft.description.trim())      e.metadata.description = 'Add a short description.';

  if (!draft.request.vendor.trim())   e.model.vendor = 'Select a provider.';
  if (!draft.request.model.trim())    e.model.model = 'Select a model.';

  const p = draft.request.parameters;
  if (p.temperature < 0 || p.temperature > 2)    e.params.temperature = '0–2';
  if (p.topP < 0 || p.topP > 1)                  e.params.topP = '0–1';
  if (p.maxTokens <= 0)                          e.params.maxTokens = '> 0';
  if (p.frequencyPenalty < -2 || p.frequencyPenalty > 2) e.params.frequencyPenalty = '-2 to 2';
  if (p.presencePenalty < -2 || p.presencePenalty > 2)   e.params.presencePenalty = '-2 to 2';

  const phList = draft.placeholders.list;
  if (phList.length > 0 && !draft.placeholders.startPattern) e.placeholders.startPattern = 'Required.';
  if (phList.length > 0 && !draft.placeholders.endPattern)   e.placeholders.endPattern = 'Required.';
  const seen = new Map();
  phList.forEach(ph => { const k = ph.name.trim().toLowerCase(); if (k) seen.set(k, (seen.get(k) || 0) + 1); });
  e.placeholderItems = phList.map(ph => {
    const item = {};
    if (!ph.name.trim()) item.name = 'Required.';
    else if ((seen.get(ph.name.trim().toLowerCase()) || 0) > 1) item.name = 'Names must be unique.';
    return item;
  });

  if (!draft.request.messages.some(m => m.role === 'user' && m.content.trim())) e.messages.general = 'Add at least one user message with content.';
  e.messageItems = draft.request.messages.map(m => {
    const item = {};
    if (!m.content.trim()) item.content = 'Empty.';
    if (m.role === 'tool' && !m.name?.trim()) item.name = 'Tool name required.';
    return item;
  });

  e.toolItems = draft.toolConfigs.map(t => {
    const item = {};
    if (!t.name.trim())         item.name = 'Required.';
    if (!t.scenario.trim())     item.scenario = 'Required.';
    if (!t.notes.trim())        item.notes = 'Required.';
    if (!t.mockResponse.trim()) item.mockResponse = 'Required.';
    return item;
  });

  if (evalEnabled) {
    if (draft.evaluations.length === 0) e.evals.general = 'Add at least one evaluator.';
    e.evalItems = draft.evaluations.map(ev => {
      const item = {};
      if (!ev.evaluator.trim())   item.evaluator = 'Required.';
      if (!ev.type.trim())        item.type = 'Required.';
      if (!ev.description.trim()) item.description = 'Required.';
      return item;
    });
  }

  const cnt = (o) => Object.keys(o).length;
  const some = (a) => a.some(x => Object.keys(x).length);
  e.metadataCount = cnt(e.metadata);
  e.modelCount = cnt(e.model) + cnt(e.params);
  e.placeholdersCount = cnt(e.placeholders) + e.placeholderItems.filter(x => Object.keys(x).length).length;
  e.messagesCount = cnt(e.messages) + e.messageItems.filter(x => Object.keys(x).length).length;
  e.toolsCount = e.toolItems.filter(x => Object.keys(x).length).length;
  e.evalsCount = cnt(e.evals) + e.evalItems.filter(x => Object.keys(x).length).length;
  e.hasErrors = e.metadataCount + e.modelCount + e.placeholdersCount + e.messagesCount + e.toolsCount + e.evalsCount > 0;
  return e;
}

// ── Atoms ───────────────────────────────────────────────────────
const FormMono = ({ children, style, size = 11, color = 'var(--pl-ink-700)' }) => (
  <span style={{ fontFamily: 'var(--pl-mono)', fontSize: size, color, letterSpacing: '-0.005em', ...style }}>{children}</span>
);

// Inject placeholder + autosize CSS once
if (typeof document !== 'undefined' && !document.getElementById('__form-css')) {
  const s = document.createElement('style');
  s.id = '__form-css';
  s.textContent = `
    .pf-input::placeholder, .pf-input textarea::placeholder { color: var(--pl-ink-400); opacity: 1; }
    .pf-input:focus { border-color: var(--pl-signal-deep) !important; }
    .pf-input:focus.pf-err { border-color: oklch(0.55 0.18 25) !important; }
    .pf-collapser { transition: transform 120ms ease; }
    .pf-collapser.open { transform: rotate(90deg); }
  `;
  document.head.appendChild(s);
}

function FieldLabel({ children, required, hint, error }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
      <label style={{
        fontFamily: 'var(--pl-mono)', fontSize: 10, fontWeight: 500,
        letterSpacing: '0.10em', textTransform: 'uppercase',
        color: 'var(--pl-ink-600)',
      }}>
        {children}
        {required && <span style={{ color: 'oklch(0.55 0.16 25)', marginLeft: 3 }}>*</span>}
      </label>
      {error && (
        <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 10, color: 'oklch(0.50 0.15 25)' }}>
          ! {error}
        </span>
      )}
      {!error && hint && (
        <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 10, color: 'var(--pl-ink-400)' }}>
          {hint}
        </span>
      )}
    </div>
  );
}

const inputBase = {
  width: '100%', padding: '6px 9px',
  fontFamily: 'var(--pl-display)', fontSize: 13,
  color: 'var(--pl-ink-900)',
  background: 'var(--pl-paper)',
  border: '1px solid var(--pl-ink-200)',
  borderRadius: 4, outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 120ms ease',
};
const inputMono = { ...inputBase, fontFamily: 'var(--pl-mono)', fontSize: 12 };

function TextInput({ value, onChange, placeholder, error, mono, compact }) {
  return (
    <input
      className={`pf-input ${error ? 'pf-err' : ''}`}
      type="text" value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        ...(mono ? inputMono : inputBase),
        ...(compact ? { padding: '4px 8px', fontSize: 12 } : {}),
        ...(error ? { borderColor: 'oklch(0.65 0.15 25)' } : {}),
      }}
    />
  );
}

function TextArea({ value, onChange, rows = 3, error, mono = true }) {
  return (
    <textarea
      className={`pf-input ${error ? 'pf-err' : ''}`}
      value={value} onChange={e => onChange(e.target.value)} rows={rows}
      style={{
        ...(mono ? inputMono : inputBase),
        ...(error ? { borderColor: 'oklch(0.65 0.15 25)' } : {}),
        resize: 'vertical', lineHeight: 1.55,
      }}
    />
  );
}

function NumberInput({ value, onChange, step = 0.1, min, max, error, width = 80 }) {
  return (
    <input
      className={`pf-input ${error ? 'pf-err' : ''}`}
      type="number" value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      step={step} min={min} max={max}
      style={{ ...inputMono, ...(error ? { borderColor: 'oklch(0.65 0.15 25)' } : {}), width }}
    />
  );
}

function Select({ value, onChange, options, error, compact }) {
  return (
    <select className={`pf-input ${error ? 'pf-err' : ''}`} value={value} onChange={e => onChange(e.target.value)}
      style={{
        ...inputBase,
        ...(compact ? { padding: '4px 8px', fontSize: 12 } : {}),
        ...(error ? { borderColor: 'oklch(0.65 0.15 25)' } : {}),
        cursor: 'pointer',
      }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Checkbox({ checked, onChange, label, size = 13 }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--pl-signal-deep)' }} />
      <span style={{ fontFamily: 'var(--pl-display)', fontSize: size, color: 'var(--pl-ink-800)' }}>{label}</span>
    </label>
  );
}

function GhostButton({ children, onClick, danger, mini }) {
  return (
    <button onClick={onClick} type="button" style={{
      padding: mini ? '3px 8px' : '5px 10px',
      fontFamily: 'var(--pl-mono)', fontSize: mini ? 10 : 11, letterSpacing: '0.04em',
      background: 'transparent',
      border: `1px solid ${danger ? 'oklch(0.80 0.10 25)' : 'var(--pl-ink-200)'}`,
      color: danger ? 'oklch(0.45 0.15 25)' : 'var(--pl-ink-700)',
      borderRadius: 4, cursor: 'pointer',
    }}>{children}</button>
  );
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} type="button" disabled={disabled} style={{
      padding: '7px 14px',
      fontFamily: 'var(--pl-display)', fontSize: 13, fontWeight: 500,
      background: disabled ? 'var(--pl-ink-300)' : 'var(--pl-ink-900)',
      color: 'var(--pl-paper)', border: 'none', borderRadius: 4,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}>{children}</button>
  );
}

// ── Collapsible section ─────────────────────────────────────────
function Collapsible({ id, title, hint, defaultOpen = true, errorCount = 0, action, dense, children }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <section style={{
      borderBottom: '1px solid var(--pl-ink-200)',
      paddingBottom: open ? (dense ? 12 : 16) : 0,
    }}>
      <header
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: dense ? '10px 0 8px' : '14px 0 10px',
          cursor: 'pointer', userSelect: 'none',
        }}>
        <span className={`pf-collapser ${open ? 'open' : ''}`} style={{
          fontFamily: 'var(--pl-mono)', fontSize: 10, color: 'var(--pl-ink-500)',
          display: 'inline-block', width: 12, lineHeight: 1,
        }}>›</span>
        <h4 style={{
          margin: 0, fontFamily: 'var(--pl-display)',
          fontSize: dense ? 13 : 14, fontWeight: 500, color: 'var(--pl-ink-900)',
          letterSpacing: '-0.005em',
        }}>{title}</h4>
        {hint && <FormMono size={10.5} color="var(--pl-ink-500)">{hint}</FormMono>}
        {errorCount > 0 && (
          <span style={{
            padding: '1px 6px',
            background: 'oklch(0.96 0.04 25)', color: 'oklch(0.50 0.15 25)',
            border: '1px solid oklch(0.85 0.10 25)',
            fontFamily: 'var(--pl-mono)', fontSize: 10, fontWeight: 500,
            borderRadius: 999,
          }}>{errorCount}</span>
        )}
        <div style={{ flex: 1 }} />
        {open && action && <span onClick={e => e.stopPropagation()}>{action}</span>}
      </header>
      {open && <div>{children}</div>}
    </section>
  );
}

// ── Main column (the prompt) ────────────────────────────────────
function MessagesEditor({ draft, setReq, errors, itemErrors, placeholders }) {
  const messages = draft.request.messages;
  const update = (i, patch) => { const next = [...messages]; next[i] = { ...next[i], ...patch }; setReq({ messages: next }); };
  const remove = (i) => setReq({ messages: messages.filter((_, idx) => idx !== i) });
  const add = (role) => setReq({ messages: [...messages, { role, content: '', name: role === 'tool' ? '' : undefined }] });

  // Highlight {{placeholders}} in the textarea via overlay would be heavy; instead show a chip rail above.
  const phNames = placeholders.list.map(p => p.name).filter(Boolean);

  const roleColor = {
    system:    'oklch(0.50 0.10 270)',
    user:      'var(--pl-signal-deep)',
    assistant: 'oklch(0.45 0.13 155)',
    tool:      'oklch(0.50 0.13 70)',
  };

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 12,
        marginBottom: 12, paddingBottom: 10,
        borderBottom: '1px solid var(--pl-ink-200)',
      }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--pl-display)', fontSize: 16, fontWeight: 500, color: 'var(--pl-ink-900)', letterSpacing: '-0.005em' }}>
          Messages
        </h3>
        <FormMono size={10.5} color="var(--pl-ink-500)">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </FormMono>
        {errors.general && (
          <FormMono size={10.5} color="oklch(0.50 0.15 25)">! {errors.general}</FormMono>
        )}
        <div style={{ flex: 1 }} />
        <FormMono size={10} color="var(--pl-ink-500)">+ insert</FormMono>
        <GhostButton mini onClick={() => add('system')}>system</GhostButton>
        <GhostButton mini onClick={() => add('user')}>user</GhostButton>
        <GhostButton mini onClick={() => add('assistant')}>assistant</GhostButton>
        <GhostButton mini onClick={() => add('tool')}>tool</GhostButton>
      </div>

      {phNames.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          padding: '8px 12px', marginBottom: 12,
          background: 'var(--pl-canvas)', borderRadius: 5,
          border: '1px solid var(--pl-ink-200)',
        }}>
          <FormMono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>
            placeholders
          </FormMono>
          {phNames.map(n => (
            <span key={n} style={{
              padding: '2px 7px', borderRadius: 3,
              background: 'oklch(0.95 0.06 230)', color: 'var(--pl-signal-deep)',
              fontFamily: 'var(--pl-mono)', fontSize: 11.5,
            }}>{`{{${n}}}`}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            border: '1px solid var(--pl-ink-200)', borderRadius: 5,
            background: 'var(--pl-paper)', overflow: 'hidden',
          }}>
            <div style={{
              padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: '1px solid var(--pl-ink-200)',
              background: 'var(--pl-canvas)',
            }}>
              <Select compact value={m.role} onChange={v => update(i, { role: v, name: v === 'tool' ? (m.name || '') : undefined })}
                options={[{ value: 'system', label: 'system' }, { value: 'user', label: 'user' }, { value: 'assistant', label: 'assistant' }, { value: 'tool', label: 'tool' }]} />
              <span style={{
                width: 8, height: 8, borderRadius: 999, background: roleColor[m.role],
              }} />
              {m.role === 'tool' && (
                <input type="text" value={m.name || ''} onChange={e => update(i, { name: e.target.value })}
                  placeholder="tool name"
                  className={`pf-input ${itemErrors[i]?.name ? 'pf-err' : ''}`}
                  style={{ ...inputMono, padding: '4px 8px', fontSize: 12, width: 180,
                           ...(itemErrors[i]?.name ? { borderColor: 'oklch(0.65 0.15 25)' } : {}) }} />
              )}
              <div style={{ flex: 1 }} />
              <FormMono size={10} color="var(--pl-ink-400)">#{i + 1}</FormMono>
              {messages.length > 1 && (
                <GhostButton mini danger onClick={() => remove(i)}>×</GhostButton>
              )}
            </div>
            <div style={{ padding: 8 }}>
              <textarea
                className={`pf-input ${itemErrors[i]?.content ? 'pf-err' : ''}`}
                value={m.content} onChange={e => update(i, { content: e.target.value })}
                rows={Math.min(12, Math.max(3, m.content.split('\n').length + 1))}
                style={{
                  width: '100%',
                  fontFamily: 'var(--pl-mono)', fontSize: 12.5, lineHeight: 1.6,
                  color: 'var(--pl-ink-900)',
                  background: 'transparent',
                  border: 'none', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  padding: '4px 4px',
                }}
              />
              {itemErrors[i]?.content && (
                <FormMono size={10} color="oklch(0.50 0.15 25)">! {itemErrors[i].content}</FormMono>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Right rail ──────────────────────────────────────────────────
function RailModel({ draft, setReq, errors, paramErrors, defaultOpen }) {
  const errCount = Object.keys(errors).length + Object.keys(paramErrors).length;
  return (
    <Collapsible
      title="Model"
      hint={`${draft.request.vendor || '?'} · ${draft.request.model || '?'}`}
      errorCount={errCount} defaultOpen={defaultOpen} dense>
      <div style={{ display: 'grid', gap: 10 }}>
        <div>
          <FieldLabel required error={errors.vendor}>Vendor</FieldLabel>
          <Select compact value={draft.request.vendor} onChange={v => setReq({ vendor: v })} error={errors.vendor}
            options={[
              { value: '',          label: '— select —' },
              { value: 'anthropic', label: 'Anthropic' },
              { value: 'openai',    label: 'OpenAI' },
              { value: 'google',    label: 'Google' },
              { value: 'azure',     label: 'Azure OpenAI' },
              { value: 'custom',    label: 'Custom' },
            ]} />
        </div>
        <div>
          <FieldLabel required error={errors.model}>Model</FieldLabel>
          <TextInput compact value={draft.request.model} onChange={v => setReq({ model: v })} error={errors.model} mono placeholder="claude-sonnet-4-5" />
        </div>
        <div>
          <FieldLabel hint="optional">Snapshot</FieldLabel>
          <TextInput compact value={draft.request.modelSnapshot} onChange={v => setReq({ modelSnapshot: v })} mono placeholder="2025-04-14" />
        </div>

        <div style={{ marginTop: 4, paddingTop: 10, borderTop: '1px dashed var(--pl-ink-200)' }}>
          <FormMono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Parameters
          </FormMono>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { k: 'temperature',      label: 'Temp',     min: 0, max: 2,  step: 0.1 },
              { k: 'topP',             label: 'Top P',    min: 0, max: 1,  step: 0.05 },
              { k: 'maxTokens',        label: 'Max tok',  min: 1,          step: 64 },
              { k: 'frequencyPenalty', label: 'Freq pen', min: -2, max: 2, step: 0.1 },
              { k: 'presencePenalty',  label: 'Pres pen', min: -2, max: 2, step: 0.1 },
            ].map(p => (
              <div key={p.k}>
                <FieldLabel error={paramErrors[p.k]}>{p.label}</FieldLabel>
                <NumberInput value={draft.request.parameters[p.k]}
                  onChange={v => setReq({ parameters: { ...draft.request.parameters, [p.k]: v } })}
                  step={p.step} min={p.min} max={p.max} error={paramErrors[p.k]} width="100%" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Collapsible>
  );
}

function RailPlaceholders({ draft, setPh, errors, itemErrors, defaultOpen }) {
  const list = draft.placeholders.list;
  const errCount = Object.keys(errors).length + itemErrors.filter(x => Object.keys(x).length).length;
  const update = (i, patch) => { const next = [...list]; next[i] = { ...next[i], ...patch }; setPh({ list: next }); };
  const remove = (i) => setPh({ list: list.filter((_, idx) => idx !== i) });
  const add = () => setPh({ list: [...list, { name: '', type: 'string', required: false, description: '' }] });

  return (
    <Collapsible
      title="Placeholders" hint={`${list.length}`}
      errorCount={errCount} defaultOpen={defaultOpen} dense
      action={<GhostButton mini onClick={add}>+ Add</GhostButton>}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel error={errors.startPattern}>Start</FieldLabel>
          <TextInput compact value={draft.placeholders.startPattern} onChange={v => setPh({ startPattern: v })} error={errors.startPattern} mono />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel error={errors.endPattern}>End</FieldLabel>
          <TextInput compact value={draft.placeholders.endPattern} onChange={v => setPh({ endPattern: v })} error={errors.endPattern} mono />
        </div>
      </div>

      {list.length === 0 ? (
        <div style={{ padding: 12, fontSize: 12, color: 'var(--pl-ink-500)', border: '1px dashed var(--pl-ink-300)', borderRadius: 4, textAlign: 'center' }}>
          No placeholders.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {list.map((ph, i) => (
            <div key={i} style={{
              border: '1px solid var(--pl-ink-200)', borderRadius: 4,
              padding: 8, background: 'var(--pl-canvas)',
            }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <TextInput compact value={ph.name} onChange={v => update(i, { name: v })} error={itemErrors[i]?.name} mono placeholder="name" />
                <Select compact value={ph.type} onChange={v => update(i, { type: v })}
                  options={[{ value: 'string', label: 'str' }, { value: 'number', label: 'num' }, { value: 'boolean', label: 'bool' }, { value: 'json', label: 'json' }]} />
                <Checkbox size={11} checked={ph.required} onChange={v => update(i, { required: v })} label="req" />
                <GhostButton mini danger onClick={() => remove(i)}>×</GhostButton>
              </div>
              <TextInput compact value={ph.description} onChange={v => update(i, { description: v })} placeholder="description" />
              {itemErrors[i]?.name && (
                <FormMono size={10} color="oklch(0.50 0.15 25)" style={{ display: 'block', marginTop: 4 }}>! {itemErrors[i].name}</FormMono>
              )}
            </div>
          ))}
        </div>
      )}
    </Collapsible>
  );
}

function RailTools({ draft, setTools, itemErrors, defaultOpen }) {
  const list = draft.toolConfigs;
  const errCount = itemErrors.filter(x => Object.keys(x).length).length;
  const update = (i, patch) => { const next = [...list]; next[i] = { ...next[i], ...patch }; setTools(next); };
  const remove = (i) => setTools(list.filter((_, idx) => idx !== i));
  const add = () => setTools([...list, { name: '', scenario: 'happy-path', notes: '', mockResponse: '' }]);

  return (
    <Collapsible
      title="MCP tool mocks" hint={`${list.length}`}
      errorCount={errCount} defaultOpen={defaultOpen} dense
      action={<GhostButton mini onClick={add}>+ Add</GhostButton>}>
      {list.length === 0 ? (
        <div style={{ padding: 12, fontSize: 12, color: 'var(--pl-ink-500)', border: '1px dashed var(--pl-ink-300)', borderRadius: 4, textAlign: 'center' }}>
          No mocks.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {list.map((t, i) => (
            <div key={i} style={{
              border: '1px solid var(--pl-ink-200)', borderRadius: 4,
              padding: 8, background: 'var(--pl-canvas)',
            }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <TextInput compact value={t.name} onChange={v => update(i, { name: v })} error={itemErrors[i]?.name} mono placeholder="tool name" />
                <Select compact value={t.scenario} onChange={v => update(i, { scenario: v })} error={itemErrors[i]?.scenario}
                  options={[
                    { value: 'happy-path', label: 'happy-path' },
                    { value: 'empty',      label: 'empty' },
                    { value: 'error',      label: 'error' },
                    { value: 'timeout',    label: 'timeout' },
                    { value: 'malformed',  label: 'malformed' },
                  ]} />
                <GhostButton mini danger onClick={() => remove(i)}>×</GhostButton>
              </div>
              <TextInput compact value={t.notes} onChange={v => update(i, { notes: v })} error={itemErrors[i]?.notes} placeholder="notes" />
              <div style={{ marginTop: 6 }}>
                <TextArea value={t.mockResponse} onChange={v => update(i, { mockResponse: v })} rows={2} error={itemErrors[i]?.mockResponse} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Collapsible>
  );
}

function RailEvals({ draft, setEvals, evalEnabled, setEvalEnabled, errors, itemErrors, defaultOpen }) {
  const list = draft.evaluations;
  const errCount = (evalEnabled ? Object.keys(errors).length : 0) + itemErrors.filter(x => Object.keys(x).length).length;
  const update = (i, patch) => { const next = [...list]; next[i] = { ...next[i], ...patch }; setEvals(next); };
  const remove = (i) => setEvals(list.filter((_, idx) => idx !== i));
  const add = () => setEvals([...list, { evaluator: '', type: 'llm-judge', description: '' }]);

  return (
    <Collapsible
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Evaluation plan
          <span style={{
            padding: '1px 6px',
            background: 'oklch(0.94 0.05 70)', color: 'oklch(0.45 0.13 70)',
            fontFamily: 'var(--pl-mono)', fontSize: 9.5, fontWeight: 500,
            letterSpacing: '0.10em', textTransform: 'uppercase',
            borderRadius: 3,
          }}>Pro · soon</span>
        </span>
      }
      hint={evalEnabled ? `${list.length}` : 'disabled'}
      errorCount={errCount} defaultOpen={defaultOpen} dense
      action={<Checkbox size={11} checked={evalEnabled} onChange={setEvalEnabled} label="enable" />}>

      {!evalEnabled ? (
        <div style={{ padding: 12, fontSize: 12, color: 'var(--pl-ink-500)' }}>
          Toggle <FormMono size={11}>enable</FormMono> to define evaluators.
        </div>
      ) : (
        <>
          {errors.general && (
            <FormMono size={10.5} color="oklch(0.50 0.15 25)" style={{ display: 'block', marginBottom: 8 }}>! {errors.general}</FormMono>
          )}
          <div style={{ display: 'grid', gap: 6 }}>
            {list.map((ev, i) => (
              <div key={i} style={{
                border: '1px solid var(--pl-ink-200)', borderRadius: 4,
                padding: 8, background: 'var(--pl-canvas)',
              }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <TextInput compact value={ev.evaluator} onChange={v => update(i, { evaluator: v })} error={itemErrors[i]?.evaluator} mono placeholder="evaluator" />
                  <Select compact value={ev.type} onChange={v => update(i, { type: v })} error={itemErrors[i]?.type}
                    options={[
                      { value: 'llm-judge', label: 'llm-judge' },
                      { value: 'rubric',    label: 'rubric' },
                      { value: 'exact',     label: 'exact' },
                      { value: 'regex',     label: 'regex' },
                      { value: 'custom',    label: 'custom' },
                    ]} />
                  <GhostButton mini danger onClick={() => remove(i)}>×</GhostButton>
                </div>
                <TextInput compact value={ev.description} onChange={v => update(i, { description: v })} error={itemErrors[i]?.description} placeholder="description" />
              </div>
            ))}
            <GhostButton mini onClick={add}>+ Add evaluator</GhostButton>
          </div>
        </>
      )}
    </Collapsible>
  );
}

// ── Identity (compact, top of main column) ──────────────────────
function IdentityBlock({ draft, set, errors, mode, defaultOpen }) {
  return (
    <Collapsible
      title="Identity"
      hint={mode === 'edit' ? `${draft.group}/${draft.name}` : 'name + group + description'}
      errorCount={errors.metadataCount}
      defaultOpen={defaultOpen}
      dense>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <FieldLabel required error={errors.metadata.name}>Name</FieldLabel>
          <TextInput value={draft.name} onChange={v => set({ name: v })} error={errors.metadata.name} mono placeholder="doc-rag-answer" />
        </div>
        <div>
          <FieldLabel required error={errors.metadata.group}>Group</FieldLabel>
          <TextInput value={draft.group} onChange={v => set({ group: v })} error={errors.metadata.group} mono placeholder="rag" />
        </div>
      </div>
      <FieldLabel required error={errors.metadata.description}>Description</FieldLabel>
      <TextArea value={draft.description} onChange={v => set({ description: v })} rows={2} error={errors.metadata.description} mono={false} />
    </Collapsible>
  );
}

// ── Tab strip ───────────────────────────────────────────────────
function TabStrip({ active, setActive, hasTestRuns }) {
  const tab = (id, label, badge) => {
    const isActive = active === id;
    return (
      <button onClick={() => setActive(id)} type="button" style={{
        padding: '10px 16px',
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${isActive ? 'var(--pl-ink-900)' : 'transparent'}`,
        color: isActive ? 'var(--pl-ink-900)' : 'var(--pl-ink-500)',
        fontFamily: 'var(--pl-display)',
        fontSize: 13.5,
        fontWeight: isActive ? 500 : 400,
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        marginBottom: -1,
      }}>
        {label}
        {badge !== undefined && badge !== null && (
          <span style={{
            padding: '1px 6px',
            background: isActive ? 'var(--pl-ink-100)' : 'var(--pl-canvas)',
            color: 'var(--pl-ink-600)',
            fontFamily: 'var(--pl-mono)', fontSize: 10, fontWeight: 500,
            borderRadius: 999,
            border: '1px solid var(--pl-ink-200)',
          }}>{badge}</span>
        )}
      </button>
    );
  };
  return (
    <div style={{
      position: 'sticky', top: 50, zIndex: 9,
      background: 'var(--pl-paper)',
      borderBottom: '1px solid var(--pl-ink-200)',
      padding: '0 32px',
      display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {tab('editor', 'Editor')}
      {tab('test', 'Test', hasTestRuns ? '3' : null)}
    </div>
  );
}

// ── Release CTA (split-button-free; flow-state aware) ──────────
function ReleaseButton({ state, disabled, disabledReason, onClick, isCreate }) {
  const label = (() => {
    if (state === 'saving') return 'Saving draft…';
    if (state === 'running') return 'Running pre-release check…';
    if (state === 'released') return '✓ Released';
    if (state === 'blocked-prompt') return 'Release blocked';
    if (state === 'blocked-infra') return 'Release blocked (retry)';
    return isCreate ? 'Create' : 'Release';
  })();
  const showSpinner = state === 'saving' || state === 'running';
  const blocked = state === 'blocked-prompt' || state === 'blocked-infra';
  const released = state === 'released';

  return (
    <span title={disabled ? disabledReason : undefined} style={{ display: 'inline-flex' }}>
      <button onClick={onClick} type="button" disabled={disabled || showSpinner}
        style={{
          padding: '7px 14px',
          fontFamily: 'var(--pl-display)', fontSize: 13, fontWeight: 500,
          background: blocked
            ? 'oklch(0.55 0.18 25)'
            : released
              ? 'oklch(0.45 0.13 155)'
              : (disabled || showSpinner) ? 'var(--pl-ink-300)' : 'var(--pl-ink-900)',
          color: 'var(--pl-paper)', border: 'none', borderRadius: 4,
          cursor: (disabled || showSpinner) ? 'not-allowed' : 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          whiteSpace: 'nowrap',
          minWidth: showSpinner ? 220 : (blocked ? 200 : 90),
          justifyContent: 'center',
          transition: 'all 200ms ease',
        }}>
        {showSpinner && (
          <span style={{
            width: 11, height: 11, borderRadius: 999,
            border: '2px solid var(--pl-paper)',
            borderTopColor: 'transparent',
            animation: 'pf-rspin 800ms linear infinite',
          }} />
        )}
        {label}
      </button>
    </span>
  );
}

// Inject release-flow CSS once
if (typeof document !== 'undefined' && !document.getElementById('__form-release-css')) {
  const s = document.createElement('style');
  s.id = '__form-release-css';
  s.textContent = `@keyframes pf-rspin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(s);
}

// ── Toast (simple, ephemeral) ──────────────────────────────────
function Toast({ message, kind, action, onDismiss }) {
  if (!message) return null;
  const bg = kind === 'success' ? 'oklch(0.45 0.13 155)' : kind === 'error' ? 'oklch(0.55 0.18 25)' : 'var(--pl-ink-900)';
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 100,
      background: bg, color: 'var(--pl-paper)',
      padding: '10px 14px', borderRadius: 6,
      display: 'inline-flex', alignItems: 'center', gap: 12,
      boxShadow: 'var(--pl-shadow-md)',
      fontFamily: 'var(--pl-display)', fontSize: 13,
      maxWidth: 600,
    }}>
      <span>{message}</span>
      {action && (
        <button onClick={action.onClick} type="button" style={{
          background: 'transparent', border: '1px solid var(--pl-paper)',
          color: 'var(--pl-paper)', padding: '3px 9px', borderRadius: 4,
          fontFamily: 'var(--pl-mono)', fontSize: 11, cursor: 'pointer',
        }}>{action.label}</button>
      )}
      <button onClick={onDismiss} type="button" style={{
        background: 'transparent', border: 'none', color: 'var(--pl-paper)',
        cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0,
      }}>×</button>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────
function PromptFormPage({ mode = 'edit' }) {
  const [draft, setDraft] = React.useState(mode === 'create' ? EMPTY_DRAFT : SAMPLE_DRAFT);
  const [evalEnabled, setEvalEnabled] = React.useState(mode === 'edit');
  const [activeTab, setActiveTab] = React.useState('editor'); // 'editor' | 'test'
  const [releaseState, setReleaseState] = React.useState('idle'); // idle | saving | running | released | blocked-prompt | blocked-infra
  const [toast, setToast] = React.useState(null);
  const errors = React.useMemo(() => validateDraft(draft, evalEnabled), [draft, evalEnabled]);

  const set = (patch) => setDraft(d => ({ ...d, ...patch }));
  const setReq = (patch) => setDraft(d => ({ ...d, request: { ...d.request, ...patch } }));
  const setPh = (patch) => setDraft(d => ({ ...d, placeholders: { ...d.placeholders, ...patch } }));

  const ctx = mode === 'create' ? CONTEXT_CREATE : CONTEXT_EDIT;

  // For v1: Release is enabled if the draft has run at least once against the
  // current request shape. Prototype-side we treat the SAMPLE_EXECUTIONS list
  // as proof-of-test; in the real app this comes from PromptSpec.executions.
  const hasTestRuns = mode === 'edit'; // sample data has runs in edit mode
  const releaseDisabled = errors.hasErrors || !hasTestRuns;
  const releaseDisabledReason = errors.hasErrors
    ? 'Fix validation errors first.'
    : !hasTestRuns
      ? 'Run Test at least once before releasing.'
      : null;

  // Simulate the full release flow for the prototype.
  const handleRelease = () => {
    if (releaseDisabled) return;
    setReleaseState('saving');
    setTimeout(() => {
      setReleaseState('running');
      setTimeout(() => {
        // Demo: succeed by default. To demo failure paths, hold shift on click — see below.
        setReleaseState('released');
        setToast({
          message: 'Released v1.9 (r35) · pre-release check passed',
          kind: 'success',
          action: { label: 'View execution', onClick: () => { setActiveTab('test'); setToast(null); } },
        });
        setTimeout(() => {
          setReleaseState('idle');
          setToast(null);
        }, 5000);
      }, 1600);
    }, 600);
  };

  // Defaults: in CREATE everything is open; in EDIT, everything stays open
  // EXCEPT identity (rarely changes) and tools/evals if empty.
  const isCreate = mode === 'create';
  const identityOpen = isCreate || errors.metadataCount > 0;
  const modelOpen = true;
  const phOpen = isCreate || draft.placeholders.list.length > 0;
  const toolsOpen = isCreate || draft.toolConfigs.length > 0 || errors.toolsCount > 0;
  const evalsOpen = errors.evalsCount > 0;

  return (
    <div style={{ background: 'var(--pl-canvas)', minHeight: '100vh', fontFamily: 'var(--pl-display)', color: 'var(--pl-ink-900)' }}>
      {/* ── Sticky header ──────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--pl-paper)', borderBottom: '1px solid var(--pl-ink-200)',
        padding: '10px 32px', display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 24, height: 24, borderRadius: 5,
            background: 'var(--pl-ink-900)', color: 'var(--pl-paper)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--pl-mono)', fontSize: 10.5, fontWeight: 600,
          }}>
            <span>p</span><span style={{ color: 'var(--pl-signal)' }}>L</span><span>M</span>
          </span>
          <FormMono size={11} color="var(--pl-ink-500)">
            <a href="#/prompts" style={{ color: 'var(--pl-ink-500)', textDecoration: 'none' }}>{ctx.repositoryUrl}</a>
            {'  /  '}
            <a href="#/prompts" style={{ color: 'var(--pl-ink-500)', textDecoration: 'none' }}>prompts</a>
            {draft.group && (<>
              {'  /  '}
              <span style={{ color: 'var(--pl-ink-700)' }}>{draft.group}</span>
            </>)}
            {'  /  '}
            <span style={{ color: 'var(--pl-ink-900)', fontWeight: 500 }}>
              {draft.name || (isCreate ? 'new prompt' : 'untitled')}
            </span>
          </FormMono>
        </span>

        <span style={{
          padding: '2px 7px',
          background: isCreate ? 'oklch(0.94 0.05 200)' : 'oklch(0.94 0.04 270)',
          color: isCreate ? 'oklch(0.40 0.13 200)' : 'oklch(0.40 0.10 270)',
          fontFamily: 'var(--pl-mono)', fontSize: 10, letterSpacing: '0.10em', textTransform: 'uppercase',
          borderRadius: 3, fontWeight: 500,
        }}>{isCreate ? 'New' : 'Editing'}</span>

        <FormMono size={10.5} color="var(--pl-ink-500)">
          {isCreate
            ? <>v<span style={{ color: 'var(--pl-ink-700)' }}>{ctx.version}</span> · <span style={{ color: 'var(--pl-ink-700)' }}>{ctx.revision}</span></>
            : <>v<span style={{ color: 'var(--pl-ink-700)' }}>{ctx.version}</span> → next will bump · {ctx.branch}</>
          }
        </FormMono>

        <div style={{ flex: 1 }} />

        <FormMono size={11} color={errors.hasErrors ? 'oklch(0.50 0.15 25)' : 'oklch(0.45 0.12 155)'}>
          {errors.hasErrors
            ? <>! {[errors.metadataCount, errors.modelCount, errors.placeholdersCount, errors.messagesCount, errors.toolsCount, errors.evalsCount].reduce((a,b)=>a+b,0)} errors</>
            : '✓ ready to save'}
        </FormMono>
        <GhostButton>Cancel</GhostButton>
        <GhostButton>Save draft</GhostButton>
        <ReleaseButton
          state={releaseState}
          disabled={releaseDisabled}
          disabledReason={releaseDisabledReason}
          onClick={handleRelease}
          isCreate={isCreate}
        />
      </header>

      {/* ── Tab strip ────────────────────────────────────────── */}
      <TabStrip active={activeTab} setActive={setActiveTab} hasTestRuns={hasTestRuns} />

      {/* ── Tab content ──────────────────────────────────────── */}
      {activeTab === 'test' ? (
        window.PromptFormTestTab
          ? <window.PromptFormTestTab draft={draft} />
          : <div style={{ padding: 32, color: 'var(--pl-ink-500)' }}>Test tab module not loaded.</div>
      ) : (
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 360px',
        gap: 24, padding: '20px 32px 80px',
        maxWidth: 1320, margin: '0 auto',
      }}>
        {/* MAIN — the prompt itself */}
        <main style={{ minWidth: 0 }}>
          <IdentityBlock draft={draft} set={set} errors={errors} mode={mode} defaultOpen={identityOpen} />
          <div style={{ paddingTop: 16 }}>
            <MessagesEditor draft={draft} setReq={setReq} errors={errors.messages} itemErrors={errors.messageItems} placeholders={draft.placeholders} />
          </div>
        </main>

        {/* RAIL — supporting config */}
        <aside style={{
          alignSelf: 'start', position: 'sticky', top: 56,
          maxHeight: 'calc(100vh - 72px)', overflowY: 'auto',
          paddingRight: 4,
        }}>
          <RailModel draft={draft} setReq={setReq} errors={errors.model} paramErrors={errors.params} defaultOpen={modelOpen} />
          <RailPlaceholders draft={draft} setPh={setPh} errors={errors.placeholders} itemErrors={errors.placeholderItems} defaultOpen={phOpen} />
          <RailTools draft={draft} setTools={(v) => setDraft(d => ({ ...d, toolConfigs: v }))} itemErrors={errors.toolItems} defaultOpen={toolsOpen} />
          <RailEvals draft={draft}
            setEvals={(v) => setDraft(d => ({ ...d, evaluations: v }))}
            evalEnabled={evalEnabled} setEvalEnabled={setEvalEnabled}
            errors={errors.evals} itemErrors={errors.evalItems}
            defaultOpen={evalsOpen} />

          {/* file path footer */}
          <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--pl-paper)', border: '1px solid var(--pl-ink-200)', borderRadius: 5 }}>
            <FormMono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              spec file
            </FormMono>
            <FormMono size={11} color="var(--pl-ink-800)">
              prompts/{draft.group || '<group>'}/{draft.name || '<name>'}.toml
            </FormMono>
          </div>
        </aside>
      </div>
      )}

      {/* ── Toast ────────────────────────────────────────────── */}
      <Toast
        message={toast?.message}
        kind={toast?.kind}
        action={toast?.action}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}

window.PromptFormPage = PromptFormPage;
