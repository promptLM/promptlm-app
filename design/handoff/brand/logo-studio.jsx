// Logo refinement studio — focused on Mark A (Bracket) and Mark C (Graph).
// Explores: stroke weights, corner treatments, color pairings, geometry refinements.

// ─────────────────────────────────────────────────────────────
// REFINED MARK A — Bracket variants
// All on 24px grid, varying weight, corner radius, loop geometry, colorways.
// ─────────────────────────────────────────────────────────────

// A1 · Original (baseline)
function BracketA1({ size = 32, ink = 'var(--pl-ink-900)', accent = 'var(--pl-signal-deep)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 4 H4 V20 H7" stroke={ink} strokeWidth="1.6" strokeLinecap="square" />
      <path d="M17 4 H20 V20 H17" stroke={ink} strokeWidth="1.6" strokeLinecap="square" />
      <path d="M9 14 A3 3 0 1 0 12 9.5" stroke={accent} strokeWidth="1.6" strokeLinecap="square" fill="none" />
      <path d="M14.2 9 L12 9.5 L12.5 11.7" stroke={accent} strokeWidth="1.6" strokeLinecap="square" fill="none" />
    </svg>
  );
}

// A2 · Tighter brackets, optical-corrected loop, rounded caps
function BracketA2({ size = 32, ink = 'var(--pl-ink-900)', accent = 'var(--pl-signal-deep)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* tighter bracket — terminals shortened; sw 1.75 */}
      <path d="M7.5 4.5 H5 V19.5 H7.5" stroke={ink} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 4.5 H19 V19.5 H16.5" stroke={ink} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      {/* loop — full circle minus opening, with proper arrow */}
      <path d="M14.5 11.5 A2.8 2.8 0 1 0 14 14.3" stroke={accent} strokeWidth="1.75" strokeLinecap="round" fill="none" />
      <path d="M14.6 9.2 L14.6 11.8 L12 11.6" stroke={accent} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// A3 · Heavier bracket weight, lighter loop — hierarchy
function BracketA3({ size = 32, ink = 'var(--pl-ink-900)', accent = 'var(--pl-signal-deep)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 4 H5 V20 H7" stroke={ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 4 H19 V20 H17" stroke={ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 13.8 A2.6 2.6 0 1 0 12 10" stroke={accent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M13.6 9 L12.1 10 L12.7 11.7" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// A4 · Solid bracket fill — bold/icon-friendly
function BracketA4({ size = 32, ink = 'var(--pl-ink-900)', accent = 'var(--pl-signal-deep)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* solid filled brackets */}
      <path d="M4 4 H7.8 V6 H6 V18 H7.8 V20 H4 Z" fill={ink} />
      <path d="M20 4 H16.2 V6 H18 V18 H16.2 V20 H20 Z" fill={ink} />
      {/* loop — clean circle with slot */}
      <circle cx="12" cy="12" r="2.6" stroke={accent} strokeWidth="1.6" fill="none" strokeDasharray="13 4" strokeDashoffset="2" strokeLinecap="round" />
      <path d="M14.4 10 L14.4 12 L12.4 12" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// A5 · Two-tone bracket — left ink, right accent (lifecycle metaphor)
function BracketA5({ size = 32, ink = 'var(--pl-ink-900)', accent = 'var(--pl-signal-deep)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7.5 4.5 H5 V19.5 H7.5" stroke={ink} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 4.5 H19 V19.5 H16.5" stroke={accent} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      {/* simplified loop */}
      <path d="M9.5 13 A2.5 2.5 0 1 0 12 10.5" stroke={ink} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.75" />
      <path d="M13.6 9.7 L12.1 10.5 L12.6 12" stroke={ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.75" />
    </svg>
  );
}

// A6 · Minimal — bracket stems only, dot in middle
function BracketA6({ size = 32, ink = 'var(--pl-ink-900)', accent = 'var(--pl-signal-deep)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 5 V19" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      <path d="M18 5 V19" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      <path d="M6 5 H7.5 M6 19 H7.5 M18 5 H16.5 M18 19 H16.5" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      {/* recursive arrow */}
      <path d="M10 14 A2 2 0 1 0 12 10.5 L13.5 10.5" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M13 9.3 L14 10.5 L13 11.7" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// REFINED MARK C — Graph variants
// ─────────────────────────────────────────────────────────────

// C1 · Original
function GraphC1({ size = 32, ink = 'var(--pl-ink-900)', accent = 'var(--pl-signal-deep)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <line x1="6" y1="6" x2="18" y2="12" stroke={ink} strokeWidth="1.4" />
      <line x1="6" y1="6" x2="6" y2="18" stroke={ink} strokeWidth="1.4" />
      <line x1="6" y1="18" x2="18" y2="12" stroke={accent} strokeWidth="1.4" />
      <circle cx="6" cy="6" r="2.4" fill="var(--pl-paper)" stroke={ink} strokeWidth="1.6" />
      <circle cx="6" cy="18" r="2.4" fill="var(--pl-paper)" stroke={ink} strokeWidth="1.6" />
      <circle cx="18" cy="12" r="2.4" fill={accent} stroke={accent} strokeWidth="1.6" />
    </svg>
  );
}

// C2 · Tighter geometry, edges underneath nodes (proper node-edge stacking)
function GraphC2({ size = 32, ink = 'var(--pl-ink-900)', accent = 'var(--pl-signal-deep)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* edges first, slightly thinner */}
      <line x1="7" y1="7" x2="17" y2="12" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="7" x2="7" y2="17" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="17" x2="17" y2="12" stroke={accent} strokeWidth="1.75" strokeLinecap="round" />
      {/* nodes — solid ink for inputs, accent fill for output */}
      <circle cx="7" cy="7" r="2.6" fill={ink} />
      <circle cx="7" cy="17" r="2.6" fill={ink} />
      <circle cx="17" cy="12" r="2.8" fill={accent} />
    </svg>
  );
}

// C3 · Hollow nodes with thicker edges — "wire diagram" feel
function GraphC3({ size = 32, ink = 'var(--pl-ink-900)', accent = 'var(--pl-signal-deep)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <line x1="7" y1="7" x2="17" y2="12" stroke={ink} strokeWidth="1.75" strokeLinecap="round" />
      <line x1="7" y1="7" x2="7" y2="17" stroke={ink} strokeWidth="1.75" strokeLinecap="round" />
      <line x1="7" y1="17" x2="17" y2="12" stroke={accent} strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="7" cy="7" r="2.4" fill="var(--pl-paper)" stroke={ink} strokeWidth="1.75" />
      <circle cx="7" cy="17" r="2.4" fill="var(--pl-paper)" stroke={ink} strokeWidth="1.75" />
      <circle cx="17" cy="12" r="2.6" fill={accent} stroke={accent} strokeWidth="1.75" />
    </svg>
  );
}

// C4 · Asymmetric — output node larger, with concentric ring (signal node)
function GraphC4({ size = 32, ink = 'var(--pl-ink-900)', accent = 'var(--pl-signal-deep)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <line x1="7" y1="7" x2="16.5" y2="12" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="7" x2="7" y2="17" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="17" x2="16.5" y2="12" stroke={accent} strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="7" cy="7" r="2" fill={ink} />
      <circle cx="7" cy="17" r="2" fill={ink} />
      {/* signal output — concentric */}
      <circle cx="17" cy="12" r="3.4" fill="none" stroke={accent} strokeWidth="1" opacity="0.4" />
      <circle cx="17" cy="12" r="2.4" fill={accent} />
    </svg>
  );
}

// C5 · Triangular composition, square nodes (more rigid/technical)
function GraphC5({ size = 32, ink = 'var(--pl-ink-900)', accent = 'var(--pl-signal-deep)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6.5 6.5 L17.5 12 L6.5 17.5 Z" fill="none" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" opacity="0.45" />
      <line x1="6.5" y1="17.5" x2="17.5" y2="12" stroke={accent} strokeWidth="1.75" strokeLinecap="round" />
      <rect x="4.5" y="4.5" width="4" height="4" fill={ink} rx="0.5" />
      <rect x="4.5" y="15.5" width="4" height="4" fill={ink} rx="0.5" />
      <rect x="15.5" y="10" width="4" height="4" fill={accent} rx="0.5" />
    </svg>
  );
}

// C6 · Minimal — three dots, single accent edge, no triangle
function GraphC6({ size = 32, ink = 'var(--pl-ink-900)', accent = 'var(--pl-signal-deep)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <line x1="6.5" y1="17" x2="17.5" y2="12" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      <line x1="6.5" y1="7" x2="6.5" y2="17" stroke={ink} strokeWidth="1.25" strokeLinecap="round" opacity="0.5" />
      <line x1="6.5" y1="7" x2="17.5" y2="12" stroke={ink} strokeWidth="1.25" strokeLinecap="round" opacity="0.5" />
      <circle cx="6.5" cy="7" r="2" fill={ink} />
      <circle cx="6.5" cy="17" r="2" fill={ink} />
      <circle cx="17.5" cy="12" r="2.4" fill={accent} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// STUDIO PAGE
// ─────────────────────────────────────────────────────────────

const COLORWAYS = [
  { id: 'mono',    label: 'Monochrome',     ink: 'var(--pl-ink-900)', accent: 'var(--pl-ink-900)' },
  { id: 'signal',  label: 'Cyan signal',    ink: 'var(--pl-ink-900)', accent: 'var(--pl-signal-deep)' },
  { id: 'electric',label: 'Electric blue',  ink: 'var(--pl-ink-900)', accent: 'oklch(0.55 0.22 250)' },
  { id: 'inkOnly', label: 'Soft contrast',  ink: 'var(--pl-ink-800)', accent: 'var(--pl-ink-500)' },
  { id: 'lime',    label: 'Acid lime',      ink: 'var(--pl-ink-900)', accent: 'oklch(0.78 0.20 130)' },
  { id: 'ember',   label: 'Ember',          ink: 'var(--pl-ink-900)', accent: 'oklch(0.62 0.20 30)' },
  { id: 'plum',    label: 'Plum',           ink: 'var(--pl-ink-900)', accent: 'oklch(0.50 0.20 320)' },
];

function LogoStudio() {
  const wrap = {
    width: 1280, padding: '64px 72px',
    fontFamily: 'var(--pl-display)', color: 'var(--pl-ink-900)',
    background: 'var(--pl-paper)', fontSize: 14, lineHeight: 1.5,
  };
  const sectionTitle = {
    fontFamily: 'var(--pl-mono)', fontSize: 11, fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: '0.14em',
    color: 'var(--pl-ink-600)', marginBottom: 24,
    paddingBottom: 10, borderBottom: '1px solid var(--pl-ink-200)',
    display: 'flex', justifyContent: 'space-between',
  };

  const variantsA = [
    { id: 'A1', name: 'Original',          desc: '1.6 sw · square caps · arc loop',        Mark: BracketA1 },
    { id: 'A2', name: 'Refined',           desc: '1.75 sw · round caps · tighter loop',    Mark: BracketA2, recommend: true },
    { id: 'A3', name: 'Hierarchy',         desc: 'Heavy bracket · light loop',             Mark: BracketA3 },
    { id: 'A4', name: 'Bold filled',       desc: 'Solid bracket · dashed cycle',           Mark: BracketA4 },
    { id: 'A5', name: 'Two-tone',          desc: 'Bracket carries the accent',             Mark: BracketA5 },
    { id: 'A6', name: 'Minimal',           desc: 'Stems only · stripped',                  Mark: BracketA6 },
  ];

  const variantsC = [
    { id: 'C1', name: 'Original',          desc: 'Hollow nodes · 1.4 edges',               Mark: GraphC1 },
    { id: 'C2', name: 'Refined',           desc: 'Solid input · accent output',            Mark: GraphC2, recommend: true },
    { id: 'C3', name: 'Wire diagram',      desc: 'Hollow nodes · 1.75 edges',              Mark: GraphC3 },
    { id: 'C4', name: 'Signal node',       desc: 'Concentric ring · radio metaphor',       Mark: GraphC4 },
    { id: 'C5', name: 'Square nodes',      desc: 'Triangle outline · technical',           Mark: GraphC5 },
    { id: 'C6', name: 'Minimal edge',      desc: 'Single accent edge · faded inputs',      Mark: GraphC6 },
  ];

  const VariantCard = ({ v, family }) => (
    <div style={{
      padding: 24, position: 'relative',
      background: 'var(--pl-paper)',
      border: v.recommend ? '1.5px solid var(--pl-signal-deep)' : '1px solid var(--pl-ink-200)',
      borderRadius: 12,
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {v.recommend && (
        <div className="pl-mono" style={{
          position: 'absolute', top: -1, right: 16,
          background: 'var(--pl-signal-deep)', color: 'var(--pl-paper)',
          fontSize: 9, letterSpacing: '0.08em',
          padding: '3px 8px', borderRadius: '0 0 4px 4px',
        }}>RECOMMENDED</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-ink-700)', letterSpacing: '0.06em' }}>
          {family}{v.id} · {v.name}
        </span>
      </div>
      {/* big preview */}
      <div style={{ height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--pl-canvas)', borderRadius: 8 }}>
        <v.Mark size={64} />
      </div>
      {/* size grid */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, justifyContent: 'space-between', padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <v.Mark size={16} />
          <v.Mark size={20} />
          <v.Mark size={28} />
          <v.Mark size={40} />
        </div>
        <div className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-500)', letterSpacing: '0.04em', textAlign: 'right' }}>
          16 · 20 · 28 · 40
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--pl-ink-600)', lineHeight: 1.45 }}>{v.desc}</div>
    </div>
  );

  return (
    <div className="pl" style={wrap}>
      <header style={{ marginBottom: 56 }}>
        <div className="pl-eyebrow" style={{ marginBottom: 14 }}>Logo refinement · round 2</div>
        <h1 style={{ fontSize: 56, fontWeight: 400, letterSpacing: '-0.035em', lineHeight: 1, margin: 0, maxWidth: 720 }}>
          Bracket & Graph,<br />refined.
        </h1>
        <p style={{ fontSize: 16, color: 'var(--pl-ink-600)', lineHeight: 1.55, maxWidth: 580, marginTop: 22 }}>
          Six variants per family, exploring stroke weight, corner treatment, and weight hierarchy.
          Recommended picks marked. Below: each top pick across seven colorways and four real-world contexts.
        </p>
      </header>

      {/* MARK A VARIANTS */}
      <section style={{ marginBottom: 64 }}>
        <div style={sectionTitle}><span>A · Bracket — 6 variants</span><span>same 24px grid</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {variantsA.map(v => <VariantCard key={v.id} v={v} family="A" />)}
        </div>
      </section>

      {/* MARK C VARIANTS */}
      <section style={{ marginBottom: 64 }}>
        <div style={sectionTitle}><span>C · Graph — 6 variants</span><span>same 24px grid</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {variantsC.map(v => <VariantCard key={v.id} v={v} family="C" />)}
        </div>
      </section>

      {/* COLORWAY MATRIX — top picks */}
      <section style={{ marginBottom: 64 }}>
        <div style={sectionTitle}><span>Colorways — A2 vs C2</span><span>finesse · 7 treatments</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(7, 1fr)', alignItems: 'center', gap: 0, border: '1px solid var(--pl-ink-200)', borderRadius: 12, overflow: 'hidden' }}>
          {/* header row */}
          <div style={{ height: 44, background: 'var(--pl-canvas)', borderBottom: '1px solid var(--pl-ink-200)' }} />
          {COLORWAYS.map((c, i) => (
            <div key={c.id} className="pl-mono" style={{
              height: 44, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9.5, color: 'var(--pl-ink-700)', letterSpacing: '0.04em',
              background: 'var(--pl-canvas)', borderBottom: '1px solid var(--pl-ink-200)',
              borderLeft: i === 0 ? '1px solid var(--pl-ink-200)' : 'none',
              textAlign: 'center', lineHeight: 1.2,
            }}>{c.label}</div>
          ))}
          {/* A2 row */}
          <div className="pl-mono" style={{ padding: 16, fontSize: 11, color: 'var(--pl-ink-700)', letterSpacing: '0.06em', borderBottom: '1px solid var(--pl-ink-200)' }}>
            A2 · BRACKET
          </div>
          {COLORWAYS.map((c, i) => (
            <div key={c.id} style={{
              padding: 18, display: 'flex', justifyContent: 'center', alignItems: 'center',
              borderLeft: i === 0 ? '1px solid var(--pl-ink-200)' : '1px dashed var(--pl-ink-200)',
              borderBottom: '1px solid var(--pl-ink-200)',
            }}>
              <BracketA2 size={42} ink={c.ink} accent={c.accent} />
            </div>
          ))}
          {/* C2 row */}
          <div className="pl-mono" style={{ padding: 16, fontSize: 11, color: 'var(--pl-ink-700)', letterSpacing: '0.06em' }}>
            C2 · GRAPH
          </div>
          {COLORWAYS.map((c, i) => (
            <div key={c.id} style={{
              padding: 18, display: 'flex', justifyContent: 'center', alignItems: 'center',
              borderLeft: i === 0 ? '1px solid var(--pl-ink-200)' : '1px dashed var(--pl-ink-200)',
            }}>
              <GraphC2 size={42} ink={c.ink} accent={c.accent} />
            </div>
          ))}
        </div>
      </section>

      {/* CONTEXT MATRIX */}
      <section style={{ marginBottom: 64 }}>
        <div style={sectionTitle}><span>In context</span><span>A2 + C2 · real surfaces</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {/* favicon */}
          <div className="pl-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 14 }}>
              {/* simulated browser favicon at 16px */}
              <div style={{ width: 28, height: 28, background: 'var(--pl-paper)', border: '1px solid var(--pl-ink-200)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BracketA2 size={16} />
              </div>
              <div style={{ width: 28, height: 28, background: 'var(--pl-paper)', border: '1px solid var(--pl-ink-200)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraphC2 size={16} />
              </div>
            </div>
            <div className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-500)', letterSpacing: '0.06em' }}>FAVICON · 16PX</div>
          </div>

          {/* nav lockup */}
          <div className="pl-card" style={{ padding: 24, gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '12px 16px', background: 'var(--pl-paper)', border: '1px solid var(--pl-ink-200)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
              <BracketA2 size={22} />
              <span style={{ fontSize: 18, letterSpacing: '-0.02em' }}>prompt<span style={{ fontWeight: 600 }}>LM</span></span>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--pl-paper)', border: '1px solid var(--pl-ink-200)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
              <GraphC2 size={22} />
              <span style={{ fontSize: 18, letterSpacing: '-0.02em' }}>prompt<span style={{ fontWeight: 600 }}>LM</span></span>
            </div>
            <div className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-500)', letterSpacing: '0.06em' }}>NAV LOCKUP · 22PX</div>
          </div>

          {/* dark surface */}
          <div className="pl-card" style={{ padding: 28, background: 'var(--pl-ink-900)', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <BracketA2 size={36} ink="var(--pl-paper)" accent="var(--pl-signal)" />
              <GraphC2 size={36} ink="var(--pl-paper)" accent="var(--pl-signal)" />
            </div>
            <div className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-400)', letterSpacing: '0.06em' }}>DARK SURFACE</div>
          </div>
        </div>

        {/* Hero scale */}
        <div className="pl-card" style={{ marginTop: 16, padding: 48, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <BracketA2 size={120} />
            <span className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-500)', letterSpacing: '0.06em' }}>A2 · 120PX</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <GraphC2 size={120} />
            <span className="pl-mono" style={{ fontSize: 10, color: 'var(--pl-ink-500)', letterSpacing: '0.06em' }}>C2 · 120PX</span>
          </div>
        </div>
      </section>

      {/* NOTES */}
      <section>
        <div style={sectionTitle}><span>Refinement notes</span><span>what changed</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="pl-card" style={{ padding: 24 }}>
            <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-signal-deep)', letterSpacing: '0.06em', marginBottom: 12 }}>BRACKET · A2</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--pl-ink-700)', fontSize: 13, lineHeight: 1.7 }}>
              <li>Stroke up to 1.75 (was 1.6) — more presence at 16–24px</li>
              <li>Square → round caps & joins — softens the technical edge</li>
              <li>Bracket terminals shortened by 1.5u — cleaner silhouette</li>
              <li>Loop arrowhead rebuilt as a proper L-shape — reads as "return"</li>
              <li>Loop arc tightened to r=2.8 — less crowded against brackets</li>
            </ul>
          </div>
          <div className="pl-card" style={{ padding: 24 }}>
            <div className="pl-mono" style={{ fontSize: 11, color: 'var(--pl-signal-deep)', letterSpacing: '0.06em', marginBottom: 12 }}>GRAPH · C2</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--pl-ink-700)', fontSize: 13, lineHeight: 1.7 }}>
              <li>Solid ink input nodes (was hollow) — heavier visual anchor</li>
              <li>Output node 0.4u larger — establishes destination</li>
              <li>Active edge weight 1.75 (was 1.4) — accent reads at small sizes</li>
              <li>Inactive edges 1.5 with round caps — softer hierarchy</li>
              <li>Triangle inset 1u from artboard — better optical centering</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, {
  LogoStudio,
  BracketA1, BracketA2, BracketA3, BracketA4, BracketA5, BracketA6,
  GraphC1, GraphC2, GraphC3, GraphC4, GraphC5, GraphC6,
});
