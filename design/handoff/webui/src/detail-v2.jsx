// product-v2.jsx — Prompt detail v1.1 (usability pass)
// Stays in v1 visual language (slate/electric, Geist + JetBrains Mono).
//
// Note on eval: evaluation is a Pro/coming-soon feature, NOT core. It appears
// here only as a soft hint in metrics; the headline metrics are operational
// (success / p95 / cost / token), and the test runner replays real traffic
// rather than a curated eval set.

function PromptDetailV2() {
  return (
    <AppChrome active="prompts">
      {/* Topbar — unchanged structure */}
      <header style={{
        height: 52, display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 24px', borderBottom: '1px solid var(--pl-ink-200)',
        background: 'var(--pl-paper)',
      }}>
        <Mono size={11} color="var(--pl-ink-500)" style={{ letterSpacing: '0.06em' }}>
          acme · prod / prompts / <span style={{ color: 'var(--pl-ink-800)' }}>mcp-tool-router</span>
        </Mono>
        <div style={{ flex: 1 }} />
        <ModeSwitch />
        <button className="pl-btn pl-btn-ghost" style={{ height: 32, padding: '0 12px', fontSize: 13 }}>Diff r17 ↔ r16</button>
        <button className="pl-btn pl-btn-primary" style={{ height: 32, padding: '0 14px', fontSize: 13 }}>
          <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 11 }}>▷</span> Run
        </button>
      </header>

      {/* HEADER + HEALTH ─────────────────────────────────────────── */}
      <div style={{ padding: '24px 32px 20px', borderBottom: '1px solid var(--pl-ink-200)', background: 'var(--pl-paper)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 520px', gap: 32, alignItems: 'flex-start' }}>
          {/* Title block */}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Mono size={22} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>mcp-tool-router</Mono>
              <Tag tone="signal">v1.4.2</Tag>
              <Tag>r17</Tag>
              <StatusDot status="production" />
              <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', border: '1px solid oklch(0.86 0.10 155)', background: 'oklch(0.97 0.04 155)', borderRadius: 999 }}>
                <span style={{ width: 5, height: 5, borderRadius: 999, background: 'oklch(0.55 0.13 155)' }} />
                <Mono size={10} color="oklch(0.40 0.12 155)" style={{ fontWeight: 500, letterSpacing: '0.06em' }}>HEALTHY</Mono>
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--pl-ink-600)', lineHeight: 1.5, maxWidth: 600 }}>
              Routes incoming user requests to the appropriate MCP tool given a live tool catalog. Refuses if no tool fits.
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <Mono size={11} color="var(--pl-ink-500)">prm_a47c</Mono>
              <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
              <Mono size={11.5} color="var(--pl-ink-700)">anthropic/claude-haiku-4-5</Mono>
              <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
              <Mono size={11} color="var(--pl-ink-500)">3 callers · 2 mcps</Mono>
              <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
              <Mono size={11} color="var(--pl-ink-500)">authored by j.s. · last edit 2h ago</Mono>
            </div>
          </div>

          {/* Health card — sparkline */}
          <HealthCard />
        </div>
      </div>

      {/* DELTA STRIP — what changed in last revision ─────────────── */}
      <div style={{
        padding: '10px 32px', display: 'flex', alignItems: 'center', gap: 16,
        background: 'oklch(0.97 0.02 240)',
        borderBottom: '1px solid var(--pl-ink-200)',
      }}>
        <Mono size={10} color="var(--pl-signal-deep)" style={{ fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>r17 — 2h ago</Mono>
        <span style={{ width: 1, height: 12, background: 'var(--pl-ink-300)' }} />
        <span style={{ fontSize: 13, color: 'var(--pl-ink-800)' }}>
          Tightened system message; added explicit refusal rule.
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'oklch(0.40 0.12 155)' }}>
          <span style={{ fontFamily: 'var(--pl-mono)' }}>+8</span><span>lines</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'oklch(0.45 0.15 25)' }}>
          <span style={{ fontFamily: 'var(--pl-mono)' }}>−2</span><span>lines</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'oklch(0.40 0.12 155)', fontWeight: 500 }}>
          24h success <span style={{ fontFamily: 'var(--pl-mono)' }}>+0.4%</span>
        </span>
        <div style={{ flex: 1 }} />
        <button className="pl-btn pl-btn-ghost" style={{ height: 26, padding: '0 10px', fontSize: 12 }}>Open diff →</button>
        <button className="pl-btn pl-btn-ghost" style={{ height: 26, padding: '0 10px', fontSize: 12 }}>Roll back</button>
      </div>

      {/* TABS ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 32px', borderBottom: '1px solid var(--pl-ink-200)', display: 'flex', gap: 0, background: 'var(--pl-paper)' }}>
        {[
          ['Compose', true],
          ['Test runner', false, 'pinned'],
          ['Executions', false, '22.1k'],
          ['MCP & tools', false, '3'],
          ['Callers', false, '3', 'down'],
          ['History', false, 'r17'],
          ['Evals', false, 'pro', 'pro'],
        ].map(([label, active, badge, badgeTone]) => (
          <button key={label} style={{
            background: 'none', border: 'none', padding: '14px 16px',
            borderBottom: active ? '2px solid var(--pl-signal-deep)' : '2px solid transparent',
            color: active ? 'var(--pl-ink-900)' : 'var(--pl-ink-600)',
            fontSize: 13.5, fontWeight: active ? 500 : 400, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            {label}
            {badge && (
              <span style={{
                fontFamily: 'var(--pl-mono)', fontSize: 10,
                padding: '1px 6px', borderRadius: 4,
                background: badgeTone === 'down' ? 'oklch(0.96 0.02 25)' : badgeTone === 'pro' ? 'oklch(0.96 0.04 280)' : 'var(--pl-ink-100)',
                color: badgeTone === 'down' ? 'oklch(0.45 0.15 25)' : badgeTone === 'pro' ? 'oklch(0.45 0.15 280)' : 'var(--pl-ink-600)',
                border: `1px solid ${badgeTone === 'down' ? 'oklch(0.86 0.05 25)' : badgeTone === 'pro' ? 'oklch(0.86 0.06 280)' : 'var(--pl-ink-200)'}`,
                textTransform: badgeTone === 'pro' ? 'uppercase' : undefined,
                letterSpacing: badgeTone === 'pro' ? '0.08em' : undefined,
              }}>{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* MAIN BODY ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', flex: 1, minHeight: 0 }}>
        {/* Left — composition with inline diff */}
        <div style={{ padding: '24px 32px 24px', borderRight: '1px solid var(--pl-ink-200)', overflow: 'hidden' }}>
          <SectionRow eyebrow="01 · Messages" title="Composition" hint="2 messages · 4 placeholders" />
          <MessageBlocksWithDiff />

          <div style={{ marginTop: 28 }}>
            <SectionRow eyebrow="02 · Placeholders" title="Variables" hint="coverage from last 1,420 runs" />
            <PlaceholderTableV2 />
          </div>

          <div style={{ marginTop: 28 }}>
            <SectionRow eyebrow="03 · Recent failures" title="Failed runs · 14 in last 24h" hint="↑ from 8 yesterday" hintTone="warn" />
            <FailureList />
          </div>
        </div>

        {/* Right rail — mode-aware panel */}
        <ModePanel />
      </div>

      {/* STICKY BOTTOM BAR ───────────────────────────────────────── */}
      <div style={{
        height: 48, display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 24px', borderTop: '1px solid var(--pl-ink-200)',
        background: 'var(--pl-paper)',
      }}>
        <Mono size={10.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>Quick test</Mono>
        <button className="pl-btn pl-btn-ghost" style={{ height: 28, padding: '0 12px', fontSize: 12 }}>
          ▷ Replay last 5 inputs
        </button>
        <button className="pl-btn pl-btn-ghost" style={{ height: 28, padding: '0 12px', fontSize: 12 }}>
          ▷ Run failure cases (14)
        </button>
        <button className="pl-btn pl-btn-ghost" style={{ height: 28, padding: '0 12px', fontSize: 12, opacity: 0.55 }} title="Coming soon — Pro">
          ▷ Eval suite <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 9, marginLeft: 6, padding: '1px 5px', border: '1px solid currentColor', borderRadius: 3, letterSpacing: '0.08em' }}>PRO</span>
        </button>
        <div style={{ flex: 1 }} />
        <Mono size={11} color="var(--pl-ink-500)">⌘E edit · ⌘↵ run · ⌘D diff · ⌘K command palette</Mono>
      </div>
    </AppChrome>
  );
}

// ─────────────────────────────────────────────────────────────
// Health card with sparkline
// ─────────────────────────────────────────────────────────────
function HealthCard() {
  const metrics = [
    { label: 'Success',  value: '99.2%', delta: '+0.4%', tone: 'ok', spark: [97.8, 98.1, 98.0, 97.6, 98.2, 98.5, 98.8, 99.2] },
    { label: 'p95',      value: '720ms', delta: '−40ms', tone: 'ok', spark: [820, 800, 810, 790, 800, 760, 740, 720] },
    { label: 'Cost / 1k', value: '$0.42', delta: '−$0.04', tone: 'ok', spark: [0.51, 0.50, 0.49, 0.48, 0.47, 0.45, 0.43, 0.42] },
    { label: 'Tokens',   value: '1.42k', delta: '+240',  tone: 'warn', spark: [1180, 1220, 1240, 1280, 1320, 1380, 1400, 1420] },
  ];
  return (
    <div style={{
      border: '1px solid var(--pl-ink-200)', borderRadius: 10,
      background: 'var(--pl-canvas)',
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    }}>
      {metrics.map((m, i) => (
        <div key={m.label} style={{
          padding: '12px 14px',
          borderRight: i === metrics.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Mono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>{m.label}</Mono>
            <Mono size={10} color={m.tone === 'ok' ? 'oklch(0.45 0.12 155)' : m.tone === 'warn' ? 'oklch(0.50 0.13 75)' : 'oklch(0.45 0.15 25)'} style={{ fontWeight: 500 }}>{m.delta}</Mono>
          </div>
          <Mono size={20} color="var(--pl-ink-900)" style={{ fontWeight: 500, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', display: 'block', marginTop: 2 }}>{m.value}</Mono>
          <HealthSparkline data={m.spark} tone={m.tone} />
        </div>
      ))}
    </div>
  );
}

function HealthSparkline({ data, tone }) {
  const W = 110, H = 22;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const xFor = (i) => (i / (data.length - 1)) * W;
  const yFor = (v) => H - 2 - ((v - min) / range) * (H - 4);
  const color = tone === 'warn' ? 'oklch(0.55 0.13 75)' : tone === 'fail' ? 'oklch(0.50 0.15 25)' : 'oklch(0.50 0.12 155)';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block', marginTop: 6 }}>
      <path
        d={data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(v).toFixed(2)}`).join(' ') + ` L ${W} ${H} L 0 ${H} Z`}
        fill={color} opacity="0.10"
      />
      <path
        d={data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(v).toFixed(2)}`).join(' ')}
        fill="none" stroke={color} strokeWidth="1.2"
      />
      <circle cx={xFor(data.length - 1)} cy={yFor(data[data.length - 1])} r="2" fill={color} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Mode switch (Compose / Test / Observe)
// ─────────────────────────────────────────────────────────────
function ModeSwitch() {
  return (
    <div style={{
      display: 'inline-flex', border: '1px solid var(--pl-ink-200)', borderRadius: 7,
      background: 'var(--pl-canvas)', padding: 2,
    }}>
      {[
        ['Compose', false, '✎'],
        ['Test', true, '▷'],
        ['Observe', false, '◉'],
      ].map(([label, active, glyph]) => (
        <button key={label} style={{
          background: active ? 'var(--pl-paper)' : 'transparent',
          border: 'none',
          boxShadow: active ? '0 1px 0 rgba(0,0,0,.04)' : 'none',
          padding: '4px 12px', borderRadius: 5,
          fontSize: 12,
          color: active ? 'var(--pl-ink-900)' : 'var(--pl-ink-600)',
          fontWeight: active ? 500 : 400,
          cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 10 }}>{glyph}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section row with eyebrow / title / hint
// ─────────────────────────────────────────────────────────────
function SectionRow({ eyebrow, title, hint, hintTone }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--pl-ink-200)' }}>
      <Mono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>{eyebrow}</Mono>
      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--pl-ink-900)' }}>{title}</span>
      {hint && (
        <Mono size={11} color={hintTone === 'warn' ? 'oklch(0.50 0.13 75)' : 'var(--pl-ink-500)'}>{hint}</Mono>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Messages with inline diff (added / changed lines highlighted)
// ─────────────────────────────────────────────────────────────
function MessageBlocksWithDiff() {
  return (
    <div style={{ border: '1px solid var(--pl-ink-200)', borderRadius: 10, overflow: 'hidden' }}>
      {/* System message */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--pl-ink-200)', background: 'var(--pl-canvas)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Mono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>System</Mono>
        <Tag>342 tok</Tag>
        <span style={{ flex: 1 }} />
        <Mono size={10} color="oklch(0.40 0.12 155)" style={{ fontWeight: 500 }}>+8 in r17</Mono>
      </div>
      <pre style={{
        margin: 0, padding: '14px 16px', fontFamily: 'var(--pl-mono)',
        fontSize: 12.5, lineHeight: 1.7, color: 'var(--pl-ink-800)',
        whiteSpace: 'pre-wrap', background: 'var(--pl-paper)',
      }}>
{`You are a tool router for the `}<PH>{'{{agent_name}}'}</PH>{` assistant.
`}<DiffLine kind="add">{'Decide which MCP tool to call given:\n  · the current conversation\n  · the available tool catalogue: {{tool_catalog}}\n  · the policy: {{policy}}'}</DiffLine>{`
`}<DiffLine kind="del">Pick the right MCP tool given the catalogue.</DiffLine>{`
`}<DiffLine kind="add">{'If no tool fits, refuse — do not invent a call.'}</DiffLine>{`
Reply with a single JSON object: `}{'{ tool, args, why }'}.
      </pre>

      {/* User message */}
      <div style={{ padding: '14px 16px 10px', borderTop: '1px solid var(--pl-ink-200)', borderBottom: '1px solid var(--pl-ink-200)', background: 'var(--pl-canvas)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Mono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>User</Mono>
        <Tag>1 var</Tag>
      </div>
      <pre style={{
        margin: 0, padding: '14px 16px', fontFamily: 'var(--pl-mono)',
        fontSize: 12.5, lineHeight: 1.7, color: 'var(--pl-ink-800)',
        whiteSpace: 'pre-wrap', background: 'var(--pl-paper)',
      }}>
        <PH>{'{{user_message}}'}</PH>
      </pre>
    </div>
  );
}

function PH({ children }) {
  return (
    <span style={{
      background: 'oklch(0.95 0.05 240)',
      border: '1px solid oklch(0.85 0.08 240)',
      color: 'var(--pl-signal-deep)',
      padding: '0 4px', borderRadius: 3,
      fontSize: '0.95em',
    }}>{children}</span>
  );
}

function DiffLine({ kind, children }) {
  const styles = {
    add: { background: 'oklch(0.96 0.04 155)', borderLeft: '2px solid oklch(0.55 0.13 155)', color: 'oklch(0.30 0.10 155)' },
    del: { background: 'oklch(0.96 0.04 25)',  borderLeft: '2px solid oklch(0.55 0.15 25)',  color: 'oklch(0.36 0.13 25)', textDecoration: 'line-through', textDecorationColor: 'oklch(0.55 0.15 25)' },
  };
  return (
    <span style={{
      display: 'inline-block', width: 'calc(100% + 32px)', marginLeft: -16,
      padding: '0 14px 0 14px', ...styles[kind],
    }}>{children}</span>
  );
}

// ─────────────────────────────────────────────────────────────
// Placeholder table v2 — coverage + last value
// ─────────────────────────────────────────────────────────────
function PlaceholderTableV2() {
  const rows = [
    { name: 'agent_name',   type: 'string',  source: 'config',  coverage: 1.00, last: '"Halley"',           covTone: 'ok' },
    { name: 'tool_catalog', type: 'json[]',  source: 'live',    coverage: 1.00, last: '6 tools',             covTone: 'ok' },
    { name: 'policy',       type: 'string',  source: 'config',  coverage: 0.94, last: '"P-04"',              covTone: 'ok' },
    { name: 'user_message', type: 'string',  source: 'request', coverage: 0.71, last: '"open the readme…"',  covTone: 'warn' },
  ];
  return (
    <div style={{ border: '1px solid var(--pl-ink-200)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr 1.4fr 1.4fr',
        padding: '10px 14px', background: 'var(--pl-canvas)',
        borderBottom: '1px solid var(--pl-ink-200)',
      }}>
        {['Variable', 'Type', 'Source', 'Coverage · 1,420 runs', 'Last value sample'].map((h) => (
          <Mono key={h} size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>{h}</Mono>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={r.name} style={{
          display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr 1.4fr 1.4fr', gap: 0,
          padding: '11px 14px', alignItems: 'center',
          borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
          background: 'var(--pl-paper)',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <PH>{`{{${r.name}}}`}</PH>
          </span>
          <Mono size={11.5} color="var(--pl-ink-700)">{r.type}</Mono>
          <Mono size={11.5} color="var(--pl-ink-700)">{r.source}</Mono>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 80, height: 5, borderRadius: 999, background: 'var(--pl-ink-200)', overflow: 'hidden' }}>
              <span style={{
                display: 'block', height: '100%', width: `${r.coverage * 100}%`,
                background: r.covTone === 'warn' ? 'var(--pl-warn)' : 'var(--pl-ok)',
              }} />
            </span>
            <Mono size={11} color={r.covTone === 'warn' ? 'oklch(0.50 0.13 75)' : 'oklch(0.45 0.12 155)'} style={{ fontWeight: 500 }}>
              {(r.coverage * 100).toFixed(0)}%
            </Mono>
          </span>
          <Mono size={11.5} color="var(--pl-ink-600)" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.last}</Mono>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Failure list
// ─────────────────────────────────────────────────────────────
function FailureList() {
  const fails = [
    { id: 'exe_9c4a', t: '14:22:01', input: '"call notion to find the design doc"',          err: 'invented `notion.read` (no such tool)', n: 6 },
    { id: 'exe_71ee', t: '13:08:44', input: '""',                                              err: 'arg path = "" — schema rejected',       n: 4 },
    { id: 'exe_3201', t: '12:55:10', input: '"hey what\'s up"',                                err: 'policy P-04 forbade chit-chat',         n: 11, kind: 'expected' },
    { id: 'exe_a18d', t: '12:30:02', input: '"summarise the last 50 commits"',                 err: 'model timeout · transient',             n: 4, kind: 'transient' },
  ];
  return (
    <div style={{ border: '1px solid var(--pl-ink-200)', borderRadius: 10, overflow: 'hidden' }}>
      {fails.map((f, i) => (
        <div key={f.id} style={{
          display: 'grid', gridTemplateColumns: '90px 1fr 1.4fr 90px 60px', gap: 12,
          alignItems: 'center', padding: '11px 14px',
          borderBottom: i === fails.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
          background: 'var(--pl-paper)',
        }}>
          <Mono size={11} color="var(--pl-ink-500)">{f.t}</Mono>
          <Mono size={11.5} color="var(--pl-ink-700)" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.input}</Mono>
          <span style={{ fontSize: 12.5, color: f.kind === 'expected' ? 'oklch(0.45 0.12 155)' : f.kind === 'transient' ? 'oklch(0.50 0.13 75)' : 'oklch(0.45 0.15 25)' }}>{f.err}</span>
          <Mono size={10.5} color="var(--pl-ink-500)">×{f.n}</Mono>
          <button className="pl-btn pl-btn-ghost" style={{ height: 24, padding: '0 8px', fontSize: 11 }}>Replay</button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Mode-aware right rail (Test mode shown)
// ─────────────────────────────────────────────────────────────
function ModePanel() {
  return (
    <aside style={{ background: 'var(--pl-canvas)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Mode header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--pl-ink-200)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 11 }}>▷</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--pl-ink-900)' }}>Test runner</span>
        <span style={{ flex: 1 }} />
        <Mono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>Live</Mono>
      </div>

      {/* Inputs */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--pl-ink-200)' }}>
        <Mono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Inputs</Mono>
        {[
          ['agent_name',   '"Halley"'],
          ['policy',       '"P-04"'],
          ['user_message', '"open the readme in the design repo"'],
        ].map(([k, v]) => (
          <div key={k} style={{ marginBottom: 8 }}>
            <Mono size={10.5} color="var(--pl-signal-deep)" style={{ display: 'block', marginBottom: 3 }}>{`{{${k}}}`}</Mono>
            <div style={{
              padding: '6px 8px', border: '1px solid var(--pl-ink-200)', borderRadius: 5,
              background: 'var(--pl-paper)', fontFamily: 'var(--pl-mono)', fontSize: 11.5,
              color: 'var(--pl-ink-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{v}</div>
          </div>
        ))}
        <button className="pl-btn pl-btn-ghost" style={{ height: 26, padding: '0 10px', fontSize: 11.5, marginTop: 4 }}>Pick from history…</button>
      </div>

      {/* Output */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--pl-ink-200)', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Mono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>Output</Mono>
          <Tag tone="ok">412ms</Tag>
          <Tag>284 tok</Tag>
          <span style={{ flex: 1 }} />
          <Mono size={10} color="oklch(0.40 0.12 155)" style={{ fontWeight: 500 }}>matches expected</Mono>
        </div>
        <pre style={{
          margin: 0, padding: '10px 12px', fontFamily: 'var(--pl-mono)',
          fontSize: 11.5, lineHeight: 1.7, color: 'var(--pl-ink-800)',
          background: 'var(--pl-paper)', border: '1px solid var(--pl-ink-200)', borderRadius: 6,
          whiteSpace: 'pre-wrap',
        }}>
{`{
  "tool": "filesystem.read",
  "args": { "path": "design/README.md" },
  "why":  "user asked for a readme;
           filesystem.read matches."
}`}
        </pre>
      </div>

      {/* Trace */}
      <div style={{ padding: '14px 20px' }}>
        <Mono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Trace</Mono>
        {[
          ['compose',  '12ms', 'ok'],
          ['model · haiku',     '280ms', 'ok'],
          ['mcp · filesystem',  '80ms (recorded)', 'ok'],
          ['validate · schema', '8ms · pass', 'ok'],
        ].map(([step, t, kind]) => (
          <div key={step} style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto', alignItems: 'center', gap: 8, padding: '5px 0' }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: 'oklch(0.55 0.12 155)' }} />
            <Mono size={11} color="var(--pl-ink-800)">{step}</Mono>
            <Mono size={10.5} color="var(--pl-ink-500)">{t}</Mono>
          </div>
        ))}
      </div>
    </aside>
  );
}

window.PromptDetailV2 = PromptDetailV2;
