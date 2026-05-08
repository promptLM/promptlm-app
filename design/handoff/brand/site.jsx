// promptLM website surfaces: Landing, Pricing, Docs preview.
// Uses tokens from tokens.css and Wordmark/Marks from logos.jsx.

const PL_NAV = [
  { label: 'Product', href: '#' },
  { label: 'Docs', href: '#' },
  { label: 'Changelog', href: '#' },
  { label: 'GitHub', href: 'https://github.com/promptLM/promptlm-app' },
];

function Nav({ current = 'product' }) {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '22px 56px', borderBottom: '1px solid var(--pl-ink-200)',
      background: 'var(--pl-paper)',
    }}>
      <Wordmark size={22} mark={MarkGraph} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {PL_NAV.map(n => (
          <a key={n.label} href={n.href} style={{
            fontFamily: 'var(--pl-display)', fontSize: 14, color: 'var(--pl-ink-700)',
            textDecoration: 'none', padding: '8px 14px', borderRadius: 6,
          }}>{n.label}</a>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="pl-btn pl-btn-ghost">Sign in</button>
        <button className="pl-btn pl-btn-primary">
          Start free
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6 H10 M7 3 L10 6 L7 9" stroke="currentColor" strokeWidth="1.4" /></svg>
        </button>
      </div>
    </nav>
  );
}

// ------- Product mock: Test runner -------
function TestRunnerMock() {
  const row = (status, name, t, kind) => ({ status, name, t, kind });
  const rows = [
    row('pass', 'agents/v3/booking · happy_path', '1.24s', 'fixture'),
    row('pass', 'agents/v3/booking · cancellation', '0.92s', 'fixture'),
    row('fail', 'agents/v3/booking · refund_dispute', '2.10s', 'live'),
    row('pass', 'agents/v3/booking · multi_turn', '3.41s', 'fixture'),
    row('warn', 'agents/v3/booking · low_confidence', '1.05s', 'mock'),
    row('pass', 'tools/calendar · check_availability', '0.31s', 'mcp'),
    row('pass', 'tools/calendar · create_event', '0.44s', 'mcp'),
  ];
  const dot = {
    pass: 'var(--pl-ok)', fail: 'var(--pl-fail)', warn: 'var(--pl-warn)',
  };
  return (
    <div style={{
      background: 'var(--pl-paper)',
      border: '1px solid var(--pl-ink-200)',
      borderRadius: 14,
      boxShadow: 'var(--pl-shadow-lg)',
      overflow: 'hidden',
      fontFamily: 'var(--pl-display)',
    }}>
      {/* window chrome */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', borderBottom: '1px solid var(--pl-ink-200)',
        background: 'var(--pl-ink-100)',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--pl-ink-300)' }} />
          <span style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--pl-ink-300)' }} />
          <span style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--pl-ink-300)' }} />
        </div>
        <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-600)', letterSpacing: '0.04em', marginLeft: 8 }}>
          promptlm · agents/v3 · run #4f8c1
        </div>
        <div style={{ flex: 1 }} />
        <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-500)' }}>
          <span style={{ color: 'var(--pl-ok)' }}>● 5 pass</span>
          <span style={{ marginLeft: 12, color: 'var(--pl-warn)' }}>● 1 warn</span>
          <span style={{ marginLeft: 12, color: 'var(--pl-fail)' }}>● 1 fail</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr' }}>
        {/* sidebar */}
        <div style={{ borderRight: '1px solid var(--pl-ink-200)', padding: '16px 12px', background: 'var(--pl-ink-100)' }}>
          <div className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-500)', letterSpacing: '0.06em', padding: '0 8px', marginBottom: 8 }}>SUITES</div>
          {[
            { name: 'agents/v3', count: 24, active: true },
            { name: 'agents/v2', count: 18 },
            { name: 'tools/calendar', count: 12 },
            { name: 'tools/search', count: 8 },
            { name: 'evals/safety', count: 31 },
          ].map(s => (
            <div key={s.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '7px 10px', borderRadius: 6,
              background: s.active ? 'var(--pl-paper)' : 'transparent',
              border: s.active ? '1px solid var(--pl-ink-200)' : '1px solid transparent',
              marginBottom: 2,
            }}>
              <span className="pl-mono" style={{ fontSize: 12, color: s.active ? 'var(--pl-ink-900)' : 'var(--pl-ink-700)' }}>{s.name}</span>
              <span className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-500)' }}>{s.count}</span>
            </div>
          ))}

          <div className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-500)', letterSpacing: '0.06em', padding: '0 8px', margin: '20px 0 8px' }}>FILTERS</div>
          <div style={{ display: 'flex', gap: 6, padding: '0 8px', flexWrap: 'wrap' }}>
            {['fixture', 'mock', 'live', 'mcp'].map(t => (
              <span key={t} className="pl-mono" style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 4,
                background: 'var(--pl-paper)', border: '1px solid var(--pl-ink-200)',
                color: 'var(--pl-ink-700)', letterSpacing: '0.04em',
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* main */}
        <div>
          {/* run bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px', borderBottom: '1px solid var(--pl-ink-200)',
          }}>
            <button className="pl-btn pl-btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,1 9,5 2,9" /></svg>
              Run all
            </button>
            <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-600)' }}>
              gpt-4o · <span style={{ color: 'var(--pl-signal-deep)' }}>mock</span> · seed=42
            </div>
            <div style={{ flex: 1 }} />
            <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-500)' }}>9.47s · $0.00</div>
          </div>

          {/* progress sparkline */}
          <div style={{ padding: '14px 18px 0', display: 'flex', gap: 3, alignItems: 'flex-end', height: 56 }}>
            {[12, 18, 14, 22, 20, 28, 24, 30, 26, 22, 32, 30, 36, 34, 40, 38, 44, 42, 38, 36, 32, 30, 28, 24].map((h, i) => (
              <div key={i} style={{
                width: 6, height: h,
                background: i === 16 ? 'var(--pl-fail)' : i === 12 ? 'var(--pl-warn)' : 'var(--pl-signal)',
                opacity: i === 16 || i === 12 ? 1 : 0.7,
                borderRadius: 1,
              }} />
            ))}
            <div style={{ flex: 1 }} />
            <div className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-500)', letterSpacing: '0.04em' }}>last 24 runs</div>
          </div>

          {/* table */}
          <div style={{ padding: 18 }}>
            <div className="pl-mono" style={{
              display: 'grid', gridTemplateColumns: '20px 1fr 80px 80px',
              fontSize: 10, color: 'var(--pl-ink-500)', letterSpacing: '0.06em',
              padding: '0 12px 8px', borderBottom: '1px solid var(--pl-ink-200)',
            }}>
              <span></span><span>TEST</span><span>KIND</span><span style={{ textAlign: 'right' }}>TIME</span>
            </div>
            {rows.map((r, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '20px 1fr 80px 80px',
                fontSize: 13, padding: '10px 12px', alignItems: 'center',
                borderBottom: '1px solid var(--pl-ink-100)',
                background: r.status === 'fail' ? 'oklch(0.66 0.18 25 / 0.04)' : 'transparent',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: dot[r.status] }} />
                <span className="pl-mono" style={{ fontSize: 12, color: 'var(--pl-ink-800)' }}>{r.name}</span>
                <span className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-600)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{r.kind}</span>
                <span className="pl-mono" style={{ fontSize: 12, color: 'var(--pl-ink-700)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ------- Feature mock: MCP inspector -------
function McpMock() {
  return (
    <div style={{
      background: 'var(--pl-ink-900)', borderRadius: 12, padding: 24,
      fontFamily: 'var(--pl-mono)', color: 'var(--pl-ink-300)', fontSize: 12, lineHeight: 1.7,
      boxShadow: 'var(--pl-shadow-md)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, color: 'var(--pl-ink-400)', letterSpacing: '0.04em', fontSize: 10 }}>
        <span>MCP · TOOLS/CALENDAR</span><span>● recording · 00:14</span>
      </div>
      {[
        { dir: '→', tool: 'list_events', t: '+0.012s', col: 'var(--pl-signal-bright)' },
        { dir: '←', tool: 'list_events · 200', t: '+0.184s', col: 'var(--pl-ok)' },
        { dir: '→', tool: 'create_event', t: '+0.224s', col: 'var(--pl-signal-bright)' },
        { dir: '←', tool: 'create_event · 200', t: '+0.412s', col: 'var(--pl-ok)' },
        { dir: '→', tool: 'send_invite', t: '+0.430s', col: 'var(--pl-signal-bright)' },
        { dir: '←', tool: 'send_invite · 429', t: '+1.124s', col: 'var(--pl-fail)' },
      ].map((l, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 80px', gap: 12 }}>
          <span style={{ color: l.col }}>{l.dir}</span>
          <span style={{ color: 'var(--pl-ink-200)' }}>{l.tool}</span>
          <span style={{ color: 'var(--pl-ink-500)', textAlign: 'right' }}>{l.t}</span>
        </div>
      ))}
    </div>
  );
}

// ------- Feature mock: prompt diff -------
function DiffMock() {
  return (
    <div style={{
      background: 'var(--pl-paper)', border: '1px solid var(--pl-ink-200)',
      borderRadius: 12, overflow: 'hidden', fontFamily: 'var(--pl-mono)', fontSize: 12,
      boxShadow: 'var(--pl-shadow-sm)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--pl-ink-200)', background: 'var(--pl-ink-100)' }}>
        <span style={{ color: 'var(--pl-ink-700)', letterSpacing: '0.04em', fontSize: 11 }}>booking_v2.prompt</span>
        <span style={{ color: 'var(--pl-ink-500)', fontSize: 11 }}>+12 −4 · 2 mins ago</span>
      </div>
      <div style={{ padding: '14px 0' }}>
        {[
          { op: ' ', t: 'You are a booking assistant.', muted: true },
          { op: ' ', t: 'Use available tools to check', muted: true },
          { op: ' ', t: 'calendar availability.', muted: true },
          { op: '-', t: 'Always confirm before booking.', col: 'var(--pl-fail)' },
          { op: '+', t: 'Confirm only when ambiguous.', col: 'var(--pl-ok)' },
          { op: '+', t: 'Prefer earliest slot when offered.', col: 'var(--pl-ok)' },
          { op: ' ', t: 'Return ISO 8601 datetimes.', muted: true },
        ].map((l, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '24px 36px 1fr',
            padding: '4px 16px',
            background: l.op === '+' ? 'oklch(0.74 0.13 155 / 0.10)' : l.op === '-' ? 'oklch(0.66 0.18 25 / 0.08)' : 'transparent',
          }}>
            <span style={{ color: 'var(--pl-ink-400)', textAlign: 'right', paddingRight: 12 }}>{i + 1}</span>
            <span style={{ color: l.col || 'var(--pl-ink-400)', fontWeight: 600 }}>{l.op}</span>
            <span style={{ color: l.muted ? 'var(--pl-ink-600)' : 'var(--pl-ink-900)' }}>{l.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────────────────────────
function Landing({ tweaks = {} }) {
  const heroBg = tweaks.gradientHero
    ? {
        background: `radial-gradient(ellipse 900px 600px at 80% 0%, var(--pl-signal-soft) 0%, transparent 55%),
                     radial-gradient(ellipse 700px 500px at 10% 30%, var(--pl-accent-2-soft) 0%, transparent 60%),
                     radial-gradient(ellipse 600px 400px at 90% 70%, var(--pl-accent-3-soft) 0%, transparent 60%),
                     var(--pl-paper)`,
      }
    : {};
  return (
    <div className="pl" style={{ width: 1280, background: 'var(--pl-paper)' }}>
      <Nav current="product" />

      {/* Hero */}
      <section className="pl-grid-bg" style={{ padding: '120px 56px 80px', position: 'relative', ...heroBg }}>
        <div style={{ maxWidth: 920 }}>
          <div className="pl-eyebrow" style={{ marginBottom: 28 }}>
            <span style={{
              display: 'inline-block', width: 7, height: 7, borderRadius: 4,
              background: 'var(--pl-signal)', marginRight: 10, verticalAlign: 1,
            }} className="pl-pulse" />
            v0.4 · MCP recording is live
          </div>
          <h1 style={{
            fontSize: 88, fontWeight: 400, letterSpacing: '-0.04em',
            lineHeight: 0.96, margin: 0, color: 'var(--pl-ink-900)',
          }}>
            The prompt lifecycle,<br />
            under instrument.
          </h1>
          <p style={{
            fontSize: 20, color: 'var(--pl-ink-600)', lineHeight: 1.5,
            maxWidth: 620, marginTop: 32,
          }}>
            promptLM is a developer tool for testing LLM clients, mocking model behavior,
            and inspecting MCP traffic. Run, replay, regress.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
            <button className="pl-btn pl-btn-primary" style={{ padding: '12px 20px', fontSize: 15 }}>
              Start free
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6 H10 M7 3 L10 6 L7 9" stroke="currentColor" strokeWidth="1.4" /></svg>
            </button>
            <button className="pl-btn pl-btn-ghost" style={{ padding: '12px 20px', fontSize: 15 }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2.5" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5 6 L8 7.5 L5 9 Z" fill="currentColor" />
              </svg>
              Watch demo · 2 min
            </button>
          </div>

          {/* install line */}
          <div style={{ marginTop: 40, display: 'inline-flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', border: '1px solid var(--pl-ink-200)', borderRadius: 8,
            background: 'var(--pl-paper)', boxShadow: 'var(--pl-shadow-sm)' }}>
            <span className="pl-mono" style={{ fontSize: 13, color: 'var(--pl-ink-700)' }}>
              <span style={{ color: 'var(--pl-ink-500)' }}>$</span> npm i -D @promptlm/cli
            </span>
            <span style={{ width: 1, height: 16, background: 'var(--pl-ink-200)' }} />
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pl-ink-500)', display: 'flex', alignItems: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5 3 V1.5 H12.5 V9 H11" stroke="currentColor" strokeWidth="1.3" fill="none" />
              </svg>
            </button>
          </div>
        </div>

        {/* product shot */}
        <div style={{ marginTop: 80 }}>
          <DiffMock />
        </div>
      </section>

      {/* Three pillars */}
      <section style={{
        padding: '120px 56px',
        background: tweaks.colorfulSurfaces ? 'var(--pl-signal-soft)' : 'var(--pl-paper)',
      }}>
        <div className="pl-eyebrow" style={{ marginBottom: 16 }}>03 — capabilities</div>
        <h2 style={{ fontSize: 48, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0, marginBottom: 64, maxWidth: 760 }}>
          One tool for the full loop —<br />
          <span style={{ color: 'var(--pl-ink-500)' }}>from first prompt to thousandth regression.</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          {/* MCP inspector */}
          <div>
            <div className="pl-eyebrow" style={{ color: 'var(--pl-signal-deep)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>MCP TESTING</span>
              <span className="pl-mono" style={{
                fontSize: 9, letterSpacing: '0.1em', padding: '2px 7px', borderRadius: 3,
                border: '1px solid var(--pl-ink-300)', color: 'var(--pl-ink-600)', background: 'var(--pl-paper)',
              }}>PLANNED</span>
            </div>
            <h3 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: 0, marginBottom: 12 }}>
              Record real MCP sessions. Replay them deterministically.
            </h3>
            <p style={{ fontSize: 15, color: 'var(--pl-ink-600)', lineHeight: 1.6, marginBottom: 24, maxWidth: 480 }}>
              Capture every tool call, freeze the responses, and run them back in CI.
              No flaky network. No vendor rate limits. Same bytes, every time.
            </p>
            <McpMock />
          </div>
          {/* Diff */}
          <div>
            <div className="pl-eyebrow" style={{ color: 'var(--pl-signal-deep)', marginBottom: 12 }}>PROMPT REGRESSION</div>
            <h3 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: 0, marginBottom: 12 }}>
              Diff prompts. Track quality. Catch drift before users do.
            </h3>
            <p style={{ fontSize: 15, color: 'var(--pl-ink-600)', lineHeight: 1.6, marginBottom: 24, maxWidth: 480 }}>
              Every prompt is versioned. Every change runs the suite.
              Pass-rate, latency, and tokens land in the PR before review.
            </p>
            <DiffMock />
          </div>
        </div>

        {/* Mock LLM behavior */}
        <div style={{ marginTop: 80, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div className="pl-eyebrow" style={{ color: 'var(--pl-signal-deep)', marginBottom: 12 }}>MODEL MOCKING</div>
            <h3 style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', margin: 0, marginBottom: 16, lineHeight: 1.1 }}>
              Mock any model.<br />Test the messy edges.
            </h3>
            <p style={{ fontSize: 16, color: 'var(--pl-ink-600)', lineHeight: 1.6, marginBottom: 24, maxWidth: 460 }}>
              Inject malformed JSON. Force a refusal. Drop a tool call halfway through.
              Build the failure modes that production will eventually serve you — and write the tests
              that catch them.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Token streaming with synthetic latency', 'Tool-call sequences with deterministic seeds', 'Refusals, truncation, malformed JSON', 'Side-by-side: gpt-4o vs claude-3-5 vs gemini'].map(t => (
                <li key={t} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--pl-ink-800)' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
                    <path d="M3 8 L7 11 L13 4" stroke="var(--pl-signal-deep)" strokeWidth="1.5" strokeLinecap="square" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="pl-mono" style={{
            background: 'var(--pl-ink-900)', color: 'var(--pl-ink-200)', padding: 24,
            borderRadius: 12, fontSize: 12.5, lineHeight: 1.8, boxShadow: 'var(--pl-shadow-md)',
          }}>
            <div style={{ color: 'var(--pl-ink-500)', marginBottom: 12, fontSize: 11, letterSpacing: '0.04em' }}>// promptlm.config.ts</div>
            <div><span style={{ color: 'var(--pl-signal-bright)' }}>mock</span>(<span style={{ color: 'var(--pl-warn)' }}>'gpt-4o'</span>, &#123;</div>
            <div>&nbsp;&nbsp;<span style={{ color: 'var(--pl-ink-400)' }}>latency</span>: <span style={{ color: 'var(--pl-warn)' }}>'p95'</span>,</div>
            <div>&nbsp;&nbsp;<span style={{ color: 'var(--pl-ink-400)' }}>seed</span>: <span style={{ color: 'var(--pl-ok)' }}>42</span>,</div>
            <div>&nbsp;&nbsp;<span style={{ color: 'var(--pl-ink-400)' }}>scenarios</span>: [</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--pl-warn)' }}>'tool_refusal'</span>,</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--pl-warn)' }}>'malformed_json'</span>,</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--pl-warn)' }}>'partial_stream'</span>,</div>
            <div>&nbsp;&nbsp;],</div>
            <div>&#125;)</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '96px 56px', borderTop: '1px solid var(--pl-ink-200)',
        background: tweaks.ctaTreatment === 'signal'
          ? 'var(--pl-signal-deep)'
          : tweaks.ctaTreatment === 'gradient'
            ? 'linear-gradient(120deg, var(--pl-signal-ink) 0%, var(--pl-signal-deep) 50%, var(--pl-accent-3) 100%)'
            : 'var(--pl-ink-900)',
        color: 'var(--pl-paper)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', maxWidth: 1100 }}>
          <div>
            <div className="pl-eyebrow" style={{ color: 'var(--pl-signal-bright)', marginBottom: 24 }}>GET STARTED</div>
            <h2 style={{ fontSize: 64, fontWeight: 400, letterSpacing: '-0.035em', lineHeight: 1, margin: 0 }}>
              Ship prompts<br />like code.
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="pl-btn" style={{
              background: 'var(--pl-paper)', color: 'var(--pl-ink-900)', padding: '14px 22px', fontSize: 15,
            }}>Start free</button>
            <button className="pl-btn" style={{
              background: 'transparent', color: 'var(--pl-paper)',
              border: '1px solid var(--pl-ink-700)', padding: '14px 22px', fontSize: 15,
            }}>Read the docs</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '48px 56px', borderTop: '1px solid var(--pl-ink-200)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Wordmark size={20} mark={MarkGraph} />
            <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-500)', marginTop: 16, letterSpacing: '0.04em' }}>
              prompt lifecycle management<br />
              © 2026 · promptlm.dev
            </div>
          </div>
          <div style={{ display: 'flex', gap: 56 }}>
            {[
              ['Product', ['Test runner', 'MCP inspector', 'Mock studio', 'Diff & regress', 'CLI']],
              ['Resources', ['Docs', 'Examples', 'Changelog', 'GitHub', 'Discord']],
              ['Company', ['About', 'Pricing', 'Contact', 'Security']],
            ].map(([heading, items]) => (
              <div key={heading}>
                <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-500)', letterSpacing: '0.06em', marginBottom: 14 }}>{heading.toUpperCase()}</div>
                {items.map(i => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--pl-ink-800)', marginBottom: 8 }}>{i}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PRICING PAGE
// ─────────────────────────────────────────────────────────────
function Pricing({ tweaks = {} }) {
  const tiers = [
    {
      name: 'Local',
      price: 'Free',
      sub: 'Open source CLI · MIT',
      cta: 'Install',
      ctaStyle: 'ghost',
      features: [
        'Test runner & mock studio',
        'MCP record & replay (local)',
        'Prompt versioning (git)',
        'CLI + library',
        'Community Discord',
      ],
    },
    {
      name: 'Team',
      price: '$24',
      sub: 'per seat / month · billed annually',
      cta: 'Start 14-day trial',
      ctaStyle: 'primary',
      featured: true,
      features: [
        'Everything in Local',
        'Hosted runs & shared fixtures',
        'PR comments with diff & regression',
        'GitHub / GitLab / Linear',
        'Audit log · 90 days',
        'SSO (Google, Okta)',
      ],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      sub: 'Volume · self-hosted · BYO model',
      cta: 'Talk to us',
      ctaStyle: 'ghost',
      features: [
        'Everything in Team',
        'Self-hosted control plane',
        'Private VPC mocks',
        'SAML, SCIM, audit log unlimited',
        'Dedicated support · SLA',
        'Procurement, MSA, DPA',
      ],
    },
  ];

  return (
    <div className="pl" style={{ width: 1280, background: 'var(--pl-paper)' }}>
      <Nav current="pricing" />

      <section style={{ padding: '96px 56px 48px', textAlign: 'center' }}>
        <div className="pl-eyebrow" style={{ marginBottom: 18 }}>PRICING · MAY 2026</div>
        <h1 style={{ fontSize: 64, fontWeight: 400, letterSpacing: '-0.035em', lineHeight: 1, margin: 0 }}>
          Free locally. Fair for teams.
        </h1>
        <p style={{ fontSize: 18, color: 'var(--pl-ink-600)', lineHeight: 1.5, maxWidth: 560, margin: '24px auto 0' }}>
          The CLI is open source and always will be. Pay only when you bring a team along.
        </p>
      </section>

      <section style={{ padding: '32px 56px 96px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'stretch' }}>
          {tiers.map(t => (
            <div key={t.name} className="pl-card" style={{
              padding: 32, position: 'relative',
              background: t.featured
                ? (tweaks.ctaTreatment === 'gradient'
                    ? 'linear-gradient(135deg, var(--pl-signal-ink) 0%, var(--pl-signal-deep) 100%)'
                    : tweaks.ctaTreatment === 'signal'
                      ? 'var(--pl-signal-deep)'
                      : 'var(--pl-ink-900)')
                : (tweaks.colorfulSurfaces ? 'var(--pl-signal-soft)' : 'var(--pl-paper)'),
              color: t.featured ? 'var(--pl-paper)' : 'var(--pl-ink-900)',
              borderColor: t.featured ? 'transparent' : (tweaks.colorfulSurfaces ? 'transparent' : 'var(--pl-ink-200)'),
              boxShadow: t.featured ? 'var(--pl-shadow-lg)' : 'var(--pl-shadow-sm)',
              display: 'flex', flexDirection: 'column',
            }}>
              {t.featured && (
                <div style={{
                  position: 'absolute', top: -1, right: 24,
                  background: 'var(--pl-signal)', color: 'var(--pl-ink-900)',
                  fontFamily: 'var(--pl-mono)', fontSize: 10, letterSpacing: '0.08em',
                  padding: '4px 10px', borderRadius: '0 0 4px 4px',
                }}>POPULAR</div>
              )}
              <div className="pl-mono" style={{
                fontSize: 11, letterSpacing: '0.06em', marginBottom: 28,
                color: t.featured ? 'var(--pl-signal-bright)' : 'var(--pl-ink-500)',
              }}>{t.name.toUpperCase()}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 56, fontWeight: 400, letterSpacing: '-0.035em', lineHeight: 1 }}>{t.price}</span>
                {t.price.startsWith('$') && (
                  <span className="pl-mono" style={{ fontSize: 13, color: t.featured ? 'var(--pl-ink-400)' : 'var(--pl-ink-500)' }}>/seat</span>
                )}
              </div>
              <div className="pl-mono" style={{ fontSize: 11, color: t.featured ? 'var(--pl-ink-400)' : 'var(--pl-ink-500)', marginBottom: 28, letterSpacing: '0.02em' }}>
                {t.sub}
              </div>
              <button className="pl-btn" style={{
                marginBottom: 28,
                background: t.ctaStyle === 'primary' ? 'var(--pl-signal)' : 'transparent',
                color: t.ctaStyle === 'primary' ? 'var(--pl-ink-900)' : (t.featured ? 'var(--pl-paper)' : 'var(--pl-ink-900)'),
                border: t.ctaStyle === 'ghost' ? `1px solid ${t.featured ? 'var(--pl-ink-700)' : 'var(--pl-ink-300)'}` : '1px solid transparent',
                padding: '12px 16px', justifyContent: 'center',
              }}>{t.cta}</button>

              <div style={{
                height: 1, background: t.featured ? 'var(--pl-ink-700)' : 'var(--pl-ink-200)',
                margin: '0 0 24px',
              }} />

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {t.features.map(f => (
                  <li key={f} style={{
                    display: 'flex', gap: 10, fontSize: 13, lineHeight: 1.5,
                    color: t.featured ? 'var(--pl-ink-200)' : 'var(--pl-ink-800)',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
                      <path d="M3 7 L6 10 L11 4" stroke={t.featured ? 'var(--pl-signal-bright)' : 'var(--pl-signal-deep)'} strokeWidth="1.4" strokeLinecap="square" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* comparison row */}
        <div style={{ marginTop: 64 }}>
          <div className="pl-eyebrow" style={{ marginBottom: 20 }}>USAGE INCLUDED</div>
          <div className="pl-card" style={{ padding: 0, overflow: 'hidden' }}>
            {[
              ['Hosted runs / month', '—', '5,000', 'Unlimited'],
              ['Recorded MCP sessions', 'Unlimited (local)', '10,000', 'Unlimited'],
              ['Seats', '1', 'From 5', 'Unlimited'],
              ['Audit log retention', '—', '90 days', 'Unlimited'],
              ['Self-hosted control plane', '—', '—', '✓'],
            ].map((row, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
                padding: '16px 24px',
                borderTop: i === 0 ? 'none' : '1px solid var(--pl-ink-200)',
                fontSize: 13,
              }}>
                <span style={{ color: 'var(--pl-ink-700)' }}>{row[0]}</span>
                {row.slice(1).map((c, j) => (
                  <span key={j} className="pl-mono" style={{ color: 'var(--pl-ink-800)', fontSize: 12 }}>{c}</span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 64, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {[
            ['Is the CLI really free?', 'Yes. Apache-2 licensed. The hosted product is the only thing we charge for, and only for teams.'],
            ['Do you train on our prompts?', 'No. Ever. Your prompts and fixtures are yours. Self-hosted plan keeps everything in your VPC.'],
            ['What models do you support?', 'OpenAI, Anthropic, Google, Mistral, Cohere, plus any OpenAI-compatible endpoint. BYO via custom adapter.'],
            ['Can I migrate later?', 'Workspace exports to plain JSON / git. No lock-in is a feature, not a marketing line.'],
          ].map(([q, a]) => (
            <div key={q}>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: 'var(--pl-ink-900)' }}>{q}</div>
              <div style={{ fontSize: 14, color: 'var(--pl-ink-600)', lineHeight: 1.6 }}>{a}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DOCS PREVIEW
// ─────────────────────────────────────────────────────────────
function Docs({ tweaks = {} }) {
  const sidebar = [
    { heading: 'GET STARTED', items: ['Introduction', 'Install the CLI', 'Your first run', 'Configuration'] },
    { heading: 'CORE', items: ['Test suites', 'Fixtures', 'Mocking models', 'MCP record & replay'] },
    { heading: 'INTEGRATIONS', items: ['GitHub Actions', 'Vitest / Jest', 'OpenTelemetry', 'OpenAI-compat'] },
    { heading: 'REFERENCE', items: ['CLI', 'Config schema', 'Adapter API'] },
  ];

  return (
    <div className="pl" style={{ width: 1280, background: 'var(--pl-paper)', minHeight: 1400 }}>
      <Nav current="docs" />
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 220px', gap: 0 }}>
        {/* sidebar */}
        <aside style={{ padding: '40px 32px 40px 56px', borderRight: '1px solid var(--pl-ink-200)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', border: '1px solid var(--pl-ink-200)', borderRadius: 6, marginBottom: 32,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4" stroke="var(--pl-ink-500)" strokeWidth="1.3" />
              <path d="M9 9 L12 12" stroke="var(--pl-ink-500)" strokeWidth="1.3" />
            </svg>
            <span style={{ fontSize: 13, color: 'var(--pl-ink-500)' }}>Search docs</span>
            <div style={{ flex: 1 }} />
            <span className="pl-mono" style={{ fontSize: 10, padding: '2px 5px', border: '1px solid var(--pl-ink-200)', borderRadius: 3, color: 'var(--pl-ink-500)' }}>⌘K</span>
          </div>
          {sidebar.map(s => (
            <div key={s.heading} style={{ marginBottom: 28 }}>
              <div className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-500)', letterSpacing: '0.08em', marginBottom: 10 }}>{s.heading}</div>
              {s.items.map((it, i) => {
                const active = s.heading === 'CORE' && it === 'MCP record & replay';
                return (
                  <div key={it} style={{
                    fontSize: 13.5, padding: '5px 0',
                    color: active ? 'var(--pl-ink-900)' : 'var(--pl-ink-700)',
                    fontWeight: active ? 500 : 400,
                    borderLeft: active ? '2px solid var(--pl-signal-deep)' : '2px solid transparent',
                    paddingLeft: active ? 10 : 12, marginLeft: -12,
                  }}>{it}</div>
                );
              })}
            </div>
          ))}
        </aside>

        {/* main content */}
        <main style={{ padding: '48px 56px' }}>
          <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-500)', letterSpacing: '0.04em', marginBottom: 18 }}>
            CORE / MCP RECORD & REPLAY
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.05, margin: 0, marginBottom: 16 }}>
            MCP record & replay
          </h1>
          <p style={{ fontSize: 17, color: 'var(--pl-ink-600)', lineHeight: 1.6, marginBottom: 40 }}>
            Capture an MCP session against the real server, freeze the bytes, and play them back in CI.
            The same tool sequence, the same payloads, on every run — no flaky network, no rate limits.
          </p>

          <div style={{
            background: 'var(--pl-ink-100)', border: '1px solid var(--pl-ink-200)',
            borderLeft: '3px solid var(--pl-signal-deep)',
            padding: '16px 20px', borderRadius: 8, marginBottom: 40,
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-signal-deep)', letterSpacing: '0.06em', flexShrink: 0, marginTop: 2 }}>NOTE</div>
            <div style={{ fontSize: 13, color: 'var(--pl-ink-800)', lineHeight: 1.55 }}>
              Recordings are deterministic by default. If you need real-time fuzz, see <span className="pl-mono" style={{ color: 'var(--pl-signal-deep)' }}>--mode=live</span>.
            </div>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 12px', letterSpacing: '-0.015em' }}>1 · Record</h2>
          <p style={{ fontSize: 15, color: 'var(--pl-ink-700)', lineHeight: 1.6, marginBottom: 16 }}>
            Wrap any MCP-speaking client. promptLM intercepts the transport and writes a session file to <span className="pl-mono" style={{ color: 'var(--pl-signal-deep)' }}>.promptlm/sessions/</span>.
          </p>

          <CodeBlock
            lang="bash"
            lines={[
              ['$', 'promptlm record --server tools/calendar \\'],
              ['', '  --out booking_v3.session.json'],
              ['', ''],
              ['#', 'recorded · 14 calls · 1.2s · 8.4 KiB'],
            ]}
          />

          <h2 style={{ fontSize: 22, fontWeight: 500, margin: '32px 0 12px', letterSpacing: '-0.015em' }}>2 · Replay in tests</h2>
          <p style={{ fontSize: 15, color: 'var(--pl-ink-700)', lineHeight: 1.6, marginBottom: 16 }}>
            Use the matching helper in your test runner. The replay enforces tool-call sequence; any drift fails loud.
          </p>

          <CodeBlock
            lang="ts"
            lines={[
              ['', 'import { replay } from \'@promptlm/mcp\';'],
              ['', ''],
              ['', 'test(\'booking flow\', async () => {'],
              ['', '  await replay(\'booking_v3.session.json\', async (mcp) => {'],
              ['', '    const result = await agent.run({ mcp });'],
              ['', '    expect(result.status).toBe(\'confirmed\');'],
              ['', '  });'],
              ['', '});'],
            ]}
          />

          <h2 style={{ fontSize: 22, fontWeight: 500, margin: '32px 0 12px', letterSpacing: '-0.015em' }}>3 · Inspect</h2>
          <p style={{ fontSize: 15, color: 'var(--pl-ink-700)', lineHeight: 1.6, marginBottom: 24 }}>
            Open any session file in the inspector to see tool calls, latency, and payload diffs.
          </p>

          {/* inline mcp inspector */}
          <McpMock />

          <div style={{ marginTop: 48, display: 'flex', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid var(--pl-ink-200)' }}>
            <a style={{ color: 'var(--pl-ink-700)', textDecoration: 'none', fontSize: 13 }}>← Mocking models</a>
            <a style={{ color: 'var(--pl-ink-700)', textDecoration: 'none', fontSize: 13 }}>GitHub Actions →</a>
          </div>
        </main>

        {/* on this page */}
        <aside style={{ padding: '48px 32px', borderLeft: '1px solid var(--pl-ink-200)' }}>
          <div className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-500)', letterSpacing: '0.08em', marginBottom: 12 }}>ON THIS PAGE</div>
          {['1 · Record', '2 · Replay in tests', '3 · Inspect'].map((t, i) => (
            <div key={t} style={{
              fontSize: 12.5, padding: '5px 0',
              color: i === 0 ? 'var(--pl-ink-900)' : 'var(--pl-ink-600)',
            }}>{t}</div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function CodeBlock({ lang, lines }) {
  return (
    <div style={{
      background: 'var(--pl-ink-900)', borderRadius: 10, overflow: 'hidden',
      fontFamily: 'var(--pl-mono)', fontSize: 13, lineHeight: 1.7,
      boxShadow: 'var(--pl-shadow-sm)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '10px 16px', background: 'var(--pl-ink-800)',
        fontSize: 10, color: 'var(--pl-ink-400)', letterSpacing: '0.06em',
      }}>
        <span>{lang.toUpperCase()}</span>
        <span style={{ cursor: 'pointer' }}>copy</span>
      </div>
      <div style={{ padding: '14px 16px' }}>
        {lines.map(([prefix, content], i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 8 }}>
            <span style={{ color: prefix === '#' ? 'var(--pl-ok)' : 'var(--pl-ink-500)' }}>{prefix}</span>
            <span style={{ color: prefix === '#' ? 'var(--pl-ink-400)' : 'var(--pl-ink-200)' }}>{content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Landing, Pricing, Docs });
