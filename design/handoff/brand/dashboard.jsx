// dashboard.jsx — promptLM Dashboard, activity-first (Direction B)
//
// Corpus is small. The most useful question on landing is:
//   "What changed since I last looked, and what should I do next?"
//
// Spine: chronological activity feed (revisions + runs), centered.
// Left rail: small corpus shape (groups + counts) — the navigation surface.
// Right rail: today's open work — drafts, blocked releases, prompts with no test runs.
//
// No fake observability — only data we actually capture (durations, tokens,
// commit history, executions[]). Slate + cyan + mono vocabulary, hairline
// borders, density matched to the catalog and report pages.

const DASH_FONT = `var(--pl-display)`;
const DASH_MONO = `var(--pl-mono)`;

// ── Sample data — believable promptLM corpus shape ──────────
const DASH_GROUPS = [
  { id: 'support', label: 'support',     count: 4,  active: 4 },
  { id: 'rag',     label: 'rag',         count: 6,  active: 5 },
  { id: 'agents',  label: 'agents',      count: 3,  active: 3 },
  { id: 'data',    label: 'data',        count: 2,  active: 1 },
  { id: 'content', label: 'content',     count: 4,  active: 4 },
  { id: 'eval',    label: 'eval',        count: 1,  active: 0 },
];

const DASH_FEED = [
  {
    kind: 'release', when: '14m', author: 'jamie',
    prompt: 'doc-rag-answer', group: 'rag',
    from: 'v1.7.4', to: 'v1.8.0',
    summary: '3 messages changed · 1 placeholder added',
    sha: '4f31a08',
  },
  {
    kind: 'run', when: '21m', author: 'jamie',
    prompt: 'doc-rag-answer', group: 'rag',
    revision: 'r34', status: 'ok',
    durationMs: 142, tokensIn: 312, tokensOut: 100,
  },
  {
    kind: 'run', when: '24m', author: 'jamie',
    prompt: 'doc-rag-answer', group: 'rag',
    revision: 'r34', status: 'ok',
    durationMs: 161, tokensIn: 298, tokensOut: 92,
  },
  {
    kind: 'draft', when: '1h', author: 'maya',
    prompt: 'mcp-tool-router', group: 'agents',
    summary: 'opened a draft on r9 — not yet tested',
  },
  {
    kind: 'release', when: '3h', author: 'sam',
    prompt: 'support-triage-classifier', group: 'support',
    from: 'v2.4.0', to: 'v2.4.1',
    summary: '1 parameter tweak (temperature 0.2 → 0.15)',
    sha: 'e2c8b14',
  },
  {
    kind: 'run', when: '3h', author: 'sam',
    prompt: 'support-triage-classifier', group: 'support',
    revision: 'r17', status: 'ok',
    durationMs: 612, tokensIn: 540, tokensOut: 84,
  },
  {
    kind: 'create', when: '6h', author: 'maya',
    prompt: 'release-notes-summariser', group: 'content',
    summary: 'created · group=content',
  },
  {
    kind: 'run', when: '8h', author: 'jamie',
    prompt: 'sql-query-generator', group: 'data',
    revision: 'r24', status: 'fail',
    durationMs: 2210, tokensIn: 1840, tokensOut: 0,
    error: 'tool_call rejected by mock — schema mismatch on `users`',
  },
  {
    kind: 'release', when: 'yesterday', author: 'jamie',
    prompt: 'mcp-tool-router', group: 'agents',
    from: 'v0.9.2', to: 'v0.9.3',
    summary: '2 messages changed · model snapshot bumped',
    sha: '78aa3e1',
  },
  {
    kind: 'create', when: 'yesterday', author: 'sam',
    prompt: 'eval-rubric-grader', group: 'eval',
    summary: 'created · group=eval · retired (Pro)',
    retired: true,
  },
];

const DASH_OPEN_WORK = [
  {
    kind: 'draft',
    prompt: 'mcp-tool-router',
    note: 'Draft open by maya · no test runs yet',
    cta: 'Open in editor',
  },
  {
    kind: 'untested',
    prompt: 'release-notes-summariser',
    note: 'Created 6h ago · never run',
    cta: 'Run once',
  },
  {
    kind: 'failing',
    prompt: 'sql-query-generator',
    note: 'Last run failed · schema mismatch on `users`',
    cta: 'View execution',
  },
];

// Tiny corpus stats — no fake observability.
const DASH_STATS = {
  total: 20,
  active: 17,
  retired: 3,
  groups: DASH_GROUPS.length,
  lastReleaseAt: '14m ago',
  lastReleaseRef: 'doc-rag-answer · v1.8.0',
};

// ── Atoms ────────────────────────────────────────────────────
const DashMono = ({ children, style, size = 12, color = 'var(--pl-ink-700)' }) => (
  <span style={{ fontFamily: DASH_MONO, fontSize: size, color, letterSpacing: '-0.005em', ...style }}>{children}</span>
);

const DashEyebrow = ({ children, style }) => (
  <span style={{
    fontFamily: DASH_MONO, fontSize: 10.5, fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: '0.14em',
    color: 'var(--pl-ink-500)', ...style,
  }}>{children}</span>
);

// ── Activity row — the workhorse ─────────────────────────────
function ActivityRow({ item }) {
  const dot = (() => {
    switch (item.kind) {
      case 'release': return { glyph: '◆', color: 'var(--pl-signal-deep)' };
      case 'run':     return { glyph: item.status === 'fail' ? '✕' : '▷', color: item.status === 'fail' ? 'var(--pl-fail)' : 'var(--pl-ink-700)' };
      case 'draft':   return { glyph: '◐', color: 'var(--pl-ink-600)' };
      case 'create':  return { glyph: '+', color: 'var(--pl-ink-600)' };
      default:        return { glyph: '·', color: 'var(--pl-ink-500)' };
    }
  })();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '64px 18px 1fr auto',
      alignItems: 'baseline',
      gap: 14,
      padding: '14px 0',
      borderTop: '1px solid var(--pl-ink-200)',
    }}>
      {/* When */}
      <DashMono size={11.5} color="var(--pl-ink-500)" style={{ textAlign: 'right' }}>{item.when}</DashMono>

      {/* Kind glyph */}
      <span style={{
        fontFamily: DASH_MONO, fontSize: 12, color: dot.color, lineHeight: 1,
        display: 'inline-flex', justifyContent: 'center',
      }}>{dot.glyph}</span>

      {/* Body */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <DashMono size={13.5} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>{item.prompt}</DashMono>
          <DashMono size={11.5} color="var(--pl-ink-500)">{item.group}</DashMono>
          {item.kind === 'release' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <DashMono size={11.5} color="var(--pl-ink-500)">{item.from}</DashMono>
              <span style={{ color: 'var(--pl-ink-400)', fontSize: 11 }}>→</span>
              <DashMono size={11.5} color="var(--pl-signal-deep)" style={{ fontWeight: 500 }}>{item.to}</DashMono>
            </span>
          )}
          {item.kind === 'run' && (
            <DashMono size={11.5} color="var(--pl-ink-500)">{item.revision}</DashMono>
          )}
          {item.retired && (
            <DashMono size={10.5} color="var(--pl-ink-600)" style={{
              textTransform: 'uppercase', letterSpacing: '0.1em',
              border: '1px solid var(--pl-ink-300)', padding: '1px 5px', borderRadius: 3,
            }}>retired</DashMono>
          )}
        </div>
        <div style={{ marginTop: 4, fontSize: 13, color: 'var(--pl-ink-700)', lineHeight: 1.5 }}>
          {item.kind === 'run' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
              <span><DashMono color="var(--pl-ink-700)">{item.durationMs}ms</DashMono> <span style={{ color: 'var(--pl-ink-500)' }}>·</span> <DashMono color="var(--pl-ink-700)">{item.tokensIn}→{item.tokensOut} tok</DashMono></span>
              {item.error && <span style={{ color: 'var(--pl-fail)' }}>{item.error}</span>}
            </span>
          )}
          {item.kind !== 'run' && <span>{item.summary}</span>}
        </div>
      </div>

      {/* Author + sha */}
      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <DashMono size={11.5} color="var(--pl-ink-700)">{item.author}</DashMono>
        {item.sha && <DashMono size={10.5} color="var(--pl-ink-500)">{item.sha}</DashMono>}
      </div>
    </div>
  );
}

// ── Group rail item ──────────────────────────────────────────
function GroupRow({ group, total }) {
  const pct = group.count / total;
  return (
    <button style={{
      display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 10,
      padding: '8px 10px', borderRadius: 6,
      background: 'transparent', border: '1px solid transparent',
      cursor: 'pointer', textAlign: 'left',
      width: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <DashMono size={13} color="var(--pl-ink-800)" style={{ fontWeight: 500 }}>{group.label}</DashMono>
        {group.count !== group.active && (
          <DashMono size={10.5} color="var(--pl-ink-500)">{group.active}/{group.count}</DashMono>
        )}
      </div>
      {/* Count + tiny bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 56, height: 4, background: 'var(--pl-ink-200)', borderRadius: 2, position: 'relative', overflow: 'hidden',
        }}>
          <span style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${Math.max(8, pct * 100)}%`,
            background: 'var(--pl-signal-deep)', opacity: 0.85,
          }} />
        </span>
        <DashMono size={11.5} color="var(--pl-ink-700)" style={{ minWidth: 16, textAlign: 'right' }}>{group.count}</DashMono>
      </div>
    </button>
  );
}

// ── Open work card ───────────────────────────────────────────
function OpenWorkRow({ item }) {
  const tone = (() => {
    switch (item.kind) {
      case 'failing':  return { glyph: '✕', color: 'var(--pl-fail)' };
      case 'draft':    return { glyph: '◐', color: 'var(--pl-ink-600)' };
      case 'untested': return { glyph: '?', color: 'var(--pl-ink-600)' };
      default:         return { glyph: '·', color: 'var(--pl-ink-500)' };
    }
  })();
  return (
    <div style={{ padding: '12px 0', borderTop: '1px solid var(--pl-ink-200)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: DASH_MONO, fontSize: 12, color: tone.color, width: 14 }}>{tone.glyph}</span>
        <DashMono size={13} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>{item.prompt}</DashMono>
      </div>
      <div style={{ marginLeft: 22, marginTop: 4, fontSize: 12.5, color: 'var(--pl-ink-700)', lineHeight: 1.5 }}>
        {item.note}
      </div>
      <div style={{ marginLeft: 22, marginTop: 6 }}>
        <button style={{
          fontFamily: DASH_FONT, fontSize: 12.5, padding: 0,
          background: 'transparent', border: 'none',
          color: 'var(--pl-signal-deep)', cursor: 'pointer',
          borderBottom: '1px solid var(--pl-signal-deep)',
        }}>{item.cta} →</button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
function PromptDashboard() {
  const totalCount = DASH_GROUPS.reduce((s, g) => s + g.count, 0);

  return (
    <AppChrome active="dashboard">
      {/* Topbar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 28px',
        borderBottom: '1px solid var(--pl-ink-200)',
        background: 'var(--pl-paper)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <DashMono size={12.5} color="var(--pl-ink-600)">acme/agents</DashMono>
          <span style={{ color: 'var(--pl-ink-300)' }}>/</span>
          <DashMono size={12.5} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>dashboard</DashMono>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={{
            fontFamily: DASH_FONT, fontSize: 13, padding: '7px 12px',
            background: 'var(--pl-paper)', border: '1px solid var(--pl-ink-300)',
            borderRadius: 7, color: 'var(--pl-ink-800)', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <DashMono size={11} color="var(--pl-ink-500)">⌘K</DashMono>
            <span style={{ color: 'var(--pl-ink-600)' }}>Search prompts…</span>
          </button>
          <button style={{
            fontFamily: DASH_FONT, fontSize: 13, padding: '7px 14px',
            background: 'var(--pl-ink-900)', color: 'var(--pl-paper)',
            border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 500,
          }}>+ New prompt</button>
        </div>
      </header>

      {/* Body */}
      <main style={{
        padding: '28px 28px 60px',
        background: 'var(--pl-canvas)',
        flex: 1, minHeight: 0,
      }}>
        {/* Page heading */}
        <div style={{ marginBottom: 26 }}>
          <DashEyebrow>repo overview</DashEyebrow>
          <h1 style={{
            margin: '4px 0 6px', fontFamily: DASH_FONT,
            fontSize: 30, fontWeight: 500, letterSpacing: '-0.02em',
            color: 'var(--pl-ink-900)',
          }}>What changed</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--pl-ink-600)', lineHeight: 1.55, maxWidth: 720 }}>
            <DashMono size={13} color="var(--pl-ink-700)">{DASH_STATS.total}</DashMono> prompts across{' '}
            <DashMono size={13} color="var(--pl-ink-700)">{DASH_STATS.groups}</DashMono> groups.
            Last release{' '}
            <DashMono size={13} color="var(--pl-signal-deep)">{DASH_STATS.lastReleaseAt}</DashMono>{' '}
            — <DashMono size={13} color="var(--pl-ink-700)">{DASH_STATS.lastReleaseRef}</DashMono>.
          </p>
        </div>

        {/* Three-column layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '220px minmax(0, 1fr) 280px',
          gap: 36,
          alignItems: 'start',
        }}>
          {/* Left rail — corpus shape */}
          <aside style={{ position: 'sticky', top: 28 }}>
            <DashEyebrow>groups</DashEyebrow>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {DASH_GROUPS.map(g => <GroupRow key={g.id} group={g} total={totalCount} />)}
            </div>

            <div style={{ height: 1, background: 'var(--pl-ink-200)', margin: '20px 0' }} />

            <DashEyebrow>corpus</DashEyebrow>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--pl-ink-700)' }}>active</span>
                <DashMono size={13} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>{DASH_STATS.active}</DashMono>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--pl-ink-700)' }}>retired</span>
                <DashMono size={13} color="var(--pl-ink-600)">{DASH_STATS.retired}</DashMono>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--pl-ink-700)' }}>total</span>
                <DashMono size={13} color="var(--pl-ink-700)">{DASH_STATS.total}</DashMono>
              </div>
            </div>
          </aside>

          {/* Center — activity feed */}
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <DashEyebrow>activity · last 24h</DashEyebrow>
              <div style={{ display: 'flex', gap: 14, fontSize: 12.5 }}>
                <button style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--pl-ink-900)', fontWeight: 500, cursor: 'pointer', borderBottom: '1px solid var(--pl-ink-900)' }}>all</button>
                <button style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--pl-ink-500)', cursor: 'pointer' }}>releases</button>
                <button style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--pl-ink-500)', cursor: 'pointer' }}>runs</button>
                <button style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--pl-ink-500)', cursor: 'pointer' }}>drafts</button>
              </div>
            </div>
            <div>
              {DASH_FEED.map((it, i) => <ActivityRow key={i} item={it} />)}
              <div style={{ borderTop: '1px solid var(--pl-ink-200)', padding: '14px 0', textAlign: 'center' }}>
                <button style={{
                  background: 'transparent', border: 'none', padding: 0,
                  fontFamily: DASH_FONT, fontSize: 12.5, color: 'var(--pl-ink-600)',
                  cursor: 'pointer',
                }}>View older activity →</button>
              </div>
            </div>
          </section>

          {/* Right rail — open work */}
          <aside style={{ position: 'sticky', top: 28 }}>
            <DashEyebrow>open work</DashEyebrow>
            <p style={{ margin: '6px 0 4px', fontSize: 12.5, color: 'var(--pl-ink-600)', lineHeight: 1.5 }}>
              Things you (or your team) probably want to finish.
            </p>
            <div>
              {DASH_OPEN_WORK.map((it, i) => <OpenWorkRow key={i} item={it} />)}
            </div>

            <div style={{ height: 1, background: 'var(--pl-ink-200)', margin: '20px 0' }} />

            <DashEyebrow>quick actions</DashEyebrow>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Diff two revisions', kbd: 'D' },
                { label: 'Open last execution', kbd: 'E' },
                { label: 'Run promptlm report', kbd: 'R' },
              ].map((a, i) => (
                <button key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '8px 10px',
                  background: 'transparent', border: '1px solid var(--pl-ink-200)',
                  borderRadius: 6, cursor: 'pointer', fontFamily: DASH_FONT,
                  fontSize: 12.5, color: 'var(--pl-ink-800)', textAlign: 'left',
                }}>
                  <span>{a.label}</span>
                  <DashMono size={10.5} color="var(--pl-ink-500)" style={{
                    border: '1px solid var(--pl-ink-300)', padding: '1px 5px', borderRadius: 3,
                  }}>{a.kbd}</DashMono>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </AppChrome>
  );
}

window.PromptDashboard = PromptDashboard;
