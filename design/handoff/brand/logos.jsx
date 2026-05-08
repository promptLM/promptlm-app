// promptLM logo system — primary mark is the refined Graph (C2).
// All marks share: 24px grid, round caps & joins, cool slate ink + cyan signal.

const PL_INK = 'var(--pl-ink-900)';
const PL_SIGNAL = 'var(--pl-signal-deep)';

// PRIMARY · Refined Graph (C2)
// Solid ink input nodes anchor the mark; accent output node establishes destination.
function MarkGraph({ size = 24, ink = PL_INK, accent = PL_SIGNAL, mono = false }) {
  const a = mono ? ink : accent;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <line x1="7" y1="7" x2="17" y2="12" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="7" x2="7" y2="17" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="17" x2="17" y2="12" stroke={a} strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="7" cy="7" r="2.6" fill={ink} />
      <circle cx="7" cy="17" r="2.6" fill={ink} />
      <circle cx="17" cy="12" r="2.8" fill={a} />
    </svg>
  );
}

// ALTERNATE · Refined Bracket (A2) — for protocol/cli surfaces
function MarkBracket({ size = 24, ink = PL_INK, accent = PL_SIGNAL, mono = false }) {
  const a = mono ? ink : accent;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 4.5 H5 V19.5 H7.5" stroke={ink} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 4.5 H19 V19.5 H16.5" stroke={ink} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 11.5 A2.8 2.8 0 1 0 14 14.3" stroke={a} strokeWidth="1.75" strokeLinecap="round" fill="none" />
      <path d="M14.6 9.2 L14.6 11.8 L12 11.6" stroke={a} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// ALTERNATE · Token (kept for completeness)
function MarkToken({ size = 24, ink = PL_INK, accent = PL_SIGNAL, mono = false }) {
  const a = mono ? ink : accent;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.2" y="4" width="17.6" height="4" stroke={ink} strokeWidth="1.6" rx="0.5" />
      <rect x="3.2" y="10" width="11" height="4" stroke={ink} strokeWidth="1.6" rx="0.5" />
      <rect x="3.2" y="16" width="14" height="4" stroke={a} strokeWidth="1.6" rx="0.5" fill={mono ? 'none' : a} fillOpacity={mono ? 0 : 0.14} />
      <path d="M19.5 17 L21.2 18 L19.5 19" stroke={a} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// Wordmark lockup — primary uses MarkGraph, tightened spacing.
function Wordmark({ size = 28, mark: Mark = MarkGraph, accent = PL_SIGNAL, lockup = 'horizontal', mono = false }) {
  const fontSize = size * 0.88;
  const gap = size * 0.32; // tightened from 0.42
  if (lockup === 'stacked') {
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: size * 0.32 }}>
        <Mark size={size * 1.25} accent={accent} mono={mono} />
        <span style={{
          fontFamily: 'var(--pl-display)',
          fontSize, fontWeight: 400, letterSpacing: '-0.028em',
          color: 'var(--pl-ink-900)', lineHeight: 1,
        }}>
          prompt<span style={{ fontWeight: 600 }}>LM</span>
        </span>
      </div>
    );
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      <Mark size={size * 1.1} accent={accent} mono={mono} />
      <span style={{
        fontFamily: 'var(--pl-display)',
        fontSize, fontWeight: 400, letterSpacing: '-0.028em',
        color: 'var(--pl-ink-900)', lineHeight: 1,
      }}>
        prompt<span style={{ fontWeight: 600 }}>LM</span>
      </span>
    </div>
  );
}

Object.assign(window, { MarkBracket, MarkToken, MarkGraph, Wordmark });
