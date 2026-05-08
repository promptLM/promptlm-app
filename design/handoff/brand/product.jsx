// product.jsx — promptLM product UI screens
// Two artboards:
//   1. Prompt Catalog — grid/list of PromptSpec records with filters, search, group facets
//   2. Prompt Detail  — single prompt: messages, placeholders, request config, executions, evaluations
//
// Designed against the real schema in promptlm-app/components/promptlm-web-ui:
//   PromptSpec { id, name, group, description, version, revision, repositoryUrl,
//                request: { type, vendor, model, url, parameters, modelSnapshot },
//                messages, placeholders, evaluation, executions[] }
//
// Style: cool slate ink + electric signal, Geist + JetBrains Mono, generous whitespace,
// editorial density. Hairline borders. Mono used for IDs, model names, numerics, code.

const PRODUCT_FONT = `var(--pl-display)`;
const PRODUCT_MONO = `var(--pl-mono)`;

// ─────────────────────────────────────────────────────────────
// Sample data — believable promptLM corpus
// ─────────────────────────────────────────────────────────────
const SAMPLE_PROMPTS = [
  {
    id: 'prm_8f3a',
    name: 'support-triage-classifier',
    group: 'support',
    description: 'Classify inbound support tickets into priority + topic. Used by the routing pipeline.',
    version: '2.4.1',
    revision: 17,
    vendor: 'anthropic',
    model: 'claude-sonnet-4-5',
    type: 'chat',
    placeholders: 4,
    messages: 3,
    evaluation: 'enabled',
    executions: 1240,
    successRate: 0.984,
    avgLatencyMs: 612,
    p95LatencyMs: 1180,
    avgTokens: 824,
    updatedAt: '2 hrs ago',
    status: 'production',
    tags: ['classifier', 'routing'],
  },
  {
    id: 'prm_2d91',
    name: 'doc-rag-answer',
    group: 'rag',
    description: 'Answer questions over a doc corpus with citations. Strict refusal when context is insufficient.',
    version: '1.8.0',
    revision: 33,
    vendor: 'openai',
    model: 'gpt-4.1',
    type: 'chat',
    placeholders: 6,
    messages: 4,
    evaluation: 'enabled',
    executions: 8420,
    successRate: 0.961,
    avgLatencyMs: 1840,
    p95LatencyMs: 3200,
    avgTokens: 2150,
    updatedAt: '5 hrs ago',
    status: 'production',
    tags: ['rag', 'citations'],
  },
  {
    id: 'prm_a47c',
    name: 'mcp-tool-router',
    group: 'agents',
    description: 'Decide which MCP tool to invoke given user intent + available tool catalog.',
    version: '0.9.3',
    revision: 8,
    vendor: 'anthropic',
    model: 'claude-haiku-4-5',
    type: 'chat',
    placeholders: 3,
    messages: 2,
    evaluation: 'enabled',
    executions: 22106,
    successRate: 0.992,
    avgLatencyMs: 380,
    p95LatencyMs: 720,
    avgTokens: 1420,
    updatedAt: 'just now',
    status: 'production',
    tags: ['mcp', 'router'],
  },
  {
    id: 'prm_5e22',
    name: 'sql-query-generator',
    group: 'data',
    description: 'Generate parameterised SQL from a natural-language question and a schema snapshot.',
    version: '3.1.0',
    revision: 24,
    vendor: 'openai',
    model: 'gpt-4.1',
    type: 'chat',
    placeholders: 5,
    messages: 3,
    evaluation: 'enabled',
    executions: 612,
    successRate: 0.94,
    avgLatencyMs: 2210,
    p95LatencyMs: 4100,
    avgTokens: 1840,
    updatedAt: 'yesterday',
    status: 'staging',
    tags: ['sql', 'codegen'],
  },
  {
    id: 'prm_b910',
    name: 'release-notes-summariser',
    group: 'content',
    description: 'Turn a list of merged PRs into customer-ready release notes, grouped by theme.',
    version: '1.2.4',
    revision: 11,
    vendor: 'anthropic',
    model: 'claude-sonnet-4-5',
    type: 'chat',
    placeholders: 2,
    messages: 2,
    evaluation: 'disabled',
    executions: 84,
    successRate: 0.988,
    avgLatencyMs: 3120,
    p95LatencyMs: 4800,
    avgTokens: 3640,
    updatedAt: '3 days ago',
    status: 'production',
    tags: ['summarise'],
  },
  {
    id: 'prm_c731',
    name: 'pii-redactor',
    group: 'safety',
    description: 'Detect and redact PII from free-form text before logging or downstream LLM calls.',
    version: '2.0.0',
    revision: 41,
    vendor: 'anthropic',
    model: 'claude-haiku-4-5',
    type: 'chat',
    placeholders: 1,
    messages: 2,
    evaluation: 'enabled',
    executions: 51820,
    successRate: 0.999,
    avgLatencyMs: 240,
    p95LatencyMs: 410,
    avgTokens: 480,
    updatedAt: '6 hrs ago',
    status: 'production',
    tags: ['safety', 'pii'],
  },
  {
    id: 'prm_d052',
    name: 'eval-judge-rubric',
    group: 'evals',
    description: 'LLM-as-judge that scores model outputs against a rubric and returns structured feedback.',
    version: '0.4.1',
    revision: 6,
    vendor: 'openai',
    model: 'gpt-4.1-mini',
    type: 'chat',
    placeholders: 4,
    messages: 3,
    evaluation: 'enabled',
    executions: 320,
    successRate: 0.972,
    avgLatencyMs: 980,
    p95LatencyMs: 1650,
    avgTokens: 1240,
    updatedAt: '1 day ago',
    status: 'experimental',
    tags: ['eval', 'judge'],
  },
  {
    id: 'prm_e483',
    name: 'onboarding-copy-rewriter',
    group: 'content',
    description: 'Rewrite onboarding copy for a target persona while preserving every CTA and link.',
    version: '0.2.0',
    revision: 3,
    vendor: 'anthropic',
    model: 'claude-sonnet-4-5',
    type: 'chat',
    placeholders: 3,
    messages: 2,
    evaluation: 'disabled',
    executions: 12,
    successRate: 0.917,
    avgLatencyMs: 2840,
    p95LatencyMs: 3900,
    avgTokens: 2120,
    updatedAt: '4 days ago',
    status: 'experimental',
    tags: ['copy', 'a/b'],
  },
  {
    id: 'prm_f127',
    name: 'code-review-feedback',
    group: 'engineering',
    description: 'Produce inline review comments on a diff, scoped by file. Cites line numbers.',
    version: '1.5.2',
    revision: 19,
    vendor: 'anthropic',
    model: 'claude-sonnet-4-5',
    type: 'chat',
    placeholders: 4,
    messages: 3,
    evaluation: 'enabled',
    executions: 940,
    successRate: 0.953,
    avgLatencyMs: 4200,
    p95LatencyMs: 7100,
    avgTokens: 5840,
    updatedAt: '11 hrs ago',
    status: 'production',
    tags: ['review', 'diff'],
  },
];

const GROUPS = [
  { id: 'all',         label: 'All prompts',  count: SAMPLE_PROMPTS.length },
  { id: 'support',     label: 'Support',      count: 1 },
  { id: 'rag',         label: 'RAG',          count: 1 },
  { id: 'agents',      label: 'Agents',       count: 1 },
  { id: 'data',        label: 'Data',         count: 1 },
  { id: 'content',     label: 'Content',      count: 2 },
  { id: 'safety',      label: 'Safety',       count: 1 },
  { id: 'evals',       label: 'Evals',        count: 1 },
  { id: 'engineering', label: 'Engineering',  count: 1 },
];

const VENDORS = [
  { id: 'anthropic', label: 'Anthropic', count: 6 },
  { id: 'openai',    label: 'OpenAI',    count: 3 },
];

// ─────────────────────────────────────────────────────────────
// Tiny atoms — built on the existing token system
// ─────────────────────────────────────────────────────────────
const Mono = ({ children, style, size = 12, color = 'var(--pl-ink-700)' }) => (
  <span style={{ fontFamily: PRODUCT_MONO, fontSize: size, color, letterSpacing: '-0.005em', ...style }}>{children}</span>
);

function StatusDot({ status }) {
  const map = {
    production:   { c: 'var(--pl-ok)',     label: 'production' },
    staging:      { c: 'var(--pl-warn)',   label: 'staging' },
    experimental: { c: 'var(--pl-ink-500)', label: 'experimental' },
    failing:      { c: 'var(--pl-fail)',   label: 'failing' },
  };
  const s = map[status] || map.experimental;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: PRODUCT_MONO, fontSize: 11, color: 'var(--pl-ink-600)', letterSpacing: '0.01em' }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.c, boxShadow: status === 'production' ? `0 0 0 3px color-mix(in oklch, ${s.c} 18%, transparent)` : 'none' }} />
      {s.label}
    </span>
  );
}

function Tag({ children, tone = 'neutral' }) {
  const styles = {
    neutral: { bg: 'var(--pl-ink-100)', fg: 'var(--pl-ink-700)', bd: 'var(--pl-ink-200)' },
    signal:  { bg: 'color-mix(in oklch, var(--pl-signal) 12%, var(--pl-paper))', fg: 'var(--pl-signal-ink)', bd: 'color-mix(in oklch, var(--pl-signal) 30%, var(--pl-ink-200))' },
    ok:      { bg: 'color-mix(in oklch, var(--pl-ok) 14%, var(--pl-paper))', fg: 'oklch(0.32 0.10 155)', bd: 'color-mix(in oklch, var(--pl-ok) 35%, var(--pl-ink-200))' },
    warn:    { bg: 'color-mix(in oklch, var(--pl-warn) 18%, var(--pl-paper))', fg: 'oklch(0.42 0.10 75)', bd: 'color-mix(in oklch, var(--pl-warn) 40%, var(--pl-ink-200))' },
    fail:    { bg: 'color-mix(in oklch, var(--pl-fail) 14%, var(--pl-paper))', fg: 'oklch(0.42 0.13 25)', bd: 'color-mix(in oklch, var(--pl-fail) 35%, var(--pl-ink-200))' },
  };
  const s = styles[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px',
      fontFamily: PRODUCT_MONO, fontSize: 10.5, letterSpacing: '0.02em',
      background: s.bg, color: s.fg, border: `1px solid ${s.bd}`, borderRadius: 4,
      lineHeight: 1.5,
    }}>{children}</span>
  );
}

function VendorMark({ vendor, size = 14 }) {
  // Original simple geometric marks — not company logos
  if (vendor === 'anthropic') {
    return (
      <span style={{ width: size, height: size, borderRadius: 3, background: 'var(--pl-ink-900)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ width: size * 0.5, height: size * 0.5, borderRadius: 1, background: 'var(--pl-paper)' }} />
      </span>
    );
  }
  return (
    <span style={{ width: size, height: size, borderRadius: 999, border: `1.5px solid var(--pl-ink-700)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ width: size * 0.32, height: size * 0.32, borderRadius: 999, background: 'var(--pl-ink-700)' }} />
    </span>
  );
}

function Sparkline({ values, w = 96, h = 24, color = 'var(--pl-signal-deep)' }) {
  const max = Math.max(...values), min = Math.min(...values);
  const r = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / r) * (h - 2) - 1}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={h - ((values[values.length - 1] - min) / r) * (h - 2) - 1} r="2" fill={color} />
    </svg>
  );
}

function MiniLogo({ size = 22 }) {
  // Bracket mark from logos.jsx — simplified inline for the product chrome
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      <path d="M8 4 L4 4 L4 20 L8 20" stroke="var(--pl-ink-900)" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M16 4 L20 4 L20 20 L16 20" stroke="var(--pl-ink-900)" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="var(--pl-signal-deep)" strokeWidth="1.6" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// App chrome — sidebar + topbar
// ─────────────────────────────────────────────────────────────
function AppChrome({ active = 'prompts', children }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '◫' },
    { id: 'prompts',   label: 'Prompts',   icon: '⌘' },
    { id: 'mcp',       label: 'MCP',       icon: '⌥' },
    { id: 'mocks',     label: 'Mocks',     icon: '◐' },
    { id: 'evals',     label: 'Evals',     icon: '◇' },
    { id: 'runs',      label: 'Runs',      icon: '▷' },
    { id: 'projects',  label: 'Projects',  icon: '▤' },
  ];
  const bottomItems = [
    { id: 'docs',      label: 'Docs',      icon: '⏚' },
    { id: 'settings',  label: 'Settings',  icon: '◎' },
  ];

  const NavRow = ({ item, isActive }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
      borderRadius: 6, fontSize: 13.5, fontWeight: isActive ? 500 : 400,
      color: isActive ? 'var(--pl-ink-900)' : 'var(--pl-ink-600)',
      background: isActive ? 'var(--pl-ink-100)' : 'transparent',
      cursor: 'pointer',
    }}>
      <span style={{ fontFamily: PRODUCT_MONO, fontSize: 13, color: isActive ? 'var(--pl-signal-deep)' : 'var(--pl-ink-500)', width: 14, textAlign: 'center' }}>{item.icon}</span>
      <span>{item.label}</span>
    </div>
  );

  return (
    <div className="pl" style={{ display: 'flex', minHeight: '100%', background: 'var(--pl-canvas)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 232, flexShrink: 0,
        background: 'var(--pl-paper)',
        borderRight: '1px solid var(--pl-ink-200)',
        display: 'flex', flexDirection: 'column',
        padding: '18px 14px',
      }}>
        {/* Logo + workspace */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px 18px' }}>
          <MiniLogo size={22} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontWeight: 500, fontSize: 14, letterSpacing: '-0.01em' }}>promptLM</span>
            <Mono size={10.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.02em' }}>v0.9.3 · local</Mono>
          </div>
        </div>

        {/* Workspace switcher */}
        <button style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '8px 10px', marginBottom: 14,
          background: 'transparent', border: '1px solid var(--pl-ink-200)',
          borderRadius: 7, cursor: 'pointer', fontFamily: PRODUCT_FONT, fontSize: 13,
          color: 'var(--pl-ink-800)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--pl-signal-deep)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pl-paper)', fontSize: 9, fontFamily: PRODUCT_MONO }}>A</span>
            acme · prod
          </span>
          <span style={{ color: 'var(--pl-ink-500)', fontSize: 11 }}>⌄</span>
        </button>

        <Mono size={10} color="var(--pl-ink-500)" style={{ padding: '0 10px 6px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Library</Mono>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {navItems.map((it) => <NavRow key={it.id} item={it} isActive={it.id === active} />)}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 10 }}>
          {bottomItems.map((it) => <NavRow key={it.id} item={it} isActive={false} />)}
        </div>

        {/* User chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
          borderRadius: 7, border: '1px solid var(--pl-ink-200)',
        }}>
          <span style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--pl-ink-300)', color: 'var(--pl-ink-800)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 500 }}>JS</span>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 12.5, color: 'var(--pl-ink-800)' }}>jamie</span>
            <Mono size={10} color="var(--pl-ink-500)">jamie@acme.dev</Mono>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Screen 1 — Prompt Catalog
// ─────────────────────────────────────────────────────────────
function PromptCatalog() {
  return (
    <AppChrome active="prompts">
      {/* Topbar */}
      <header style={{
        height: 52, display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 24px', borderBottom: '1px solid var(--pl-ink-200)',
        background: 'var(--pl-paper)',
      }}>
        <Mono size={11} color="var(--pl-ink-500)" style={{ letterSpacing: '0.06em' }}>
          acme · prod / <span style={{ color: 'var(--pl-ink-800)' }}>prompts</span>
        </Mono>

        <div style={{ flex: 1, maxWidth: 380, marginLeft: 'auto', position: 'relative' }}>
          <input
            placeholder="Search prompts, tags, ids…"
            style={{
              width: '100%', height: 32, padding: '0 12px 0 32px',
              background: 'var(--pl-ink-100)', border: '1px solid var(--pl-ink-200)',
              borderRadius: 7, fontFamily: PRODUCT_FONT, fontSize: 13, color: 'var(--pl-ink-800)',
              outline: 'none',
            }}
          />
          <span style={{ position: 'absolute', left: 11, top: 8, fontSize: 13, color: 'var(--pl-ink-500)' }}>⌕</span>
          <span style={{ position: 'absolute', right: 8, top: 7, fontFamily: PRODUCT_MONO, fontSize: 10, color: 'var(--pl-ink-500)', border: '1px solid var(--pl-ink-200)', borderRadius: 4, padding: '1px 5px', background: 'var(--pl-paper)' }}>⌘K</span>
        </div>

        <button className="pl-btn pl-btn-ghost" style={{ height: 32, padding: '0 12px', fontSize: 13 }}>
          <span style={{ fontFamily: PRODUCT_MONO, fontSize: 12 }}>↻</span> Sync
        </button>
        <button className="pl-btn pl-btn-primary" style={{ height: 32, padding: '0 14px', fontSize: 13 }}>
          <span style={{ fontFamily: PRODUCT_MONO, fontSize: 14, marginTop: -1 }}>+</span> New prompt
        </button>
      </header>

      {/* Body — facets + list */}
      <div style={{ display: 'grid', gridTemplateColumns: '212px 1fr', flex: 1, minHeight: 0 }}>
        {/* Facet rail */}
        <aside style={{
          borderRight: '1px solid var(--pl-ink-200)',
          background: 'var(--pl-paper)',
          padding: '20px 16px',
          display: 'flex', flexDirection: 'column', gap: 22,
        }}>
          <FacetGroup label="Group" items={GROUPS} active="all" />
          <FacetGroup label="Vendor" items={VENDORS} active={null} />
          <FacetGroup label="Status" items={[
            { id: 'production',   label: 'Production',   count: 6, dot: 'var(--pl-ok)' },
            { id: 'staging',      label: 'Staging',      count: 1, dot: 'var(--pl-warn)' },
            { id: 'experimental', label: 'Experimental', count: 2, dot: 'var(--pl-ink-500)' },
          ]} active={null} />
          <FacetGroup label="Evaluation" items={[
            { id: 'enabled',  label: 'Enabled',  count: 7 },
            { id: 'disabled', label: 'Disabled', count: 2 },
          ]} active={null} />
        </aside>

        {/* Catalog */}
        <main style={{ padding: '24px 32px 64px', overflow: 'hidden' }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <Mono size={11} color="var(--pl-ink-500)" style={{ letterSpacing: '0.14em', textTransform: 'uppercase' }}>Library</Mono>
              <h1 style={{
                margin: '2px 0 4px', fontFamily: PRODUCT_FONT, fontSize: 30,
                fontWeight: 500, letterSpacing: '-0.025em', color: 'var(--pl-ink-900)',
              }}>Prompts</h1>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--pl-ink-600)' }}>
                9 prompts · 6 production · last sync <Mono size={12} color="var(--pl-ink-700)">2s ago</Mono>
              </p>
            </div>

            {/* View toggles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Mono size={11} color="var(--pl-ink-500)" style={{ letterSpacing: '0.08em' }}>SORT</Mono>
              <select style={{
                height: 30, padding: '0 28px 0 10px', appearance: 'none',
                background: 'var(--pl-paper)', border: '1px solid var(--pl-ink-200)',
                borderRadius: 6, fontFamily: PRODUCT_FONT, fontSize: 12.5, color: 'var(--pl-ink-800)',
                backgroundImage: `linear-gradient(45deg, transparent 50%, var(--pl-ink-500) 50%), linear-gradient(135deg, var(--pl-ink-500) 50%, transparent 50%)`,
                backgroundPosition: 'calc(100% - 14px) 13px, calc(100% - 9px) 13px',
                backgroundSize: '5px 5px',
                backgroundRepeat: 'no-repeat',
              }}>
                <option>Recently updated</option>
                <option>Most executions</option>
                <option>Name (A→Z)</option>
              </select>
              <div style={{ display: 'flex', border: '1px solid var(--pl-ink-200)', borderRadius: 6, overflow: 'hidden' }}>
                <button style={{ padding: '6px 9px', background: 'var(--pl-ink-100)', border: 'none', borderRight: '1px solid var(--pl-ink-200)', cursor: 'pointer', fontFamily: PRODUCT_MONO, fontSize: 12, color: 'var(--pl-ink-900)' }}>▤</button>
                <button style={{ padding: '6px 9px', background: 'var(--pl-paper)', border: 'none', cursor: 'pointer', fontFamily: PRODUCT_MONO, fontSize: 12, color: 'var(--pl-ink-500)' }}>▦</button>
              </div>
            </div>
          </div>

          {/* Active filters chip row */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <Mono size={11} color="var(--pl-ink-500)" style={{ letterSpacing: '0.1em' }}>FILTERS</Mono>
            <Tag tone="signal">group:all</Tag>
            <Tag>vendor:any</Tag>
            <Tag>status:any</Tag>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--pl-ink-500)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', marginLeft: 4 }}>reset</button>
          </div>

          {/* List header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px 100px 110px 110px 28px',
            padding: '0 16px 8px',
            borderBottom: '1px solid var(--pl-ink-200)',
            gap: 16,
          }}>
            {['Prompt', 'Model', 'Status', 'Executions', 'p95', ''].map((h, i) => (
              <Mono key={i} size={10.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>{h}</Mono>
            ))}
          </div>

          {/* Rows */}
          <div>
            {SAMPLE_PROMPTS.map((p, i) => <CatalogRow key={p.id} p={p} highlight={i === 2} />)}
          </div>

          {/* Footer / pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 16px 0' }}>
            <Mono size={11} color="var(--pl-ink-500)">Showing 9 of 9</Mono>
            <div style={{ display: 'flex', gap: 4 }}>
              <button style={{ width: 28, height: 28, border: '1px solid var(--pl-ink-200)', background: 'var(--pl-paper)', borderRadius: 5, fontFamily: PRODUCT_MONO, fontSize: 12, color: 'var(--pl-ink-500)', cursor: 'pointer' }}>←</button>
              <button style={{ width: 28, height: 28, border: '1px solid var(--pl-ink-200)', background: 'var(--pl-paper)', borderRadius: 5, fontFamily: PRODUCT_MONO, fontSize: 12, color: 'var(--pl-ink-500)', cursor: 'pointer' }}>→</button>
            </div>
          </div>
        </main>
      </div>
    </AppChrome>
  );
}

function FacetGroup({ label, items, active }) {
  return (
    <div>
      <Mono size={10.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.14em', textTransform: 'uppercase', display: 'block', marginBottom: 8, paddingLeft: 8 }}>{label}</Mono>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.map((it) => {
          const isActive = it.id === active;
          return (
            <div key={it.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 8px', borderRadius: 5, cursor: 'pointer',
              background: isActive ? 'var(--pl-ink-100)' : 'transparent',
              fontSize: 12.5,
              color: isActive ? 'var(--pl-ink-900)' : 'var(--pl-ink-700)',
              fontWeight: isActive ? 500 : 400,
            }}>
              {it.dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: it.dot, flexShrink: 0 }} />}
              <span style={{ flex: 1 }}>{it.label}</span>
              <Mono size={10.5} color="var(--pl-ink-500)">{it.count}</Mono>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CatalogRow({ p, highlight }) {
  // Generate a believable sparkline from successRate jittered
  const spark = React.useMemo(() => {
    const base = p.successRate;
    return Array.from({ length: 20 }, (_, i) => base + (Math.sin(i * 0.7 + p.id.charCodeAt(4)) * 0.025));
  }, [p.id, p.successRate]);

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 140px 100px 110px 110px 28px',
      padding: '14px 16px', gap: 16,
      borderBottom: '1px solid var(--pl-ink-200)',
      alignItems: 'center',
      background: highlight ? 'color-mix(in oklch, var(--pl-signal) 5%, transparent)' : 'transparent',
      position: 'relative',
    }}>
      {highlight && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'var(--pl-signal-deep)' }} />}

      {/* Prompt cell */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <Mono size={13.5} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>{p.name}</Mono>
          <Mono size={10.5} color="var(--pl-ink-500)">v{p.version}</Mono>
          <Mono size={10.5} color="var(--pl-ink-500)" style={{ background: 'var(--pl-ink-100)', padding: '1px 5px', borderRadius: 3 }}>r{p.revision}</Mono>
          {p.tags.map((t) => <Tag key={t}>{t}</Tag>)}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--pl-ink-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
          {p.description}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Mono size={10.5} color="var(--pl-ink-500)">{p.id}</Mono>
          <Mono size={10.5} color="var(--pl-ink-500)">·</Mono>
          <Mono size={10.5} color="var(--pl-ink-500)">{p.placeholders} placeholders · {p.messages} msgs</Mono>
          <Mono size={10.5} color="var(--pl-ink-500)">·</Mono>
          <Mono size={10.5} color="var(--pl-ink-500)">updated {p.updatedAt}</Mono>
        </div>
      </div>

      {/* Model */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <VendorMark vendor={p.vendor} size={14} />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.25 }}>
          <Mono size={11.5} color="var(--pl-ink-800)" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.model}</Mono>
          <Mono size={10} color="var(--pl-ink-500)" style={{ textTransform: 'capitalize' }}>{p.vendor}</Mono>
        </div>
      </div>

      {/* Status */}
      <StatusDot status={p.status} />

      {/* Executions */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <Mono size={13} color="var(--pl-ink-900)" style={{ fontVariantNumeric: 'tabular-nums' }}>{p.executions.toLocaleString()}</Mono>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Mono size={10} color={p.successRate >= 0.95 ? 'oklch(0.45 0.12 155)' : 'oklch(0.50 0.13 75)'}>
            {(p.successRate * 100).toFixed(1)}%
          </Mono>
          <Sparkline values={spark} w={48} h={14} color={p.successRate >= 0.95 ? 'var(--pl-ok)' : 'var(--pl-warn)'} />
        </div>
      </div>

      {/* p95 latency */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <Mono size={13} color="var(--pl-ink-900)" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {p.p95LatencyMs >= 1000 ? (p.p95LatencyMs / 1000).toFixed(2) + 's' : p.p95LatencyMs + 'ms'}
        </Mono>
        <Mono size={10} color="var(--pl-ink-500)">avg {p.avgLatencyMs >= 1000 ? (p.avgLatencyMs / 1000).toFixed(1) + 's' : p.avgLatencyMs + 'ms'}</Mono>
      </div>

      {/* Action */}
      <button style={{ width: 24, height: 24, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--pl-ink-500)', fontFamily: PRODUCT_MONO, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Screen 2 — Prompt Detail
// ─────────────────────────────────────────────────────────────
function PromptDetail() {
  const p = SAMPLE_PROMPTS[2]; // mcp-tool-router

  return (
    <AppChrome active="prompts">
      {/* Topbar */}
      <header style={{
        height: 52, display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 24px', borderBottom: '1px solid var(--pl-ink-200)',
        background: 'var(--pl-paper)',
      }}>
        <Mono size={11} color="var(--pl-ink-500)" style={{ letterSpacing: '0.06em' }}>
          acme · prod / prompts / <span style={{ color: 'var(--pl-ink-800)' }}>{p.name}</span>
        </Mono>

        <div style={{ flex: 1 }} />

        <Mono size={11} color="var(--pl-ink-500)">
          ⌘E to edit · ⌘↵ to run
        </Mono>
        <button className="pl-btn pl-btn-ghost" style={{ height: 32, padding: '0 12px', fontSize: 13 }}>
          History
        </button>
        <button className="pl-btn pl-btn-ghost" style={{ height: 32, padding: '0 12px', fontSize: 13 }}>
          Edit
        </button>
        <button className="pl-btn pl-btn-primary" style={{ height: 32, padding: '0 14px', fontSize: 13 }}>
          <span style={{ fontFamily: PRODUCT_MONO, fontSize: 11 }}>▷</span> Run
        </button>
      </header>

      {/* Detail header */}
      <div style={{ padding: '28px 36px 22px', borderBottom: '1px solid var(--pl-ink-200)', background: 'var(--pl-paper)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--pl-ink-100)', border: '1px solid var(--pl-ink-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mono size={14} color="var(--pl-signal-deep)" style={{ fontWeight: 500 }}>⌥</Mono>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <h1 style={{ margin: 0, fontFamily: PRODUCT_FONT, fontSize: 22, fontWeight: 500, letterSpacing: '-0.018em' }}>
                <Mono size={22} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>{p.name}</Mono>
              </h1>
              <Tag tone="signal">v{p.version}</Tag>
              <Tag>r{p.revision}</Tag>
              <StatusDot status={p.status} />
            </div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--pl-ink-600)', maxWidth: 720, lineHeight: 1.5 }}>
              {p.description}
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <Mono size={11} color="var(--pl-ink-500)">{p.id}</Mono>
              <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <VendorMark vendor={p.vendor} size={11} />
                <Mono size={11.5} color="var(--pl-ink-700)">{p.vendor}/{p.model}</Mono>
              </span>
              <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
              <Mono size={11} color="var(--pl-ink-500)">group: {p.group}</Mono>
              <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
              <Mono size={11} color="var(--pl-ink-500)">github.com/acme/prompts</Mono>
              {p.tags.map((t) => <Tag key={t}>{t}</Tag>)}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0,
          border: '1px solid var(--pl-ink-200)', borderRadius: 10,
          background: 'var(--pl-canvas)',
          marginTop: 6,
        }}>
          <StatCell label="Executions (24h)" value="1,420" sub="+18% vs yesterday" tone="ok" />
          <StatCell label="Success rate" value="99.2%" sub="14 fails / 1,420" tone="ok" />
          <StatCell label="p95 latency" value="720ms" sub="avg 380ms" />
          <StatCell label="Avg tokens" value="1,420" sub="↑ from 1,180" tone="warn" />
          <StatCell label="Eval score" value="0.94" sub="rubric · 6 cases" last />
        </div>
      </div>

      {/* Tabs + body */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Tabs />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', flex: 1, minHeight: 0 }}>
          {/* Main column */}
          <div style={{ padding: '24px 36px 64px', overflow: 'hidden', borderRight: '1px solid var(--pl-ink-200)' }}>
            <SectionHeader eyebrow="01 · Messages" title="Composition" action="Add message" />
            <MessageBlocks />

            <SectionHeader eyebrow="02 · Placeholders" title="Variables" action="Add placeholder" />
            <PlaceholderTable />

            <SectionHeader eyebrow="03 · Recent executions" title="Last 8 runs" action="View all 22,106" />
            <ExecutionTable />
          </div>

          {/* Right rail — request config + evaluation */}
          <aside style={{ padding: '24px 28px 64px', background: 'var(--pl-paper)', overflow: 'hidden' }}>
            <SectionHeader eyebrow="Request" title="Model config" />
            <ConfigList items={[
              ['type',          'chat'],
              ['vendor',        p.vendor],
              ['model',         p.model],
              ['snapshot',      'claude-haiku-4-5-20251022'],
              ['url',           'https://api.anthropic.com/v1/messages'],
              ['temperature',   '0.0'],
              ['max_tokens',    '1024'],
              ['top_p',         '1.0'],
              ['stop',          '—'],
            ]} />

            <SectionHeader eyebrow="Evaluation" title="Rubric · enabled" />
            <div style={{ marginBottom: 18 }}>
              <div style={{
                padding: 12, border: '1px solid var(--pl-ink-200)', borderRadius: 8,
                background: 'var(--pl-ink-100)', marginBottom: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Mono size={11.5} color="var(--pl-ink-800)" style={{ fontWeight: 500 }}>tool-selection-accuracy</Mono>
                  <Mono size={11} color="oklch(0.45 0.12 155)" style={{ fontWeight: 500 }}>0.96</Mono>
                </div>
                <div style={{ height: 4, background: 'var(--pl-ink-200)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: '96%', height: '100%', background: 'var(--pl-ok)' }} />
                </div>
              </div>
              <div style={{
                padding: 12, border: '1px solid var(--pl-ink-200)', borderRadius: 8,
                background: 'var(--pl-ink-100)', marginBottom: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Mono size={11.5} color="var(--pl-ink-800)" style={{ fontWeight: 500 }}>argument-validity</Mono>
                  <Mono size={11} color="oklch(0.45 0.12 155)" style={{ fontWeight: 500 }}>0.92</Mono>
                </div>
                <div style={{ height: 4, background: 'var(--pl-ink-200)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: '92%', height: '100%', background: 'var(--pl-ok)' }} />
                </div>
              </div>
              <div style={{
                padding: 12, border: '1px solid var(--pl-ink-200)', borderRadius: 8,
                background: 'var(--pl-ink-100)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Mono size={11.5} color="var(--pl-ink-800)" style={{ fontWeight: 500 }}>refusal-when-unknown</Mono>
                  <Mono size={11} color="oklch(0.50 0.13 75)" style={{ fontWeight: 500 }}>0.81</Mono>
                </div>
                <div style={{ height: 4, background: 'var(--pl-ink-200)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: '81%', height: '100%', background: 'var(--pl-warn)' }} />
                </div>
              </div>
            </div>

            <SectionHeader eyebrow="MCP" title="Bound servers" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['filesystem', 'mock', 'recorded · 14 calls'],
                ['github',     'live', '2 tools · readonly'],
                ['postgres',   'mock', 'recorded · 6 calls'],
              ].map(([name, mode, sub]) => (
                <div key={name} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', border: '1px solid var(--pl-ink-200)', borderRadius: 7,
                  background: 'var(--pl-paper)',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: 999,
                    background: mode === 'live' ? 'var(--pl-signal-deep)' : 'var(--pl-ink-500)',
                  }} />
                  <Mono size={11.5} color="var(--pl-ink-800)" style={{ fontWeight: 500 }}>{name}</Mono>
                  <Mono size={10} color="var(--pl-ink-500)" style={{ marginLeft: 'auto', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{mode}</Mono>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </AppChrome>
  );
}

function StatCell({ label, value, sub, tone, last }) {
  const subColor =
    tone === 'ok'   ? 'oklch(0.45 0.12 155)' :
    tone === 'warn' ? 'oklch(0.50 0.13 75)'  :
    tone === 'fail' ? 'oklch(0.45 0.15 25)'  :
    'var(--pl-ink-500)';
  return (
    <div style={{ padding: '14px 18px', borderRight: last ? 'none' : '1px solid var(--pl-ink-200)' }}>
      <Mono size={10.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{label}</Mono>
      <Mono size={22} color="var(--pl-ink-900)" style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums', display: 'block', lineHeight: 1.1 }}>{value}</Mono>
      <Mono size={10.5} color={subColor} style={{ marginTop: 3, display: 'block' }}>{sub}</Mono>
    </div>
  );
}

function Tabs() {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'compose',  label: 'Compose' },
    { id: 'test',     label: 'Test runner' },
    { id: 'evals',    label: 'Evaluations', count: 6 },
    { id: 'mcp',      label: 'MCP' },
    { id: 'history',  label: 'History', count: 17 },
  ];
  return (
    <div style={{
      display: 'flex', gap: 0, padding: '0 36px',
      borderBottom: '1px solid var(--pl-ink-200)',
      background: 'var(--pl-paper)',
    }}>
      {tabs.map((t, i) => {
        const active = i === 0;
        return (
          <div key={t.id} style={{
            padding: '12px 16px', cursor: 'pointer',
            fontSize: 13, fontFamily: PRODUCT_FONT,
            color: active ? 'var(--pl-ink-900)' : 'var(--pl-ink-600)',
            fontWeight: active ? 500 : 400,
            borderBottom: active ? '2px solid var(--pl-ink-900)' : '2px solid transparent',
            marginBottom: -1,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {t.label}
            {t.count != null && <Mono size={10} color="var(--pl-ink-500)" style={{ background: 'var(--pl-ink-100)', padding: '1px 5px', borderRadius: 3 }}>{t.count}</Mono>}
          </div>
        );
      })}
    </div>
  );
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, marginTop: 4 }}>
      <div>
        <Mono size={10.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.14em', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>{eyebrow}</Mono>
        <h3 style={{ margin: 0, fontFamily: PRODUCT_FONT, fontSize: 16, fontWeight: 500, letterSpacing: '-0.012em' }}>{title}</h3>
      </div>
      {action && (
        <button style={{
          background: 'transparent', border: 'none', padding: 0,
          fontSize: 12.5, color: 'var(--pl-signal-deep)', fontFamily: PRODUCT_FONT,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {action} <Mono size={11}>→</Mono>
        </button>
      )}
    </div>
  );
}

function MessageBlocks() {
  const messages = [
    {
      role: 'system',
      body: [
        'You are a tool router for the {{agent_name}} assistant.',
        'You have access to the following MCP tools:',
        '{{tool_catalog}}',
        '',
        'Decide which tool to call. If no tool fits, refuse and ask for clarification.',
      ].join('\n'),
    },
    {
      role: 'user',
      body: '{{user_message}}',
    },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
      {messages.map((m, i) => (
        <div key={i} style={{
          border: '1px solid var(--pl-ink-200)', borderRadius: 10,
          background: 'var(--pl-paper)', overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 14px', borderBottom: '1px solid var(--pl-ink-200)',
            background: 'var(--pl-ink-100)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mono size={10.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.1em' }}>{String(i + 1).padStart(2, '0')}</Mono>
              <Tag tone={m.role === 'system' ? 'signal' : 'neutral'}>{m.role}</Tag>
            </div>
            <Mono size={10.5} color="var(--pl-ink-500)">{m.body.length} chars</Mono>
          </div>
          <pre style={{
            margin: 0, padding: '14px 16px', fontFamily: PRODUCT_MONO, fontSize: 12.5,
            color: 'var(--pl-ink-800)', lineHeight: 1.65, whiteSpace: 'pre-wrap',
          }}>
            {m.body.split(/(\{\{[^}]+\}\})/g).map((chunk, j) =>
              chunk.startsWith('{{') ? (
                <span key={j} style={{
                  background: 'color-mix(in oklch, var(--pl-signal) 18%, transparent)',
                  color: 'var(--pl-signal-ink)',
                  padding: '1px 4px', borderRadius: 3,
                  borderBottom: '1px dashed var(--pl-signal-deep)',
                }}>{chunk}</span>
              ) : <React.Fragment key={j}>{chunk}</React.Fragment>
            )}
          </pre>
        </div>
      ))}
    </div>
  );
}

function PlaceholderTable() {
  const ph = [
    { name: 'agent_name',    type: 'string', required: true,  default: '"acme-bot"',         desc: 'Display name for the assistant.' },
    { name: 'tool_catalog',  type: 'json',   required: true,  default: 'tools.list()',       desc: 'JSON schema of available MCP tools.' },
    { name: 'user_message',  type: 'string', required: true,  default: '—',                  desc: 'Free-form user message that triggered the call.' },
  ];
  return (
    <div style={{
      border: '1px solid var(--pl-ink-200)', borderRadius: 10, overflow: 'hidden',
      marginBottom: 32, background: 'var(--pl-paper)',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '160px 80px 80px 1fr 140px',
        padding: '10px 14px', borderBottom: '1px solid var(--pl-ink-200)',
        background: 'var(--pl-ink-100)', gap: 12,
      }}>
        {['Name', 'Type', 'Required', 'Description', 'Default'].map((h) => (
          <Mono key={h} size={10.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>{h}</Mono>
        ))}
      </div>
      {ph.map((row, i) => (
        <div key={row.name} style={{
          display: 'grid', gridTemplateColumns: '160px 80px 80px 1fr 140px',
          padding: '12px 14px',
          borderBottom: i === ph.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
          gap: 12, alignItems: 'center',
        }}>
          <Mono size={12.5} color="var(--pl-signal-ink)" style={{ fontWeight: 500 }}>{`{{${row.name}}}`}</Mono>
          <Tag>{row.type}</Tag>
          {row.required ? <Tag tone="ok">required</Tag> : <Tag>optional</Tag>}
          <span style={{ fontSize: 12.5, color: 'var(--pl-ink-700)' }}>{row.desc}</span>
          <Mono size={11.5} color="var(--pl-ink-600)">{row.default}</Mono>
        </div>
      ))}
    </div>
  );
}

function ExecutionTable() {
  const runs = [
    { id: 'run_4f2a', when: '12s ago',  ms: 412, tokens: 1380, status: 'ok',   evalScore: 0.96, source: 'sdk · python' },
    { id: 'run_4f29', when: '38s ago',  ms: 380, tokens: 1410, status: 'ok',   evalScore: 0.94, source: 'sdk · python' },
    { id: 'run_4f28', when: '1m ago',   ms: 720, tokens: 1480, status: 'ok',   evalScore: 0.91, source: 'sdk · ts' },
    { id: 'run_4f27', when: '2m ago',   ms: 1108, tokens: 1840, status: 'fail', evalScore: 0.42, source: 'cli · run' },
    { id: 'run_4f26', when: '4m ago',   ms: 412, tokens: 1390, status: 'ok',   evalScore: 0.95, source: 'sdk · python' },
    { id: 'run_4f25', when: '6m ago',   ms: 380, tokens: 1340, status: 'ok',   evalScore: 0.97, source: 'sdk · python' },
    { id: 'run_4f24', when: '7m ago',   ms: 510, tokens: 1420, status: 'ok',   evalScore: 0.93, source: 'sdk · ts' },
    { id: 'run_4f23', when: '11m ago',  ms: 480, tokens: 1410, status: 'ok',   evalScore: 0.94, source: 'sdk · python' },
  ];
  return (
    <div style={{
      border: '1px solid var(--pl-ink-200)', borderRadius: 10, overflow: 'hidden',
      background: 'var(--pl-paper)',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '110px 1fr 80px 90px 80px 130px',
        padding: '10px 14px', borderBottom: '1px solid var(--pl-ink-200)',
        background: 'var(--pl-ink-100)', gap: 12,
      }}>
        {['Run', 'Source', 'Latency', 'Tokens', 'Eval', 'Status'].map((h) => (
          <Mono key={h} size={10.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>{h}</Mono>
        ))}
      </div>
      {runs.map((r, i) => (
        <div key={r.id} style={{
          display: 'grid', gridTemplateColumns: '110px 1fr 80px 90px 80px 130px',
          padding: '11px 14px',
          borderBottom: i === runs.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
          gap: 12, alignItems: 'center',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <Mono size={12} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>{r.id}</Mono>
            <Mono size={10} color="var(--pl-ink-500)">{r.when}</Mono>
          </div>
          <Mono size={11.5} color="var(--pl-ink-600)">{r.source}</Mono>
          <Mono size={12} color="var(--pl-ink-800)" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.ms >= 1000 ? (r.ms / 1000).toFixed(2) + 's' : r.ms + 'ms'}</Mono>
          <Mono size={12} color="var(--pl-ink-800)" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.tokens.toLocaleString()}</Mono>
          <Mono size={12} color={r.evalScore >= 0.85 ? 'oklch(0.45 0.12 155)' : 'oklch(0.45 0.15 25)'} style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{r.evalScore.toFixed(2)}</Mono>
          <div>
            {r.status === 'ok'
              ? <Tag tone="ok">✓ ok</Tag>
              : <Tag tone="fail">✕ failed</Tag>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfigList({ items }) {
  return (
    <div style={{
      border: '1px solid var(--pl-ink-200)', borderRadius: 8,
      background: 'var(--pl-paper)', overflow: 'hidden', marginBottom: 24,
    }}>
      {items.map(([k, v], i) => (
        <div key={k} style={{
          display: 'grid', gridTemplateColumns: '110px 1fr',
          padding: '8px 12px',
          borderBottom: i === items.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
          gap: 10, alignItems: 'center',
        }}>
          <Mono size={11} color="var(--pl-ink-500)" style={{ letterSpacing: '0.04em' }}>{k}</Mono>
          <Mono size={11.5} color="var(--pl-ink-800)" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</Mono>
        </div>
      ))}
    </div>
  );
}

window.PromptCatalog = PromptCatalog;
window.PromptDetail = PromptDetail;
