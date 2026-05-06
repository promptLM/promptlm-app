// prompt-form-test-tab.jsx — Test tab inside the prompt form
//
// Layout (three regions, center collapsible + drag-resizable):
//   ┌─ Run controls bar ──────────────────────────────────────────────────────────┐
//   │  Model · snapshot   [▶ Run]  [⟲ Re-run last]    auto-save status            │
//   ├─ Placeholders ─────┬─ Rendered prompt ─┬─ Output ─────────────────────────┤
//   │  question  [____]  │  system: …        │  ▶ assistant                       │
//   │  chunks    [____]  │  user:   …        │  tool calls                        │
//   │  tone      [▼]     │  (live, vars      │  142ms · 412 tok                   │
//   │                    │   substituted)    │                                    │
//   ├─ Run history strip (live executions[]) ─────────────────────────────────────┤
//   │  [r34·5m ✓]  [r34·8m ✓]  …    [View history (mock)]                         │
//   └─────────────────────────────────────────────────────────────────────────────┘
//
// History semantics (Q5 lock): live executions[] resets on request changes.
// Older runs come from a backend repo-history API (TBD). This file stubs that
// API with mock data behind a "View history" button.

// Sample executions seeded as if they were already attached to the spec.
// In the real app these come from PromptSpec.executions filtered by current
// request shape; here we just expose them statically for the prototype.
const SAMPLE_EXECUTIONS = [
  {
    id: 'ex-r34-7',
    revision: 'r34',
    ts: Date.now() - 5 * 60 * 1000,
    status: 'ok',
    durationMs: 142,
    tokensIn: 312,
    tokensOut: 100,
    placeholders: {
      question: 'How do I configure rate limits?',
      chunks: '[c-913] Rate limits are configured per API key…\n[c-241] The default is 1000 req/min…',
      tone: 'neutral',
    },
    output: {
      assistant: 'Rate limits are configured per API key in the dashboard under Settings → Limits [c-913]. The default is 1000 requests per minute [c-241].',
      toolCalls: [
        { name: 'search_docs', scenario: 'happy-path', returned: '[{"id":"c-913",…}, {"id":"c-241",…}]' },
      ],
    },
  },
  {
    id: 'ex-r34-6',
    revision: 'r34',
    ts: Date.now() - 8 * 60 * 1000,
    status: 'ok',
    durationMs: 161,
    tokensIn: 298,
    tokensOut: 92,
    placeholders: {
      question: 'What happens when a webhook fails?',
      chunks: '[c-104] Failed webhooks are retried up to 5 times…',
      tone: 'neutral',
    },
    output: {
      assistant: 'Failed webhooks are retried up to 5 times with exponential backoff [c-104].',
      toolCalls: [
        { name: 'search_docs', scenario: 'happy-path', returned: '[{"id":"c-104",…}]' },
      ],
    },
  },
  {
    id: 'ex-r34-5',
    revision: 'r34',
    ts: Date.now() - 12 * 60 * 1000,
    status: 'fail',
    durationMs: 98,
    tokensIn: 280,
    tokensOut: 0,
    placeholders: {
      question: 'How do I get started?',
      chunks: '',
      tone: 'neutral',
    },
    output: {
      assistant: '',
      error: 'Empty `chunks` placeholder — search_docs(empty) scenario returned []. Prompt fell back to "I cannot answer from the provided context."',
      toolCalls: [
        { name: 'search_docs', scenario: 'empty', returned: '[]' },
      ],
    },
  },
];

// Mock repo-history (older revisions) — surfaces in the "View history" flyover.
const SAMPLE_HISTORY = [
  { id: 'ex-r33-12', revision: 'r33', ts: Date.now() - 2 * 3600 * 1000, status: 'ok',   note: 'last run before the v1.7 → v1.8 system-message edit' },
  { id: 'ex-r33-11', revision: 'r33', ts: Date.now() - 3 * 3600 * 1000, status: 'ok',   note: '' },
  { id: 'ex-r32-4',  revision: 'r32', ts: Date.now() - 26 * 3600 * 1000, status: 'fail', note: 'broken on tool-error scenario; fixed in r33' },
  { id: 'ex-r32-3',  revision: 'r32', ts: Date.now() - 27 * 3600 * 1000, status: 'ok',   note: '' },
];

// Inject Test-tab CSS once
if (typeof document !== 'undefined' && !document.getElementById('__form-test-css')) {
  const s = document.createElement('style');
  s.id = '__form-test-css';
  s.textContent = `
    .pft-region {
      background: var(--pl-paper);
      border: 1px solid var(--pl-ink-200);
      border-radius: 5px;
      min-width: 0;
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    .pft-region-header {
      padding: 8px 12px;
      background: var(--pl-canvas);
      border-bottom: 1px solid var(--pl-ink-200);
      display: flex; align-items: center; gap: 10px;
      flex-shrink: 0;
    }
    .pft-region-body {
      padding: 12px;
      overflow-y: auto;
      flex: 1;
    }
    .pft-resizer {
      width: 4px;
      cursor: col-resize;
      background: transparent;
      transition: background 120ms ease;
      flex-shrink: 0;
    }
    .pft-resizer:hover { background: var(--pl-signal); }
    .pft-resizer.dragging { background: var(--pl-signal-deep); }
    .pft-collapsed-strip {
      width: 36px;
      flex-shrink: 0;
      background: var(--pl-canvas);
      border: 1px solid var(--pl-ink-200);
      border-radius: 5px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 120ms ease;
    }
    .pft-collapsed-strip:hover { background: var(--pl-ink-100); }
    .pft-collapsed-strip span {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-family: var(--pl-mono);
      font-size: 10px;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      color: var(--pl-ink-500);
    }
    .pft-run-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 10px;
      background: var(--pl-paper);
      border: 1px solid var(--pl-ink-200);
      border-radius: 999px;
      font-family: var(--pl-mono);
      font-size: 11px;
      cursor: pointer;
      transition: all 120ms ease;
      flex-shrink: 0;
    }
    .pft-run-pill:hover { border-color: var(--pl-ink-400); background: var(--pl-canvas); }
    .pft-run-pill.active { border-color: var(--pl-signal-deep); background: oklch(0.96 0.04 230); }
    .pft-run-pill .dot {
      width: 6px; height: 6px; border-radius: 999px;
    }
    .pft-run-pill .dot.ok { background: var(--pl-ok); }
    .pft-run-pill .dot.fail { background: var(--pl-fail); }
    .pft-history-flyover {
      position: absolute; right: 0; bottom: 100%;
      margin-bottom: 8px;
      width: 420px; max-height: 360px;
      background: var(--pl-paper);
      border: 1px solid var(--pl-ink-300);
      border-radius: 6px;
      box-shadow: var(--pl-shadow-md);
      overflow: hidden;
      z-index: 20;
      display: flex; flex-direction: column;
    }
  `;
  document.head.appendChild(s);
}

// ── Atoms (lean on prompt-form's FormMono shape but redefine locally to avoid coupling) ──
const TestMono = ({ children, style, size = 11, color = 'var(--pl-ink-700)' }) => (
  <span style={{ fontFamily: 'var(--pl-mono)', fontSize: size, color, letterSpacing: '-0.005em', ...style }}>{children}</span>
);

function TestGhostButton({ children, onClick, disabled, mini, danger }) {
  return (
    <button onClick={onClick} type="button" disabled={disabled} style={{
      padding: mini ? '3px 8px' : '5px 11px',
      fontFamily: 'var(--pl-mono)', fontSize: mini ? 10 : 11, letterSpacing: '0.04em',
      background: 'transparent',
      border: `1px solid ${danger ? 'oklch(0.80 0.10 25)' : 'var(--pl-ink-200)'}`,
      color: disabled ? 'var(--pl-ink-400)' : (danger ? 'oklch(0.45 0.15 25)' : 'var(--pl-ink-700)'),
      borderRadius: 4,
      cursor: disabled ? 'not-allowed' : 'pointer',
      whiteSpace: 'nowrap',
    }}>{children}</button>
  );
}

function TestPrimaryButton({ children, onClick, disabled, busy }) {
  return (
    <button onClick={onClick} type="button" disabled={disabled || busy} style={{
      padding: '6px 14px',
      fontFamily: 'var(--pl-display)', fontSize: 12.5, fontWeight: 500,
      background: (disabled || busy) ? 'var(--pl-ink-300)' : 'var(--pl-ink-900)',
      color: 'var(--pl-paper)', border: 'none', borderRadius: 4,
      cursor: (disabled || busy) ? 'not-allowed' : 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      whiteSpace: 'nowrap',
    }}>
      {busy && <span style={{
        width: 10, height: 10, borderRadius: 999,
        border: '2px solid var(--pl-paper)',
        borderTopColor: 'transparent',
        animation: 'pl-pulse 800ms linear infinite',
      }} />}
      {children}
    </button>
  );
}

// ── Region: Placeholder values (left) ───────────────────────────
function PlaceholderValuesRegion({ draft, values, setValues, onResetToDefaults, isDirty }) {
  const list = draft.placeholders.list;

  if (list.length === 0) {
    return (
      <div style={{ padding: 14, color: 'var(--pl-ink-500)', fontSize: 12.5, fontFamily: 'var(--pl-display)' }}>
        This prompt has no placeholders. Run it to see the static prompt against the model.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {list.map((ph) => (
        <div key={ph.name}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <TestMono size={11} color="var(--pl-ink-700)" style={{ fontWeight: 500 }}>{ph.name}</TestMono>
            {ph.required && <TestMono size={9.5} color="oklch(0.55 0.15 25)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>req</TestMono>}
            <TestMono size={9.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>{ph.type}</TestMono>
          </div>
          {ph.description && (
            <div style={{ fontFamily: 'var(--pl-display)', fontSize: 11, color: 'var(--pl-ink-500)', marginBottom: 4 }}>
              {ph.description}
            </div>
          )}
          <textarea
            value={values[ph.name] || ''}
            onChange={e => setValues({ ...values, [ph.name]: e.target.value })}
            rows={ph.name === 'chunks' ? 4 : 2}
            placeholder={`enter ${ph.name}…`}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontFamily: 'var(--pl-mono)', fontSize: 12, lineHeight: 1.5,
              color: 'var(--pl-ink-900)',
              background: 'var(--pl-paper)',
              border: '1px solid var(--pl-ink-200)',
              borderRadius: 4, outline: 'none', boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
        </div>
      ))}
      {isDirty && (
        <div>
          <TestGhostButton mini onClick={onResetToDefaults}>↺ Reset to spec defaults</TestGhostButton>
        </div>
      )}
    </div>
  );
}

// ── Region: Rendered prompt preview (center) ────────────────────
function substitute(template, values, startPattern, endPattern) {
  // Escape regex metachars in patterns
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${esc(startPattern)}\\s*(\\w+)\\s*${esc(endPattern)}`, 'g');
  return template.replace(re, (full, name) => {
    if (Object.prototype.hasOwnProperty.call(values, name) && values[name] !== '') {
      return values[name];
    }
    return full; // leave unsubstituted so it's visible
  });
}

function RenderedPromptRegion({ draft, values }) {
  const messages = draft.request.messages;
  const { startPattern, endPattern } = draft.placeholders;

  const roleColor = {
    system:    'oklch(0.50 0.10 270)',
    user:      'var(--pl-signal-deep)',
    assistant: 'oklch(0.45 0.13 155)',
    tool:      'oklch(0.50 0.13 70)',
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontFamily: 'var(--pl-display)', fontSize: 11, color: 'var(--pl-ink-500)', marginBottom: 2 }}>
        What will be sent to <TestMono size={11} color="var(--pl-ink-700)">{draft.request.vendor}/{draft.request.model}</TestMono> when you click Run.
      </div>
      {messages.map((m, i) => {
        const rendered = substitute(m.content, values, startPattern, endPattern);
        const hasUnresolved = rendered !== m.content
          ? rendered.match(new RegExp(`${startPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\w+\\s*${endPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'))
          : m.content.match(new RegExp(`${startPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\w+\\s*${endPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'));
        return (
          <div key={i} style={{
            border: '1px solid var(--pl-ink-200)', borderRadius: 4,
            background: 'var(--pl-canvas)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '4px 8px', borderBottom: '1px solid var(--pl-ink-200)',
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--pl-paper)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: roleColor[m.role] }} />
              <TestMono size={10} color="var(--pl-ink-700)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>{m.role}</TestMono>
              {hasUnresolved && (
                <TestMono size={10} color="oklch(0.50 0.13 70)" style={{ marginLeft: 'auto' }}>! unresolved placeholder</TestMono>
              )}
            </div>
            <pre style={{
              margin: 0, padding: 8,
              fontFamily: 'var(--pl-mono)', fontSize: 12, lineHeight: 1.55,
              color: 'var(--pl-ink-900)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {renderWithHighlights(rendered, startPattern, endPattern, values)}
            </pre>
          </div>
        );
      })}
    </div>
  );
}

// Highlight placeholder zones inline so the eye can track substitution.
function renderWithHighlights(text, startPattern, endPattern, values) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${esc(startPattern)}\\s*(\\w+)\\s*${esc(endPattern)}`, 'g');
  // Build a flat tokenization: alternating raw text and unresolved placeholder spans.
  const out = [];
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<span key={m.index} style={{
      background: 'oklch(0.92 0.10 70)', color: 'oklch(0.40 0.13 70)',
      padding: '0 3px', borderRadius: 2,
    }}>{m[0]}</span>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  // Also highlight resolved values (those the substitute already replaced) — we approximate
  // by walking values and wrapping their occurrences if present.
  // For prototype simplicity we skip resolved-value highlighting and only mark unresolved.
  return out;
}

// ── Region: Output (right) ───────────────────────────────────────
function OutputRegion({ run, runState, runError }) {
  if (runState === 'running') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32, color: 'var(--pl-ink-500)' }}>
        <span style={{
          width: 18, height: 18, borderRadius: 999,
          border: '3px solid var(--pl-ink-300)',
          borderTopColor: 'var(--pl-signal-deep)',
          animation: 'pl-spin 800ms linear infinite',
        }} />
        <TestMono size={11} color="var(--pl-ink-500)">running…</TestMono>
        <style>{`@keyframes pl-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (runState === 'error') {
    return (
      <div style={{
        padding: 12,
        border: '1px solid oklch(0.85 0.10 25)',
        background: 'oklch(0.97 0.03 25)',
        borderRadius: 4,
        color: 'oklch(0.40 0.15 25)',
        fontFamily: 'var(--pl-mono)', fontSize: 12, lineHeight: 1.6,
      }}>
        {runError || 'Run failed.'}
      </div>
    );
  }

  if (!run) {
    return (
      <div style={{ padding: 14, color: 'var(--pl-ink-500)', fontSize: 12.5, fontFamily: 'var(--pl-display)' }}>
        Click <TestMono size={11.5} color="var(--pl-ink-700)">▶ Run</TestMono> to execute against the live model. Output, tool calls, and run metadata will appear here.
      </div>
    );
  }

  const { output, durationMs, tokensIn, tokensOut, status } = run;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {output.assistant && (
        <div style={{
          border: '1px solid var(--pl-ink-200)', borderRadius: 4,
          background: 'var(--pl-canvas)',
        }}>
          <div style={{
            padding: '4px 8px', borderBottom: '1px solid var(--pl-ink-200)',
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--pl-paper)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: 'oklch(0.45 0.13 155)' }} />
            <TestMono size={10} color="var(--pl-ink-700)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>assistant</TestMono>
          </div>
          <pre style={{
            margin: 0, padding: 10,
            fontFamily: 'var(--pl-mono)', fontSize: 12, lineHeight: 1.6,
            color: 'var(--pl-ink-900)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>{output.assistant}</pre>
        </div>
      )}

      {output.error && (
        <div style={{
          padding: 10,
          border: '1px solid oklch(0.85 0.10 25)',
          background: 'oklch(0.97 0.03 25)',
          borderRadius: 4,
          fontFamily: 'var(--pl-mono)', fontSize: 11.5, lineHeight: 1.55,
          color: 'oklch(0.42 0.15 25)',
        }}>
          {output.error}
        </div>
      )}

      {output.toolCalls && output.toolCalls.length > 0 && (
        <div>
          <TestMono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            tool calls ({output.toolCalls.length})
          </TestMono>
          <div style={{ display: 'grid', gap: 6 }}>
            {output.toolCalls.map((tc, i) => (
              <div key={i} style={{
                border: '1px solid var(--pl-ink-200)', borderRadius: 4,
                padding: 8, background: 'var(--pl-canvas)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <TestMono size={11} color="var(--pl-ink-800)" style={{ fontWeight: 500 }}>{tc.name}</TestMono>
                  <TestMono size={10} color="oklch(0.45 0.13 70)">→ scenario: {tc.scenario}</TestMono>
                </div>
                <TestMono size={11} color="var(--pl-ink-600)" style={{ display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {tc.returned}
                </TestMono>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Run footer */}
      <div style={{
        padding: '8px 10px',
        background: 'var(--pl-canvas)',
        border: '1px solid var(--pl-ink-200)',
        borderRadius: 4,
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: status === 'ok' ? 'var(--pl-ok)' : 'var(--pl-fail)' }} />
          <TestMono size={10.5} color="var(--pl-ink-700)" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {status === 'ok' ? 'passed' : 'failed'}
          </TestMono>
        </span>
        <TestMono size={10.5} color="var(--pl-ink-500)">{durationMs}ms</TestMono>
        <TestMono size={10.5} color="var(--pl-ink-500)">{tokensIn}+{tokensOut} tok</TestMono>
        <div style={{ flex: 1 }} />
        <TestGhostButton mini>copy as fixture</TestGhostButton>
      </div>
    </div>
  );
}

// ── Run history strip + history flyover ─────────────────────────
function RunHistoryStrip({ executions, activeId, setActiveId, requestChanged, onViewHistory }) {
  if (requestChanged && executions.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px',
        background: 'var(--pl-canvas)',
        border: '1px dashed var(--pl-ink-300)',
        borderRadius: 5,
      }}>
        <TestMono size={11} color="var(--pl-ink-600)">
          Request changed — earlier runs moved to history.
        </TestMono>
        <div style={{ flex: 1 }} />
        <TestGhostButton mini onClick={onViewHistory}>View history →</TestGhostButton>
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px',
        background: 'var(--pl-canvas)',
        border: '1px dashed var(--pl-ink-300)',
        borderRadius: 5,
      }}>
        <TestMono size={11} color="var(--pl-ink-600)">
          No runs yet for this request. Click Run above to test.
        </TestMono>
        <div style={{ flex: 1 }} />
        <TestGhostButton mini onClick={onViewHistory}>View history →</TestGhostButton>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: 8,
      background: 'var(--pl-paper)',
      border: '1px solid var(--pl-ink-200)',
      borderRadius: 5,
      overflowX: 'auto',
    }}>
      <TestMono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase', flexShrink: 0 }}>
        recent
      </TestMono>
      {executions.map(ex => (
        <button key={ex.id} type="button"
          className={`pft-run-pill ${ex.id === activeId ? 'active' : ''}`}
          onClick={() => setActiveId(ex.id)}>
          <TestMono size={10.5} color="var(--pl-ink-600)">{ex.revision}</TestMono>
          <span className={`dot ${ex.status}`} />
          <TestMono size={10.5} color="var(--pl-ink-700)">{relativeTime(ex.ts)}</TestMono>
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <TestGhostButton mini onClick={onViewHistory}>View history →</TestGhostButton>
    </div>
  );
}

function HistoryFlyover({ open, onClose, items }) {
  if (!open) return null;
  return (
    <div className="pft-history-flyover">
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--pl-ink-200)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--pl-canvas)',
      }}>
        <TestMono size={11} color="var(--pl-ink-800)" style={{ fontWeight: 500 }}>
          Run history
        </TestMono>
        <TestMono size={10} color="oklch(0.45 0.13 70)" style={{
          padding: '1px 6px',
          background: 'oklch(0.96 0.05 70)',
          border: '1px solid oklch(0.85 0.10 70)',
          borderRadius: 3, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          stub · pending backend api
        </TestMono>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--pl-mono)', fontSize: 14, color: 'var(--pl-ink-600)',
        }}>×</button>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: 8 }}>
        <div style={{ fontFamily: 'var(--pl-display)', fontSize: 11, color: 'var(--pl-ink-500)', padding: '4px 6px 8px' }}>
          Older runs reconstructed from repo history. Each entry is tied to the revision it was run against.
        </div>
        {items.map(it => (
          <div key={it.id} style={{
            display: 'flex', alignItems: 'baseline', gap: 10,
            padding: '8px 6px',
            borderTop: '1px solid var(--pl-ink-100)',
          }}>
            <TestMono size={11} color="var(--pl-ink-800)" style={{ fontWeight: 500, minWidth: 32 }}>{it.revision}</TestMono>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: it.status === 'ok' ? 'var(--pl-ok)' : 'var(--pl-fail)' }} />
            <TestMono size={11} color="var(--pl-ink-600)">{relativeTime(it.ts)}</TestMono>
            {it.note && (
              <span style={{ fontFamily: 'var(--pl-display)', fontSize: 11, color: 'var(--pl-ink-500)', flex: 1 }}>
                {it.note}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function relativeTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Main TestTab component ──────────────────────────────────────
function TestTab({ draft }) {
  // Initial values: spec defaults
  const initialValues = React.useMemo(() => {
    const vals = {};
    draft.placeholders.list.forEach(ph => { vals[ph.name] = ''; });
    // Seed with sample-execution values so the first render is more useful
    if (SAMPLE_EXECUTIONS.length > 0) Object.assign(vals, SAMPLE_EXECUTIONS[0].placeholders);
    return vals;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [values, setValues] = React.useState(initialValues);
  const [executions] = React.useState(SAMPLE_EXECUTIONS);
  const [activeRunId, setActiveRunId] = React.useState(SAMPLE_EXECUTIONS[0]?.id || null);
  const [runState, setRunState] = React.useState('idle'); // idle | running | error
  const [runError] = React.useState(null);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  // Center column: collapsed + width state
  const [centerCollapsed, setCenterCollapsed] = React.useState(false);
  const [centerWidth, setCenterWidth] = React.useState(360);
  const [draggingResizer, setDraggingResizer] = React.useState(null); // 'left' | 'right' | null

  // Mock "request changed" state — false by default; user can flip to demo the empty-state.
  const [requestChanged, setRequestChanged] = React.useState(false);

  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  const activeRun = executions.find(e => e.id === activeRunId);

  const handleRun = () => {
    setRunState('running');
    setTimeout(() => {
      setRunState('idle');
      // In the prototype, just keep showing the active run — real impl would prepend a new one.
    }, 1500);
  };

  // Drag-resize handler for the center column
  React.useEffect(() => {
    if (!draggingResizer) return;
    const onMove = (e) => {
      // The left region has flex: 1 1 0 with a min, center has explicit width.
      // We capture mouse delta and adjust centerWidth on right-resizer drag.
      // For simplicity, both resizers adjust centerWidth (left-resizer = expand left at expense of center; right = expand right).
      // We track on first event; subsequent events use clientX delta from the prior event.
      // Implemented imperatively with a ref-like closure.
    };
    const onUp = () => setDraggingResizer(null);
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [draggingResizer]);

  // Simpler resize: pointer-down on the resizer captures startX/startWidth and listens for pointermove.
  const startResize = (which) => (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = centerWidth;
    setDraggingResizer(which);
    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      // left resizer: dragging right shrinks center; right resizer: dragging right grows center.
      const next = which === 'right' ? startWidth + dx : startWidth - dx;
      setCenterWidth(Math.max(220, Math.min(640, next)));
    };
    const onUp = () => {
      setDraggingResizer(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      padding: '20px 32px 80px',
      maxWidth: 1320, margin: '0 auto',
      minHeight: 'calc(100vh - 120px)',
    }}>
      {/* Run controls bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px',
        background: 'var(--pl-paper)',
        border: '1px solid var(--pl-ink-200)',
        borderRadius: 5,
        flexWrap: 'wrap',
      }}>
        <TestMono size={10.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>
          run against
        </TestMono>
        <TestMono size={11.5} color="var(--pl-ink-800)" style={{ fontWeight: 500 }}>
          {draft.request.vendor}/{draft.request.model}
        </TestMono>
        {draft.request.modelSnapshot && (
          <TestMono size={10.5} color="var(--pl-ink-500)">
            · snapshot {draft.request.modelSnapshot}
          </TestMono>
        )}
        <span style={{ width: 1, height: 16, background: 'var(--pl-ink-200)' }} />
        <TestPrimaryButton onClick={handleRun} busy={runState === 'running'}>
          {runState === 'running' ? 'Running…' : '▶ Run'}
        </TestPrimaryButton>
        <TestGhostButton onClick={handleRun} disabled={!activeRun}>⟲ Re-run last</TestGhostButton>
        <div style={{ flex: 1 }} />
        <TestMono size={10.5} color="var(--pl-ink-500)">
          {isDirty ? 'override active · run uses these values' : 'using spec defaults'}
        </TestMono>
        {/* Demo affordance: flip request-changed for the empty-state UX. Hidden under a tiny label so reviewers can poke at it. */}
        <button onClick={() => setRequestChanged(v => !v)} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--pl-mono)', fontSize: 9.5, color: 'var(--pl-ink-400)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}
        title="demo: simulate request-changed empty state">
          {requestChanged ? '· request-changed: on' : '· demo: simulate request change'}
        </button>
      </div>

      {/* Three-region layout */}
      <div style={{
        display: 'flex',
        gap: 0,
        flex: 1,
        minHeight: 480,
      }}>
        {/* LEFT — placeholder values */}
        <div className="pft-region" style={{ flex: '1 1 0', minWidth: 240 }}>
          <div className="pft-region-header">
            <TestMono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>
              placeholder values
            </TestMono>
            <div style={{ flex: 1 }} />
            <TestMono size={10.5} color="var(--pl-ink-500)">
              {draft.placeholders.list.length} placeholder{draft.placeholders.list.length === 1 ? '' : 's'}
            </TestMono>
          </div>
          <div className="pft-region-body">
            <PlaceholderValuesRegion
              draft={draft}
              values={values}
              setValues={setValues}
              onResetToDefaults={() => setValues(initialValues)}
              isDirty={isDirty}
            />
          </div>
        </div>

        {/* RESIZER (left/center boundary) — only when center is expanded */}
        {!centerCollapsed && (
          <div className={`pft-resizer ${draggingResizer === 'left' ? 'dragging' : ''}`}
               onPointerDown={startResize('left')} />
        )}

        {/* CENTER — rendered prompt preview, collapsible + drag-resizable */}
        {centerCollapsed ? (
          <div className="pft-collapsed-strip" onClick={() => setCenterCollapsed(false)}>
            <span>rendered prompt ›</span>
          </div>
        ) : (
          <div className="pft-region" style={{ width: centerWidth, flex: `0 0 ${centerWidth}px` }}>
            <div className="pft-region-header">
              <TestMono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                rendered prompt
              </TestMono>
              <div style={{ flex: 1 }} />
              <button onClick={() => setCenterCollapsed(true)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--pl-mono)', fontSize: 12, color: 'var(--pl-ink-500)',
                padding: 0, lineHeight: 1,
              }} title="Collapse rendered prompt column">›</button>
            </div>
            <div className="pft-region-body">
              <RenderedPromptRegion draft={draft} values={values} />
            </div>
          </div>
        )}

        {/* RESIZER (center/right boundary) — only when center is expanded */}
        {!centerCollapsed && (
          <div className={`pft-resizer ${draggingResizer === 'right' ? 'dragging' : ''}`}
               onPointerDown={startResize('right')} />
        )}

        {/* RIGHT — output */}
        <div className="pft-region" style={{ flex: '1 1 0', minWidth: 280 }}>
          <div className="pft-region-header">
            <TestMono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>
              output
            </TestMono>
            <div style={{ flex: 1 }} />
            {activeRun && (
              <TestMono size={10.5} color="var(--pl-ink-500)">
                showing {activeRun.id}
              </TestMono>
            )}
          </div>
          <div className="pft-region-body">
            <OutputRegion run={requestChanged ? null : activeRun} runState={runState} runError={runError} />
          </div>
        </div>
      </div>

      {/* Run history strip */}
      <div style={{ position: 'relative' }}>
        <RunHistoryStrip
          executions={requestChanged ? [] : executions}
          activeId={activeRunId}
          setActiveId={setActiveRunId}
          requestChanged={requestChanged}
          onViewHistory={() => setHistoryOpen(o => !o)}
        />
        <HistoryFlyover open={historyOpen} onClose={() => setHistoryOpen(false)} items={SAMPLE_HISTORY} />
      </div>
    </div>
  );
}

window.PromptFormTestTab = TestTab;
