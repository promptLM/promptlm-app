// prompt-detail.jsx — Per-prompt detail page (linked to from §05 By group)
//
// One prompt at HEAD: full PromptSpec, every revision in its history,
// dev-execution metrics aggregated from executions[] captured during
// development (CLI runs, CI smoke tests). No production telemetry.
//
// Sections:
//   1. Header — name · group · current rev · model · status
//   2. Dev metrics — runs, p50/p95 latency, in/out tokens, last run
//   3. Spec — request, messages (rendered), placeholders, rules
//   4. Revision history — every release tag with mini-stats per rev
//   5. Recent dev executions — last 12 runs with author + outcome

// Mono is provided globally by product.jsx.

const SAMPLE_PROMPT = {
  name: 'doc-rag-answer',
  group: 'rag',
  version: '1.8.0',
  rev: 'r34',
  status: 'production',
  path: 'prompts/rag/doc-rag-answer.toml',
  description: 'Answer a user question grounded in retrieved doc chunks. Used by the help-center bot and the internal Q&A surface.',
  request: {
    vendor: 'openai',
    model: 'gpt-4.1',
    parameters: { temperature: 0.2, top_p: 1, max_tokens: 1024 },
  },
  placeholders: [
    { name: 'user_message',   type: 'string',         required: true,  example: 'What is the refund window?' },
    { name: 'context_chunks', type: 'list<chunk>',    required: true,  example: '6 retrieved chunks' },
    { name: 'policy',         type: 'string',         required: false, example: 'company-style.md' },
    { name: 'agent_name',     type: 'string',         required: false, example: 'Helpie' },
    { name: 'lang',           type: 'string',         required: false, example: 'en' },
    { name: 'now',            type: 'datetime',       required: false, example: '2025-01-14T09:11Z' },
  ],
  messages: [
    { role: 'system',    body: 'You are {{agent_name}}, a careful assistant that answers from the provided context only.' },
    { role: 'system',    body: '## Rules\n- Cite every claim with [doc-id:section].\n- Use up to 8 retrieved chunks.\n- When chunks contradict, prefer the most recent doc.\n- When the question is ambiguous, ask for clarification rather than guess.\n- Refuse if context is insufficient.' },
    { role: 'user',      body: '{{#each context_chunks}}\n[{{this.id}}:{{this.section}}]\n{{this.text}}\n{{/each}}\n\nQuestion: {{user_message}}' },
    { role: 'assistant', body: 'Use the citation format above. If you cannot answer, say so plainly.' },
  ],
  metrics: {
    // Aggregated from executions[] captured during dev/CI runs
    runs: 247,
    last_run: '3 min ago',
    latency_p50_ms: 1820,
    latency_p95_ms: 4310,
    tokens_in_avg: 4120,
    tokens_out_avg: 312,
    tokens_in_total: 1018640,
    tokens_out_total: 77064,
    success_rate: 0.987,
  },
  // Revision history — newest first. Each rev has its own little metric digest
  // computed from the executions[] entries that ran against THAT rev.
  history: [
    { rev: 'r34', tag: 'v1.8.0',  when: '3 min ago',   author: 'j.santos', sha: '3f7c2e1', kind: 'edit',  msg: 'expand to 8 chunks, add ambiguity rule', runs: 12,  p50: 1820, p95: 4310, tin: 4120, tout: 312, ok: 12 },
    { rev: 'r33', tag: 'v1.7.4',  when: '6 days ago',  author: 'j.santos', sha: '7e2ff',  kind: 'edit',  msg: 'add citation format rule',                runs: 38,  p50: 1640, p95: 3920, tin: 3120, tout: 298, ok: 37 },
    { rev: 'r32', tag: 'v1.7.3',  when: '2w ago',      author: 'j.santos', sha: '24bd1',  kind: 'edit',  msg: 'tighten refusal language',                runs: 41,  p50: 1620, p95: 3870, tin: 3104, tout: 264, ok: 41 },
    { rev: 'r31', tag: 'v1.7.2',  when: '3w ago',      author: 'l.kim',    sha: 'd99fa',  kind: 'edit',  msg: 'add language placeholder',                runs: 56,  p50: 1690, p95: 3990, tin: 3098, tout: 271, ok: 55 },
    { rev: 'r30', tag: 'v1.7.0',  when: '1mo ago',     author: 'j.santos', sha: '4ac21',  kind: 'edit',  msg: 'switch to gpt-4.1, raise max_tokens',     runs: 64,  p50: 1710, p95: 4040, tin: 3080, tout: 284, ok: 63 },
    { rev: 'r25', tag: 'v1.6.0',  when: '2mo ago',     author: 'm.holm',   sha: '0c731',  kind: 'edit',  msg: 'reword system message · add agent_name', runs: 22,  p50: 2210, p95: 5200, tin: 3040, tout: 305, ok: 22 },
    { rev: 'r1',  tag: 'v1.0.0',  when: '8mo ago',     author: 'j.santos', sha: '1a8e0',  kind: 'add',   msg: 'initial · grounded RAG answer',          runs: 14,  p50: 2480, p95: 6100, tin: 2860, tout: 344, ok: 13 },
  ],
  // Last 12 dev executions, newest first.
  executions: [
    { id: 'exec_4f9c', when: '3 min ago',  rev: 'r34', author: 'j.santos', context: 'CI · pre-merge',     ms: 1740, tin: 4120, tout: 287, ok: true,  fixture: 'fx/refund-window.json' },
    { id: 'exec_4f9b', when: '4 min ago',  rev: 'r34', author: 'j.santos', context: 'CI · pre-merge',     ms: 1980, tin: 4220, tout: 312, ok: true,  fixture: 'fx/contradicting-docs.json' },
    { id: 'exec_4f9a', when: '4 min ago',  rev: 'r34', author: 'j.santos', context: 'CI · pre-merge',     ms: 2100, tin: 4380, tout: 348, ok: true,  fixture: 'fx/ambiguous-question.json' },
    { id: 'exec_4f8c', when: '12 min ago', rev: 'r34', author: 'j.santos', context: 'local · promptlm run', ms: 1620, tin: 3980, tout: 264, ok: true,  fixture: 'fx/refund-window.json' },
    { id: 'exec_4f87', when: '14 min ago', rev: 'r34', author: 'j.santos', context: 'local · promptlm run', ms: 1840, tin: 4020, tout: 281, ok: true,  fixture: 'fx/no-context.json' },
    { id: 'exec_4f81', when: '32 min ago', rev: 'r34', author: 'j.santos', context: 'local · promptlm run', ms: 4310, tin: 4180, tout: 401, ok: true,  fixture: 'fx/long-doc.json' },
    { id: 'exec_4f7d', when: '1 hr ago',   rev: 'r34', author: 'j.santos', context: 'local · promptlm run', ms: 1690, tin: 4090, tout: 270, ok: true,  fixture: 'fx/refund-window.json' },
    { id: 'exec_4f72', when: '5 hr ago',   rev: 'r33', author: 's.weber',  context: 'CI · main',           ms: 1610, tin: 3120, tout: 290, ok: true,  fixture: 'fx/refund-window.json' },
    { id: 'exec_4f6e', when: '5 hr ago',   rev: 'r33', author: 's.weber',  context: 'CI · main',           ms: 1820, tin: 3220, tout: 312, ok: true,  fixture: 'fx/billing-q.json' },
    { id: 'exec_4f63', when: '8 hr ago',   rev: 'r33', author: 'a.nguyen', context: 'local · promptlm run', ms: 1540, tin: 3050, tout: 251, ok: true,  fixture: 'fx/refund-window.json' },
    { id: 'exec_4f58', when: '14 hr ago',  rev: 'r33', author: 'l.kim',    context: 'local · promptlm run', ms: 5240, tin: 3320, tout: 412, ok: false, fixture: 'fx/edge-case-empty.json', error: 'context is insufficient' },
    { id: 'exec_4f4a', when: '1 day ago',  rev: 'r33', author: 'j.santos', context: 'local · promptlm run', ms: 1610, tin: 3120, tout: 294, ok: true,  fixture: 'fx/refund-window.json' },
  ],
};

function PromptDetailPage() {
  const p = SAMPLE_PROMPT;
  return (
    <div style={{
      background: 'var(--pl-canvas)',
      fontFamily: 'var(--pl-display)',
      color: 'var(--pl-ink-900)',
      minHeight: '100%',
    }}>
      {/* ───────────────────── Document chrome ─────────── */}
      <div style={{
        borderBottom: '1px solid var(--pl-ink-200)',
        background: 'var(--pl-paper)',
        padding: '14px 56px',
        display: 'flex', alignItems: 'center', gap: 24,
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 22, height: 22, borderRadius: 5,
            background: 'var(--pl-ink-900)', color: 'var(--pl-paper)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--pl-mono)', fontSize: 11, fontWeight: 600,
          }}>
            <span>p</span><span style={{ color: 'var(--pl-signal)' }}>L</span><span>M</span>
          </span>
          <Mono size={11} color="var(--pl-ink-500)" style={{ letterSpacing: '0.06em' }}>
            promptlm report · github.com/acme/agents
          </Mono>
        </span>

        <span style={{ width: 1, height: 12, background: 'var(--pl-ink-300)' }} />
        {/* breadcrumb */}
        <Mono size={11} color="var(--pl-ink-500)">
          <a href="#groups" style={{ color: 'var(--pl-ink-500)', textDecoration: 'none' }}>catalog</a>
          {'  '}/{'  '}
          <span style={{ color: 'var(--pl-ink-500)' }}>{p.group}</span>
          {'  '}/{'  '}
          <span style={{ color: 'var(--pl-ink-900)' }}>{p.name}</span>
        </Mono>

        <div style={{ flex: 1 }} />
        <Mono size={11} color="var(--pl-ink-500)">{p.path}</Mono>
        <span style={{ width: 1, height: 12, background: 'var(--pl-ink-300)' }} />
        <a href="#diff" style={{
          fontFamily: 'var(--pl-mono)', fontSize: 11,
          color: 'var(--pl-signal-deep)', textDecoration: 'none',
          borderBottom: '1px dashed var(--pl-signal-deep)',
        }}>open in diff →</a>
      </div>

      {/* ───────────────────── Title block ─────────── */}
      <div style={{ padding: '40px 56px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Mono size={11} color="var(--pl-signal-deep)" style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500 }}>
            Prompt
          </Mono>
          <Mono size={11} color="var(--pl-ink-500)" style={{ letterSpacing: '0.06em' }}>
            group · {p.group}
          </Mono>
          <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
          <Mono size={11} color="var(--pl-ink-500)">at HEAD</Mono>
        </div>
        <h1 style={{
          margin: 0, fontFamily: 'var(--pl-display)',
          fontSize: 44, fontWeight: 500, letterSpacing: '-0.02em',
          lineHeight: 1.05, color: 'var(--pl-ink-900)',
        }}>
          {p.name}
        </h1>
        <p style={{
          margin: '14px 0 0', fontSize: 15.5, lineHeight: 1.55,
          color: 'var(--pl-ink-600)', maxWidth: 720,
        }}>
          {p.description}
        </p>

        {/* meta strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 22, flexWrap: 'wrap' }}>
          <MetaPill label="version" value={p.version} mono />
          <MetaPill label="rev" value={p.rev} mono />
          <MetaPill label="model" value={`${p.request.vendor}/${p.request.model}`} mono />
          <MetaPill label="status">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'oklch(0.55 0.13 155)' }} />
              <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 12, color: 'oklch(0.40 0.12 155)' }}>{p.status}</span>
            </span>
          </MetaPill>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          §01 Dev metrics
          ═════════════════════════════════════════════════════════════ */}
      <DetailSection num="01" title="Dev execution metrics" anchor="metrics">
        <p style={{ margin: '0 0 20px', fontSize: 13.5, lineHeight: 1.6, color: 'var(--pl-ink-700)', maxWidth: 720 }}>
          Aggregated across <Mono color="var(--pl-ink-900)">{p.metrics.runs}</Mono> dev runs —
          local <Mono color="var(--pl-ink-900)">promptlm run</Mono> invocations and CI smoke tests.
          No production traffic.
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1,
          background: 'var(--pl-ink-200)',
          border: '1px solid var(--pl-ink-200)', borderRadius: 10, overflow: 'hidden',
          marginBottom: 18,
        }}>
          <Stat label="Runs"           value={p.metrics.runs} sub="dev + CI" />
          <Stat label="Latency p50"    value={`${(p.metrics.latency_p50_ms/1000).toFixed(2)}s`} sub={`${p.metrics.latency_p50_ms}ms`} />
          <Stat label="Latency p95"    value={`${(p.metrics.latency_p95_ms/1000).toFixed(2)}s`} sub={`${p.metrics.latency_p95_ms}ms`} />
          <Stat label="Tokens in · avg" value={p.metrics.tokens_in_avg.toLocaleString()} sub={`${(p.metrics.tokens_in_total/1000).toFixed(0)}k total`} />
          <Stat label="Tokens out · avg" value={p.metrics.tokens_out_avg.toLocaleString()} sub={`${(p.metrics.tokens_out_total/1000).toFixed(0)}k total`} />
          <Stat label="Last run" value={p.metrics.last_run} sub="3f7c2e1 · CI" />
        </div>

        <Mono size={10.5} color="var(--pl-ink-500)" style={{ display: 'block' }}>
          ✱ Captured by promptlm during <Mono color="var(--pl-ink-700)">promptlm run</Mono> /
          <Mono color="var(--pl-ink-700)">promptlm test</Mono>. Stored alongside the spec, never sent anywhere.
        </Mono>
      </DetailSection>

      {/* ═════════════════════════════════════════════════════════════
          §02 Spec
          ═════════════════════════════════════════════════════════════ */}
      <DetailSection num="02" title="Spec" anchor="spec">
        {/* Request */}
        <SpecBlock title="request">
          <KV k="vendor" v={p.request.vendor} />
          <KV k="model" v={p.request.model} />
          <KV k="parameters.temperature" v={p.request.parameters.temperature} />
          <KV k="parameters.top_p" v={p.request.parameters.top_p} />
          <KV k="parameters.max_tokens" v={p.request.parameters.max_tokens} />
        </SpecBlock>

        {/* Placeholders */}
        <SpecBlock title={`placeholders · ${p.placeholders.length}`}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.5fr 1.5fr',
            padding: '8px 16px', background: 'var(--pl-canvas)',
            borderBottom: '1px solid var(--pl-ink-200)', gap: 12,
          }}>
            {['Variable', 'Type', 'Required', 'Example'].map(h => (
              <Mono key={h} size={9.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>{h}</Mono>
            ))}
          </div>
          {p.placeholders.map((ph, i) => (
            <div key={ph.name} style={{
              display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.5fr 1.5fr',
              alignItems: 'center', padding: '10px 16px', gap: 12,
              borderBottom: i === p.placeholders.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
            }}>
              <span style={{
                display: 'inline-block',
                background: 'oklch(0.95 0.05 240)',
                border: '1px solid oklch(0.85 0.08 240)',
                color: 'var(--pl-signal-deep)',
                padding: '2px 7px', borderRadius: 3,
                fontFamily: 'var(--pl-mono)', fontSize: 11.5,
                width: 'fit-content',
              }}>{`{{${ph.name}}}`}</span>
              <Mono size={11} color="var(--pl-ink-700)">{ph.type}</Mono>
              <Mono size={11} color={ph.required ? 'oklch(0.45 0.13 25)' : 'var(--pl-ink-500)'}>
                {ph.required ? 'required' : 'optional'}
              </Mono>
              <Mono size={11} color="var(--pl-ink-600)">{ph.example}</Mono>
            </div>
          ))}
        </SpecBlock>

        {/* Messages — rendered in chat-like style */}
        <SpecBlock title={`messages · ${p.messages.length}`}>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {p.messages.map((m, i) => (
              <MessageBlock key={i} role={m.role} body={m.body} />
            ))}
          </div>
        </SpecBlock>
      </DetailSection>

      {/* ═════════════════════════════════════════════════════════════
          §03 Revision history
          ═════════════════════════════════════════════════════════════ */}
      <DetailSection num="03" title="Revision history" anchor="history">
        <p style={{ margin: '0 0 20px', fontSize: 13.5, lineHeight: 1.6, color: 'var(--pl-ink-700)', maxWidth: 720 }}>
          Every revision of <Mono color="var(--pl-ink-900)">{p.name}</Mono>, newest first.
          Per-revision metrics are computed from the dev executions that ran against THAT
          revision — useful for spotting whether a spec change actually moved latency or token cost.
        </p>
        <RevisionHistory history={p.history} promptName={p.name} />
      </DetailSection>

      {/* ═════════════════════════════════════════════════════════════
          §04 Recent executions
          ═════════════════════════════════════════════════════════════ */}
      <DetailSection num="04" title="Recent dev executions" anchor="executions">
        <p style={{ margin: '0 0 20px', fontSize: 13.5, lineHeight: 1.6, color: 'var(--pl-ink-700)', maxWidth: 720 }}>
          Last <Mono color="var(--pl-ink-900)">{p.executions.length}</Mono> recorded runs.
          Captured by the CLI when developers run the prompt against a fixture; failures keep their
          error trail.
        </p>
        <ExecutionsTable rows={p.executions} />
      </DetailSection>

      {/* ───────────────────── Footer ─────────── */}
      <div style={{
        padding: '20px 56px', marginTop: 36,
        borderTop: '1px solid var(--pl-ink-200)',
        background: 'var(--pl-paper)',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <Mono size={11} color="var(--pl-ink-500)">
          spec at <span style={{ color: 'var(--pl-ink-800)' }}>{p.path}</span> · main · 3f7c2e1
        </Mono>
        <div style={{ flex: 1 }} />
        <Mono size={11} color="var(--pl-ink-500)">
          regenerated on every push to main · static page
        </Mono>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function MetaPill({ label, value, children, mono }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 8,
      padding: '5px 12px',
      border: '1px solid var(--pl-ink-200)',
      background: 'var(--pl-paper)',
      borderRadius: 999,
    }}>
      <Mono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>{label}</Mono>
      {children || (
        <span style={{
          fontFamily: mono ? 'var(--pl-mono)' : 'var(--pl-display)',
          fontSize: 12.5, color: 'var(--pl-ink-900)',
        }}>{value}</span>
      )}
    </span>
  );
}

function DetailSection({ num, title, anchor, children }) {
  return (
    <section id={anchor} style={{ padding: '32px 56px', borderTop: '1px solid var(--pl-ink-200)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 22 }}>
        <Mono size={11} color="var(--pl-signal-deep)" style={{ letterSpacing: '0.14em', fontWeight: 500 }}>§ {num}</Mono>
        <h3 style={{
          margin: 0, fontFamily: 'var(--pl-display)',
          fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em',
          color: 'var(--pl-ink-900)',
        }}>{title}</h3>
        <div style={{ flex: 1, height: 1, background: 'var(--pl-ink-200)' }} />
        <a href={`#${anchor}`} style={{
          fontFamily: 'var(--pl-mono)', fontSize: 11, color: 'var(--pl-ink-500)',
          textDecoration: 'none',
        }}>#</a>
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div style={{ background: 'var(--pl-paper)', padding: '16px 18px' }}>
      <Mono size={9.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</Mono>
      <div style={{
        fontFamily: 'var(--pl-mono)', fontSize: 22, fontWeight: 500,
        color: 'var(--pl-ink-900)', letterSpacing: '-0.01em',
        fontVariantNumeric: 'tabular-nums', marginTop: 6, lineHeight: 1.1,
      }}>{value}</div>
      <Mono size={10.5} color="var(--pl-ink-500)" style={{ display: 'block', marginTop: 5 }}>{sub}</Mono>
    </div>
  );
}

function SpecBlock({ title, children }) {
  return (
    <div style={{ marginBottom: 16, border: '1px solid var(--pl-ink-200)', borderRadius: 8, background: 'var(--pl-paper)', overflow: 'hidden' }}>
      <div style={{ padding: '8px 16px', background: 'var(--pl-canvas)', borderBottom: '1px solid var(--pl-ink-200)' }}>
        <Mono size={11} color="var(--pl-ink-700)" style={{ fontWeight: 500, letterSpacing: '0.04em' }}>{title}</Mono>
      </div>
      {children}
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '260px 1fr',
      padding: '8px 16px', alignItems: 'baseline',
      borderBottom: '1px solid var(--pl-ink-200)',
    }}>
      <Mono size={11.5} color="var(--pl-ink-700)">{k}</Mono>
      <Mono size={12} color="var(--pl-ink-900)">{String(v)}</Mono>
    </div>
  );
}

function MessageBlock({ role, body }) {
  const tones = {
    system:    { bg: 'var(--pl-ink-100)',     bd: 'var(--pl-ink-200)', col: 'var(--pl-ink-700)' },
    user:      { bg: 'oklch(0.97 0.03 240)',  bd: 'oklch(0.86 0.04 240)', col: 'var(--pl-signal-deep)' },
    assistant: { bg: 'oklch(0.97 0.03 30)',   bd: 'oklch(0.86 0.04 30)',  col: 'oklch(0.45 0.13 30)' },
  };
  const s = tones[role] || tones.system;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 14, alignItems: 'flex-start' }}>
      <span style={{
        padding: '3px 8px',
        background: s.bg, border: `1px solid ${s.bd}`, color: s.col,
        fontFamily: 'var(--pl-mono)', fontSize: 10.5, letterSpacing: '0.10em',
        textTransform: 'uppercase', borderRadius: 4, fontWeight: 500,
        textAlign: 'center', marginTop: 2,
      }}>{role}</span>
      <pre style={{
        margin: 0, padding: '8px 12px',
        background: 'var(--pl-canvas)',
        border: '1px solid var(--pl-ink-200)',
        borderRadius: 5,
        fontFamily: 'var(--pl-mono)', fontSize: 12, lineHeight: 1.55,
        color: 'var(--pl-ink-800)',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>{body}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Revision history rail
// ─────────────────────────────────────────────────────────────
function RevisionHistory({ history, promptName }) {
  // Compute relative widths for the latency / token bars
  const maxP95 = Math.max(...history.map(r => r.p95));
  const maxTin = Math.max(...history.map(r => r.tin));
  const maxTout = Math.max(...history.map(r => r.tout));

  return (
    <div style={{ border: '1px solid var(--pl-ink-200)', borderRadius: 10, overflow: 'hidden', background: 'var(--pl-paper)' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '0.5fr 0.7fr 1.4fr 1.6fr 0.9fr 0.9fr 0.9fr 0.7fr',
        padding: '10px 18px', background: 'var(--pl-canvas)',
        borderBottom: '1px solid var(--pl-ink-200)', gap: 14,
      }}>
        {['Rev', 'Tag', 'Author · sha', 'Message', 'Runs', 'p50 / p95', 'Tokens in/out', 'Diff'].map((h) => (
          <Mono key={h} size={9.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>{h}</Mono>
        ))}
      </div>
      {history.map((r, i) => (
        <div key={r.rev} style={{
          display: 'grid', gridTemplateColumns: '0.5fr 0.7fr 1.4fr 1.6fr 0.9fr 0.9fr 0.9fr 0.7fr',
          alignItems: 'center', padding: '12px 18px', gap: 14,
          borderBottom: i === history.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
          background: i === 0 ? 'oklch(0.99 0.02 240)' : 'transparent',
        }}>
          {/* rev */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i === 0 && (
              <span style={{
                width: 5, height: 5, borderRadius: 999,
                background: 'var(--pl-signal-deep)',
                boxShadow: '0 0 0 3px oklch(0.94 0.06 240)',
              }} />
            )}
            <Mono size={12} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>{r.rev}</Mono>
          </span>
          {/* tag */}
          <Mono size={11} color="var(--pl-ink-700)">{r.tag}</Mono>
          {/* author + sha */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mono size={11} color="var(--pl-ink-700)">{r.author}</Mono>
            <span style={{ width: 1, height: 9, background: 'var(--pl-ink-300)' }} />
            <Mono size={11} color="var(--pl-ink-500)">{r.sha}</Mono>
            <span style={{ width: 1, height: 9, background: 'var(--pl-ink-300)' }} />
            <Mono size={10.5} color="var(--pl-ink-500)">{r.when}</Mono>
          </span>
          {/* message */}
          <span style={{ fontSize: 13, color: 'var(--pl-ink-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {r.msg}
          </span>
          {/* runs · ok ratio */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Mono size={11.5} color="var(--pl-ink-900)" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{r.runs}</Mono>
            <Mono size={10} color={r.ok === r.runs ? 'oklch(0.45 0.12 155)' : 'oklch(0.50 0.13 25)'}>
              {r.ok === r.runs ? '✓ all' : `${r.ok}/${r.runs} ok`}
            </Mono>
          </span>
          {/* p50 / p95 — bar + numbers */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ flex: 1, height: 5, borderRadius: 999, background: 'var(--pl-ink-100)', overflow: 'hidden', position: 'relative' }}>
              <span style={{ position: 'absolute', inset: 0, width: `${(r.p95 / maxP95) * 100}%`, background: 'oklch(0.86 0.04 240)' }} />
              <span style={{ position: 'absolute', inset: 0, width: `${(r.p50 / maxP95) * 100}%`, background: 'var(--pl-signal-deep)' }} />
            </span>
            <Mono size={10.5} color="var(--pl-ink-700)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {(r.p50/1000).toFixed(2)}/{(r.p95/1000).toFixed(2)}s
            </Mono>
          </span>
          {/* tokens in/out — stacked tiny bars */}
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Mono size={9} color="var(--pl-ink-500)" style={{ width: 14 }}>in</Mono>
              <span style={{ flex: 1, height: 4, borderRadius: 999, background: 'var(--pl-ink-100)' }}>
                <span style={{ display: 'block', height: '100%', width: `${(r.tin/maxTin)*100}%`, background: 'oklch(0.55 0.13 30)', borderRadius: 999 }} />
              </span>
              <Mono size={10} color="var(--pl-ink-700)" style={{ fontVariantNumeric: 'tabular-nums', width: 36, textAlign: 'right' }}>{r.tin}</Mono>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Mono size={9} color="var(--pl-ink-500)" style={{ width: 14 }}>out</Mono>
              <span style={{ flex: 1, height: 4, borderRadius: 999, background: 'var(--pl-ink-100)' }}>
                <span style={{ display: 'block', height: '100%', width: `${(r.tout/maxTout)*100}%`, background: 'oklch(0.55 0.13 75)', borderRadius: 999 }} />
              </span>
              <Mono size={10} color="var(--pl-ink-700)" style={{ fontVariantNumeric: 'tabular-nums', width: 36, textAlign: 'right' }}>{r.tout}</Mono>
            </span>
          </span>
          {/* diff link */}
          <span style={{ textAlign: 'right' }}>
            {i < history.length - 1 ? (
              <a
                href="#diff"
                onClick={(e) => {
                  // Hand off to the diff artboard with prefilled selection
                  if (window.__setDiffSelection) {
                    e.preventDefault();
                    window.__setDiffSelection({ promptA: promptName, revA: history[i+1].rev, promptB: promptName, revB: r.rev });
                  }
                }}
                style={{
                  fontFamily: 'var(--pl-mono)', fontSize: 11,
                  color: 'var(--pl-signal-deep)', textDecoration: 'none',
                  borderBottom: '1px dashed var(--pl-signal-deep)',
                }}
              >
                vs {history[i+1].rev}
              </a>
            ) : (
              <Mono size={10} color="var(--pl-ink-400)">—</Mono>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Recent executions table
// ─────────────────────────────────────────────────────────────
function ExecutionsTable({ rows }) {
  return (
    <div style={{ border: '1px solid var(--pl-ink-200)', borderRadius: 10, overflow: 'hidden', background: 'var(--pl-paper)' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '0.9fr 0.5fr 0.7fr 0.9fr 1.4fr 0.7fr 0.7fr 0.6fr 1.2fr',
        padding: '10px 18px', background: 'var(--pl-canvas)',
        borderBottom: '1px solid var(--pl-ink-200)', gap: 12,
      }}>
        {['When', 'Rev', 'Author', 'Context', 'Fixture', 'Latency', 'Tokens in', 'Tokens out', 'Outcome'].map((h) => (
          <Mono key={h} size={9.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>{h}</Mono>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={r.id} style={{
          display: 'grid', gridTemplateColumns: '0.9fr 0.5fr 0.7fr 0.9fr 1.4fr 0.7fr 0.7fr 0.6fr 1.2fr',
          alignItems: 'center', padding: '10px 18px', gap: 12,
          borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
        }}>
          <Mono size={11} color="var(--pl-ink-700)">{r.when}</Mono>
          <Mono size={11} color="var(--pl-ink-500)">{r.rev}</Mono>
          <Mono size={11} color="var(--pl-ink-700)">{r.author}</Mono>
          <Mono size={10.5} color="var(--pl-ink-600)">{r.context}</Mono>
          <Mono size={10.5} color="var(--pl-ink-700)" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.fixture}</Mono>
          <Mono size={11} color={r.ms > 4000 ? 'oklch(0.50 0.13 25)' : 'var(--pl-ink-800)'} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {(r.ms/1000).toFixed(2)}s
          </Mono>
          <Mono size={11} color="var(--pl-ink-800)" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.tin.toLocaleString()}</Mono>
          <Mono size={11} color="var(--pl-ink-800)" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.tout.toLocaleString()}</Mono>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 6, height: 6, borderRadius: 999,
              background: r.ok ? 'oklch(0.55 0.13 155)' : 'oklch(0.55 0.15 25)',
            }} />
            <Mono size={10.5} color={r.ok ? 'oklch(0.40 0.12 155)' : 'oklch(0.45 0.13 25)'}>
              {r.ok ? 'ok' : (r.error || 'failed')}
            </Mono>
          </span>
        </div>
      ))}
    </div>
  );
}

window.PromptDetailPage = PromptDetailPage;
window.SAMPLE_PROMPT = SAMPLE_PROMPT;
