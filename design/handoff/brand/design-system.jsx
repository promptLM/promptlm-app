// Design system overview artboard for promptLM.
// Shows: logo lockups, color tokens, type scale, iconography, voice & tone.

function DSPage({ tweaks = {}, markAccents = ['var(--pl-signal-deep)','var(--pl-signal-deep)','var(--pl-signal-deep)'] }) {
  const wrap = {
    width: 1280, padding: '64px 72px',
    fontFamily: 'var(--pl-display)', color: 'var(--pl-ink-900)',
    background: 'var(--pl-paper)', fontSize: 14, lineHeight: 1.5,
  };
  const sectionTitle = {
    fontFamily: 'var(--pl-mono)', fontSize: 11, fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: '0.14em',
    color: 'var(--pl-ink-600)', marginBottom: 20,
    paddingBottom: 10, borderBottom: '1px solid var(--pl-ink-200)',
    display: 'flex', justifyContent: 'space-between',
  };
  const h2 = { fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 12, lineHeight: 1.1 };

  return (
    <div className="pl" style={wrap}>
      {/* Header */}
      <header style={{ marginBottom: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
          <div>
            <div className="pl-eyebrow" style={{ marginBottom: 14 }}>Brand system · v0.2 · May 2026</div>
            <h1 style={{ fontSize: 64, fontWeight: 400, letterSpacing: '-0.035em', lineHeight: 1, margin: 0, maxWidth: 720 }}>
              A precision instrument<br />for prompt lifecycles.
            </h1>
            <p style={{ fontSize: 17, color: 'var(--pl-ink-600)', lineHeight: 1.55, maxWidth: 540, marginTop: 24 }}>
              promptLM is a developer tool — the brand reflects that. Cool slate neutrals, electric cyan signal,
              monospace eyebrows, no decoration that doesn't earn its place.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Wordmark size={26} mark={MarkGraph} />
            <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-500)', marginTop: 14, letterSpacing: '0.04em' }}>
              promptlm.dev
            </div>
          </div>
        </div>
      </header>

      {/* LOGO */}
      <section style={{ marginBottom: 80 }}>
        <div style={sectionTitle}><span>01 — Logo & marks</span><span>Graph primary · 2 alternates</span></div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { name: 'PRIMARY · Graph', desc: 'MCP-native node graph. Refined: solid input nodes anchor, accent output establishes destination. Used everywhere by default.', Mark: MarkGraph, accent: markAccents[0], soft: 'var(--pl-signal-soft)' },
            { name: 'ALT · Bracket', desc: 'For CLI surfaces, terminal contexts, code-adjacent moments. Refined: 1.75 stroke, round caps, tightened loop.', Mark: MarkBracket, accent: markAccents[1], soft: 'var(--pl-accent-2-soft)' },
            { name: 'ALT · Token', desc: 'For prompt-versioning surfaces and structured-output features. Stacked rows + chevron.', Mark: MarkToken, accent: markAccents[2], soft: 'var(--pl-accent-3-soft)' },
          ].map(({ name, desc, Mark, accent, soft }) => (
            <div key={name} className="pl-card" style={{
              padding: 28, display: 'flex', flexDirection: 'column', gap: 24,
              background: tweaks.colorfulSurfaces ? soft : 'var(--pl-paper)',
              borderColor: tweaks.colorfulSurfaces ? 'transparent' : 'var(--pl-ink-200)',
            }}>
              <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-600)', letterSpacing: '0.04em' }}>{name}</div>
              <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                <Wordmark size={28} mark={Mark} accent={accent} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--pl-ink-600)', lineHeight: 1.5 }}>{desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingTop: 12, borderTop: '1px dashed rgba(0,0,0,0.15)' }}>
                <Mark size={16} accent={accent} />
                <Mark size={24} accent={accent} />
                <Mark size={36} accent={accent} />
                <Mark size={48} accent={accent} />
              </div>
            </div>
          ))}
        </div>

        {/* lockups */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: 16 }}>
          <div className="pl-card" style={{ padding: 28, background: 'var(--pl-ink-900)' }}>
            <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-400)', letterSpacing: '0.04em', marginBottom: 28 }}>
              Inverse / dark surface
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 11 }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <line x1="7" y1="7" x2="17" y2="12" stroke="var(--pl-paper)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="7" y1="7" x2="7" y2="17" stroke="var(--pl-paper)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="7" y1="17" x2="17" y2="12" stroke="var(--pl-signal)" strokeWidth="1.75" strokeLinecap="round" />
                <circle cx="7" cy="7" r="2.6" fill="var(--pl-paper)" />
                <circle cx="7" cy="17" r="2.6" fill="var(--pl-paper)" />
                <circle cx="17" cy="12" r="2.8" fill="var(--pl-signal)" />
              </svg>
              <span style={{ fontFamily: 'var(--pl-display)', fontSize: 28, color: 'var(--pl-paper)', letterSpacing: '-0.028em' }}>
                prompt<span style={{ fontWeight: 600 }}>LM</span>
              </span>
            </div>
          </div>
          <div className="pl-card" style={{ padding: 28 }}>
            <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-500)', letterSpacing: '0.04em', marginBottom: 28 }}>
              Stacked
            </div>
            <Wordmark size={22} mark={MarkGraph} lockup="stacked" />
          </div>
          <div className="pl-card" style={{ padding: 28 }}>
            <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-500)', letterSpacing: '0.04em', marginBottom: 28 }}>
              Mono lockup
            </div>
            <Wordmark size={28} mark={MarkGraph} mono />
          </div>
        </div>
      </section>

      {/* COLOR */}
      <section style={{ marginBottom: 80 }}>
        <div style={sectionTitle}><span>02 — Color tokens</span><span>oklch · cool slate + cyan signal</span></div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
          {/* Ink ramp */}
          <div>
            <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-500)', letterSpacing: '0.04em', marginBottom: 12 }}>
              Ink ramp · slate
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', borderRadius: 'var(--pl-r-md)', overflow: 'hidden', border: '1px solid var(--pl-ink-200)' }}>
              {[
                ['paper', '0.985 .003 240'],
                ['100', '0.965 .004 240'],
                ['200', '0.92 .006 240'],
                ['300', '0.84 .008 240'],
                ['400', '0.72 .010 245'],
                ['500', '0.58 .012 250'],
                ['600', '0.45 .015 250'],
                ['700', '0.32 .018 250'],
                ['800', '0.22 .020 250'],
                ['900', '0.16 .020 250'],
              ].map(([name, val], i) => (
                <div key={name} style={{
                  background: name === 'paper' ? 'var(--pl-paper)' : `var(--pl-ink-${name})`,
                  height: 110, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  color: i >= 6 ? 'var(--pl-paper)' : 'var(--pl-ink-800)',
                }}>
                  <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 11, letterSpacing: '0.04em' }}>ink.{name}</span>
                  <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 10, opacity: 0.7 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Signal + functional */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div>
              <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-500)', letterSpacing: '0.04em', marginBottom: 12 }}>
                Signal · electric cyan
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderRadius: 'var(--pl-r-md)', overflow: 'hidden', border: '1px solid var(--pl-ink-200)' }}>
                {[
                  ['signal.bright', 'var(--pl-signal-bright)', '0.86 .18 215'],
                  ['signal', 'var(--pl-signal)', '0.78 .16 220'],
                  ['signal.deep', 'var(--pl-signal-deep)', '0.55 .18 235'],
                  ['signal.ink', 'var(--pl-signal-ink)', '0.32 .14 240'],
                ].map(([name, bg, val], i) => (
                  <div key={name} style={{
                    background: bg, height: 110, padding: 14,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    color: i >= 2 ? 'var(--pl-paper)' : 'var(--pl-ink-900)',
                  }}>
                    <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 11, letterSpacing: '0.04em' }}>{name}</span>
                    <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 10, opacity: 0.7 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-500)', letterSpacing: '0.04em', marginBottom: 12 }}>
                Functional
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderRadius: 'var(--pl-r-md)', overflow: 'hidden', border: '1px solid var(--pl-ink-200)' }}>
                {[
                  ['ok', 'var(--pl-ok)'],
                  ['warn', 'var(--pl-warn)'],
                  ['fail', 'var(--pl-fail)'],
                ].map(([name, bg]) => (
                  <div key={name} style={{
                    background: bg, height: 110, padding: 14,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    color: 'var(--pl-ink-900)',
                  }}>
                    <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 11, letterSpacing: '0.04em' }}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TYPE */}
      <section style={{ marginBottom: 80 }}>
        <div style={sectionTitle}><span>03 — Typography</span><span>Geist · JetBrains Mono</span></div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
          <div className="pl-card" style={{ padding: 36 }}>
            <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-500)', letterSpacing: '0.04em', marginBottom: 28 }}>
              Display · Geist
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                { size: 64, weight: 400, label: 'display/64 · regular', text: 'Test prompts. Mock LLMs.' },
                { size: 40, weight: 400, label: 'h1/40 · regular', text: 'Lifecycle, end-to-end.' },
                { size: 24, weight: 500, label: 'h2/24 · medium', text: 'Run, replay, regress.' },
                { size: 17, weight: 400, label: 'body/17 · regular', text: 'A precision instrument for the prompt lifecycle — built for engineering teams shipping LLM products.' },
                { size: 14, weight: 400, label: 'small/14 · regular', text: 'Mock model behavior, fixture-test clients, inspect MCP traffic.' },
              ].map(({ size, weight, label, text }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
                  <div className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-500)', minWidth: 130, letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ fontSize: size, fontWeight: weight, letterSpacing: size >= 40 ? '-0.03em' : '-0.015em', lineHeight: 1.1 }}>
                    {text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pl-card" style={{ padding: 36 }}>
            <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-500)', letterSpacing: '0.04em', marginBottom: 28 }}>
              Mono · JetBrains Mono
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div>
                <div className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-500)', marginBottom: 8, letterSpacing: '0.04em' }}>EYEBROW · 11/0.14em</div>
                <div className="pl-eyebrow">PROMPT · LIFECYCLE · MGMT</div>
              </div>
              <div>
                <div className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-500)', marginBottom: 8, letterSpacing: '0.04em' }}>CODE · 13</div>
                <div className="pl-mono" style={{ fontSize: 13, color: 'var(--pl-ink-800)' }}>
                  promptlm run --suite=agents/v3 \<br />
                  &nbsp;&nbsp;--mock=gpt-4o --record
                </div>
              </div>
              <div>
                <div className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-500)', marginBottom: 8, letterSpacing: '0.04em' }}>NUMERIC · 32 · TABULAR</div>
                <div className="pl-mono" style={{ fontSize: 32, color: 'var(--pl-ink-900)', fontVariantNumeric: 'tabular-nums' }}>
                  1,284<span style={{ color: 'var(--pl-ink-500)', fontSize: 14, marginLeft: 8 }}>runs/day</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ICONS */}
      <section style={{ marginBottom: 80 }}>
        <div style={sectionTitle}><span>04 — Iconography</span><span>1.5px stroke · 24px grid · square caps</span></div>
        <div className="pl-card" style={{ padding: 36 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 0 }}>
            {[
              ['run', <><polygon points="7,5 19,12 7,19" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter" fill="none" /></>],
              ['replay', <><path d="M5 8 H14 A4 4 0 1 1 10 16 H8" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M7 5 L4 8 L7 11" stroke="currentColor" strokeWidth="1.5" fill="none" /></>],
              ['suite', <><rect x="4" y="4" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none" /><rect x="13" y="4" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none" /><rect x="4" y="13" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none" /><rect x="13" y="13" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none" /></>],
              ['mock', <><circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M9 11 L11 13 L15 9" stroke="currentColor" strokeWidth="1.5" fill="none" /></>],
              ['mcp-node', <><circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" /><circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" /><circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" /><line x1="8.5" y1="12" x2="15.5" y2="6.5" stroke="currentColor" strokeWidth="1.5" /><line x1="8.5" y1="12" x2="15.5" y2="17.5" stroke="currentColor" strokeWidth="1.5" /></>],
              ['diff', <><path d="M5 4 V20" stroke="currentColor" strokeWidth="1.5" /><path d="M12 4 V20" stroke="currentColor" strokeWidth="1.5" /><path d="M19 4 V20" stroke="currentColor" strokeWidth="1.5" /><path d="M7 8 H10" stroke="currentColor" strokeWidth="1.5" /><path d="M14 13 H17" stroke="currentColor" strokeWidth="1.5" /></>],
              ['record', <><circle cx="12" cy="12" r="4" fill="currentColor" /><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" /></>],
              ['fixture', <><rect x="4" y="6" width="16" height="12" stroke="currentColor" strokeWidth="1.5" fill="none" /><line x1="4" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="1.5" /><line x1="9" y1="10" x2="9" y2="18" stroke="currentColor" strokeWidth="1.5" /></>],
            ].map(([name, paths], i) => (
              <div key={name} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                padding: '24px 0',
                borderRight: i % 8 !== 7 ? '1px solid var(--pl-ink-200)' : 'none',
                color: 'var(--pl-ink-800)',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">{paths}</svg>
                <span className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-500)', letterSpacing: '0.04em' }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VOICE */}
      <section style={{ marginBottom: 32 }}>
        <div style={sectionTitle}><span>05 — Voice & tone</span><span>Direct · technical · unsentimental</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { tag: 'Direct', do_: 'Mock model behavior. Replay traffic. Regress prompts.', dont: 'Unleash the future of AI evaluation with our magical platform.' },
            { tag: 'Specific', do_: 'Capture an MCP session, freeze tool responses, replay deterministically.', dont: 'Powerful workflows for next-generation agents.' },
            { tag: 'Quiet', do_: 'It runs. It logs. It diffs. You ship.', dont: 'Revolutionize. Empower. Reimagine.' },
          ].map(({ tag, do_, dont }) => (
            <div key={tag} className="pl-card" style={{ padding: 24 }}>
              <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-signal-deep)', letterSpacing: '0.04em', marginBottom: 14 }}>{tag.toUpperCase()}</div>
              <div style={{ borderLeft: '2px solid var(--pl-ok)', paddingLeft: 12, marginBottom: 14 }}>
                <div className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-500)', marginBottom: 4 }}>DO</div>
                <div style={{ fontSize: 14, color: 'var(--pl-ink-900)', lineHeight: 1.5 }}>{do_}</div>
              </div>
              <div style={{ borderLeft: '2px solid var(--pl-fail)', paddingLeft: 12 }}>
                <div className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-500)', marginBottom: 4 }}>DON'T</div>
                <div style={{ fontSize: 14, color: 'var(--pl-ink-600)', lineHeight: 1.5, textDecoration: 'line-through', textDecorationColor: 'var(--pl-ink-300)' }}>{dont}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ paddingTop: 32, borderTop: '1px solid var(--pl-ink-200)', display: 'flex', justifyContent: 'space-between' }}>
        <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-500)', letterSpacing: '0.04em' }}>
          promptLM · brand system v0.1
        </div>
        <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-500)', letterSpacing: '0.04em' }}>
          [ end of doc ]
        </div>
      </footer>
    </div>
  );
}

Object.assign(window, { DSPage });
