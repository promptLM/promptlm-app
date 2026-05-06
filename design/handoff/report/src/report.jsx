// product-report.jsx — Static published report (corpus edition)
//
// The CLI generates this from spec data only. It is regenerated on
// every push to main, reflects the LATEST commit, and is published
// to GitHub Pages / S3 / Vercel as a single static .html.
//
//   $ promptlm report --out site/         # one-off
//   - or -
//   on: push to main → promptlm report → publish        # CI
//
// Audience: anyone who wants to understand the repo at a glance —
// a teammate joining the project, a reviewer on a PR, an exec
// asking "what prompts do we have, and what just changed?".
//
// Two halves:
//   Part A — History · navigate every change to the corpus over time,
//            diffed at the PromptSpec level (model changed, message
//            edited, placeholder added — not raw line-level TOML).
//   Part B — Catalog · the corpus at HEAD, organised so it's easy
//            to scan: by group, by model, by placeholder.

function ProductReport() {
  return (
    <div style={{
      background: 'var(--pl-canvas)',
      fontFamily: 'var(--pl-display)',
      color: 'var(--pl-ink-900)',
      minHeight: '100%',
    }}>
      {/* ───────────────────── Document header strip ─────────── */}
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
        <div style={{ flex: 1 }} />
        <Mono size={11} color="var(--pl-ink-500)" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: 'oklch(0.55 0.13 155)' }} />
          live · regenerated on push to <span style={{ color: 'var(--pl-ink-800)' }}>main</span>
        </Mono>
        <span style={{ width: 1, height: 12, background: 'var(--pl-ink-300)' }} />
        <a href="#" style={{
          fontFamily: 'var(--pl-mono)', fontSize: 11,
          color: 'var(--pl-signal-deep)', textDecoration: 'none',
          borderBottom: '1px dashed var(--pl-signal-deep)',
        }}>specs.json ↓</a>
      </div>

      {/* ───────────────────── Title block ───────────────────── */}
      <div style={{ padding: '48px 56px 24px' }}>
        <Mono size={11} color="var(--pl-ink-500)" style={{ letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14, display: 'block' }}>
          Repository report
        </Mono>
        <h1 style={{
          margin: 0, fontFamily: 'var(--pl-display)',
          fontSize: 46, fontWeight: 500, letterSpacing: '-0.02em',
          lineHeight: 1.05, color: 'var(--pl-ink-900)',
          maxWidth: 880,
        }}>
          What's in this repo,
          <span style={{ color: 'var(--pl-ink-500)' }}> and how it got that way.</span>
        </h1>
        <p style={{
          margin: '18px 0 0', fontSize: 16, lineHeight: 1.55,
          color: 'var(--pl-ink-600)', maxWidth: 720,
        }}>
          A standing view of <Mono color="var(--pl-ink-700)">prompts/**.toml</Mono>:{' '}
          every prompt at HEAD, every change that brought it here. Generated from spec
          files alone — no runtime, no telemetry.
        </p>

        {/* Latest commit card — the trigger that produced this build */}
        <LatestCommitCard />
      </div>

      {/* ═════════════════════════════════════════════════════════════
          PART A — HISTORY
          ═════════════════════════════════════════════════════════════ */}
      <PartHeader letter="A" title="History" sub="Every change to the corpus, newest first." />

      {/* ───────────────────── §01 Activity ─────────── */}
      <ReportSection num="01" title="Activity" anchor="activity">
        <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.6, color: 'var(--pl-ink-700)', maxWidth: 720 }}>
          Commits to <Mono color="var(--pl-ink-900)">prompts/</Mono> over the last 90 days.
          Each cell counts spec edits on that day — click through to the timeline.
        </p>
        <ActivityHeatmap />
      </ReportSection>

      {/* ───────────────────── §02 Timeline ─────────── */}
      <ReportSection num="02" title="Timeline" anchor="timeline">
        <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.6, color: 'var(--pl-ink-700)', maxWidth: 720 }}>
          Spec-level changes: a prompt was added, a field was changed, a placeholder
          appeared. Diffs are computed at the <Mono color="var(--pl-ink-900)">PromptSpec</Mono>{' '}
          level, not the raw file — so renaming a key shows up as a key change, not
          twelve line moves.
        </p>
        <ChangeTimeline />
      </ReportSection>

      {/* ───────────────────── §03 Spec diff ─────────── */}
      <ReportSection num="03" title="Spec diff · doc-rag-answer · r33 → r34" anchor="diff">
        <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.6, color: 'var(--pl-ink-700)', maxWidth: 720 }}>
          The latest meaningful change. Diff is rendered from the parsed{' '}
          <Mono color="var(--pl-ink-900)">PromptSpec</Mono> JSON: fields that
          changed are grouped by section, additions in green, removals in oxblood,
          unchanged fields collapsed.
        </p>
        <SpecDiff />
      </ReportSection>

      {/* ───────────────────── §04 Authors ─────────── */}
      <ReportSection num="04" title="Authors" anchor="authors">
        <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.6, color: 'var(--pl-ink-700)', maxWidth: 720 }}>
          Everyone who has touched a spec. Counted from{' '}
          <Mono color="var(--pl-ink-900)">git log</Mono> across the entire history
          of <Mono color="var(--pl-ink-900)">prompts/</Mono>.
        </p>
        <AuthorsTable />
      </ReportSection>

      {/* ═════════════════════════════════════════════════════════════
          PART B — CATALOG
          ═════════════════════════════════════════════════════════════ */}
      <PartHeader letter="B" title="Catalog at HEAD" sub="The corpus as it stands right now." />

      {/* ───────────────────── §05 By group ─────────── */}
      <ReportSection num="05" title="By group" anchor="groups">
        <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.6, color: 'var(--pl-ink-700)', maxWidth: 720 }}>
          Twelve prompts across five groups. Each row is a spec file in{' '}
          <Mono color="var(--pl-ink-900)">prompts/</Mono>.
        </p>
        <GroupBlocks />
      </ReportSection>

      {/* ───────────────────── §06 Models in use ─────────── */}
      <ReportSection num="06" title="Models in use" anchor="models">
        <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.6, color: 'var(--pl-ink-700)', maxWidth: 720 }}>
          Distinct <Mono color="var(--pl-ink-900)">request.model</Mono> values
          declared across all specs. A prompt counts once per model it pins.
        </p>
        <ModelMatrix />
      </ReportSection>

      {/* ───────────────────── §07 Placeholder index ─────────── */}
      <ReportSection num="07" title="Placeholder index" anchor="placeholders">
        <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.6, color: 'var(--pl-ink-700)', maxWidth: 720 }}>
          Every variable referenced by every prompt at HEAD. Useful for spotting
          inconsistent naming (<Mono>user_id</Mono> vs <Mono>userId</Mono>) and shared inputs.
        </p>
        <PlaceholderIndex />
      </ReportSection>

      {/* ───────────────────── How to read this ─────────── */}
      <div style={{
        margin: '64px 56px 0', padding: '32px 0 0',
        borderTop: '1px solid var(--pl-ink-200)',
        display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 32,
        paddingBottom: 56,
      }}>
        <div>
          <Mono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            How to read this
          </Mono>
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: 'var(--pl-ink-700)' }}>
          Everything is derived from the spec files in your repository.
          Diffs are computed from the parsed{' '}
          <Mono color="var(--pl-ink-900)">PromptSpec</Mono> JSON, so you see
          field-level changes (a model swapped, a placeholder renamed) instead
          of raw TOML line moves. Authors come from{' '}
          <Mono color="var(--pl-ink-900)">git log</Mono>.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: 'var(--pl-ink-700)' }}>
          This page is regenerated on every push to{' '}
          <Mono color="var(--pl-ink-900)">main</Mono>. Run{' '}
          <Mono color="var(--pl-ink-900)">promptlm report</Mono> locally for the
          same output. The output is a single static{' '}
          <Mono color="var(--pl-ink-900)">.html</Mono> with no beacons — once
          shipped, it is just a document.
        </p>
      </div>

      {/* ───────────────────── Footer ─────────── */}
      <div style={{
        padding: '20px 56px',
        borderTop: '1px solid var(--pl-ink-200)',
        background: 'var(--pl-paper)',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <Mono size={11} color="var(--pl-ink-500)">
          generated by <span style={{ color: 'var(--pl-ink-800)' }}>promptlm@0.4.2</span>
        </Mono>
        <span style={{ width: 1, height: 12, background: 'var(--pl-ink-300)' }} />
        <Mono size={11} color="var(--pl-ink-500)">
          source <span style={{ color: 'var(--pl-ink-800)' }}>github.com/acme/agents · main · 3f7c2e1</span>
        </Mono>
        <div style={{ flex: 1 }} />
        <Mono size={11} color="var(--pl-ink-500)">
          host: github pages · static
        </Mono>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Latest commit card — what triggered this build
// ─────────────────────────────────────────────────────────────
function LatestCommitCard() {
  return (
    <div style={{
      marginTop: 32,
      border: '1px solid var(--pl-ink-200)',
      background: 'var(--pl-paper)',
      borderRadius: 10,
      padding: '20px 24px',
      display: 'grid',
      gridTemplateColumns: '180px 1fr',
      gap: 24,
      alignItems: 'flex-start',
    }}>
      <Mono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.14em', textTransform: 'uppercase', paddingTop: 4 }}>
        Built from
      </Mono>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <Mono size={14} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>3f7c2e1</Mono>
          <span style={{ fontSize: 16, color: 'var(--pl-ink-900)' }}>
            doc-rag-answer: expand to 8 chunks, add ambiguity rule
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
          <Mono size={11.5} color="var(--pl-ink-700)">j.santos</Mono>
          <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
          <Mono size={11.5} color="var(--pl-ink-500)">2025-01-14 09:11 UTC · 3 min ago</Mono>
          <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
          <Mono size={11.5} color="var(--pl-ink-500)">via PR <span style={{ color: 'var(--pl-signal-deep)' }}>#284</span></Mono>
          <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '2px 8px', borderRadius: 999,
            background: 'oklch(0.97 0.04 155)', border: '1px solid oklch(0.86 0.05 155)',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: 'oklch(0.55 0.13 155)' }} />
            <Mono size={10} color="oklch(0.40 0.12 155)" style={{ fontWeight: 500, letterSpacing: '0.06em' }}>CI · GREEN</Mono>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function PartHeader({ letter, title, sub }) {
  return (
    <div style={{
      padding: '48px 56px 28px',
      borderTop: '1px solid var(--pl-ink-200)',
      background: 'var(--pl-paper)',
      display: 'flex', alignItems: 'baseline', gap: 22,
    }}>
      <span style={{
        fontFamily: 'var(--pl-mono)', fontSize: 56, fontWeight: 500,
        color: 'var(--pl-ink-200)', lineHeight: 1, letterSpacing: '-0.04em',
      }}>{letter}</span>
      <div>
        <Mono size={11} color="var(--pl-ink-500)" style={{ letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Part {letter}
        </Mono>
        <h2 style={{
          margin: '4px 0 0', fontFamily: 'var(--pl-display)',
          fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em',
          color: 'var(--pl-ink-900)', lineHeight: 1.1,
        }}>{title}</h2>
        {sub && (
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--pl-ink-600)' }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

function ReportSection({ num, title, anchor, children }) {
  return (
    <section id={anchor} style={{ padding: '36px 56px', borderTop: '1px solid var(--pl-ink-200)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
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

// ─────────────────────────────────────────────────────────────
// Activity heatmap — 90 days × commit count
// ─────────────────────────────────────────────────────────────
function ActivityHeatmap() {
  // 13 weeks × 7 days. Pseudorandom but deterministic.
  const W = 13, D = 7;
  const data = [];
  for (let i = 0; i < W * D; i++) {
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const r = seed - Math.floor(seed);
    let v = 0;
    if (r > 0.55) v = 1;
    if (r > 0.78) v = 2;
    if (r > 0.91) v = 3;
    if (r > 0.97) v = 4;
    // weekends quieter
    if (i % 7 >= 5 && r < 0.85) v = Math.max(0, v - 1);
    data.push(v);
  }
  // make today (last cell) = 4 (just-shipped)
  data[data.length - 1] = 4;
  data[data.length - 2] = 3;

  const colors = [
    'var(--pl-ink-100)',
    'oklch(0.92 0.05 240)',
    'oklch(0.85 0.10 240)',
    'oklch(0.72 0.13 240)',
    'oklch(0.55 0.15 240)',
  ];

  const months = ['Oct', 'Nov', 'Dec', 'Jan'];
  const days = ['Mon', '', 'Wed', '', 'Fri', '', ''];

  let total = data.reduce((a, b) => a + b, 0);

  return (
    <div style={{ border: '1px solid var(--pl-ink-200)', borderRadius: 10, background: 'var(--pl-paper)', padding: '20px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 6, alignItems: 'center' }}>
        <div /> {/* spacer */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 4, paddingLeft: 2, paddingBottom: 8 }}>
          {months.map((m, i) => (
            <Mono key={i} size={10} color="var(--pl-ink-500)" style={{ gridColumn: `${i * 3 + 1} / span 3` }}>{m}</Mono>
          ))}
        </div>

        {Array.from({ length: D }).map((_, di) => (
          <React.Fragment key={di}>
            <Mono size={10} color="var(--pl-ink-500)" style={{ textAlign: 'right', paddingRight: 8 }}>
              {days[di]}
            </Mono>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 4 }}>
              {Array.from({ length: W }).map((_, wi) => {
                const v = data[wi * D + di];
                return (
                  <span key={wi} style={{
                    aspectRatio: '1', borderRadius: 3,
                    background: colors[v],
                    border: v === 0 ? '1px solid var(--pl-ink-200)' : 'none',
                  }} title={`${v} commit${v === 1 ? '' : 's'}`} />
                );
              })}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--pl-ink-200)' }}>
        <Mono size={11} color="var(--pl-ink-700)">{total} commits · last 90 days</Mono>
        <div style={{ flex: 1 }} />
        <Mono size={10} color="var(--pl-ink-500)">less</Mono>
        {colors.map((c, i) => (
          <span key={i} style={{ width: 11, height: 11, borderRadius: 3, background: c, border: i === 0 ? '1px solid var(--pl-ink-200)' : 'none' }} />
        ))}
        <Mono size={10} color="var(--pl-ink-500)">more</Mono>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Change timeline — every spec-level change, newest first
// ─────────────────────────────────────────────────────────────
function ChangeTimeline() {
  // Each entry is a structured PromptSpec change (not a TOML line edit).
  // 'changes' is an array of small chips that summarise what moved.
  const entries = [
    { sha: '3f7c2e1', when: '3 min ago',  date: 'Tue Jan 14 09:11', author: 'j.santos', kind: 'edit', prompt: 'doc-rag-answer', rev: 'r33→r34', msg: 'expand to 8 chunks, add ambiguity rule', changes: [
      { f: 'rules.length', d: '4 → 8', tone: 'edit' },
      { f: 'rules[+]', d: 'contradiction · ambiguity', tone: 'add' },
    ], pr: '#284', focus: true },
    { sha: 'cc911',   when: '14 hr ago', date: 'Mon Jan 13 19:02', author: 'l.kim',    kind: 'edit', prompt: 'extract-line-items', rev: 'r12→r13', msg: 'add tax-line handling', changes: [
      { f: 'placeholders[+]', d: 'tax_lines', tone: 'add' },
      { f: 'rules[+]', d: 'tax handling', tone: 'add' },
    ], pr: '#283' },
    { sha: 'cc910',   when: '20 hr ago', date: 'Mon Jan 13 13:14', author: 'l.kim',    kind: 'add',  prompt: 'meeting-notes-cleanup', rev: 'r1', msg: 'initial · drop verbatim filler, normalise speakers', changes: [
      { f: 'group', d: 'agents', tone: 'meta' },
      { f: 'model', d: 'claude-haiku-4-5', tone: 'meta' },
      { f: 'placeholders', d: '1', tone: 'meta' },
      { f: 'messages', d: '2', tone: 'meta' },
    ], pr: '#282' },
    { sha: 'b41d3',   when: '2 days',    date: 'Sun Jan 12 11:08', author: 'm.holm',   kind: 'edit', prompt: 'support-triage-classifier', rev: 'r23→r24', msg: 'reorder priority enum', changes: [
      { f: 'placeholders.priority.enum', d: 'reordered', tone: 'edit' },
    ], pr: '#281' },
    { sha: 'b41d2',   when: '3 days',    date: 'Sat Jan 11 16:40', author: 'm.holm',   kind: 'edit', prompt: 'support-triage-classifier', rev: 'r23→r24', msg: 'add new topic: billing-dispute', changes: [
      { f: 'placeholders.topic.enum[+]', d: 'billing-dispute', tone: 'add' },
      { f: 'rules[+]', d: 'billing handling', tone: 'add' },
    ], pr: '#280' },
    { sha: '0aa18',   when: '4 days',    date: 'Fri Jan 10 09:21', author: 'j.santos', kind: 'edit', prompt: 'mcp-tool-router', rev: 'r17', msg: 'fix typo in system message', changes: [
      { f: 'messages[0].content', d: '~', tone: 'edit' },
    ], pr: '#279' },
    { sha: '0aa17',   when: '4 days',    date: 'Fri Jan 10 08:55', author: 'j.santos', kind: 'edit', prompt: 'mcp-tool-router', rev: 'r16→r17', msg: 'switch model to haiku, add explicit refusal', changes: [
      { f: 'request.model', d: 'sonnet-4-5 → haiku-4-5', tone: 'edit' },
      { f: 'rules[+]', d: 'refusal', tone: 'add' },
    ], pr: '#278' },
    { sha: '3201a',   when: '5 days',    date: 'Thu Jan  9 14:12', author: 'a.nguyen', kind: 'edit', prompt: 'pr-summarizer', rev: 'r8→r9', msg: 'tighten title length', changes: [
      { f: 'rules.title_max_chars', d: '120 → 80', tone: 'edit' },
    ], pr: '#277' },
    { sha: '7e2ff',   when: '6 days',    date: 'Wed Jan  8 10:44', author: 'j.santos', kind: 'edit', prompt: 'doc-rag-answer', rev: 'r32→r33', msg: 'add citation format rule', changes: [
      { f: 'rules[+]', d: 'citation format', tone: 'add' },
    ], pr: '#276' },
    { sha: 'a91c4',   when: '7 days',    date: 'Tue Jan  7 12:30', author: 'l.kim',    kind: 'edit', prompt: 'extract-line-items', rev: 'r11→r12', msg: 'normalise currency symbols', changes: [
      { f: 'rules[+]', d: 'currency normalisation', tone: 'edit' },
    ], pr: '#275' },
  ];

  const kindStyles = {
    add:    { label: 'A', bd: 'oklch(0.55 0.13 155)', bg: 'oklch(0.97 0.04 155)', col: 'oklch(0.40 0.12 155)' },
    edit:   { label: 'M', bd: 'var(--pl-signal-deep)', bg: 'oklch(0.97 0.03 240)', col: 'var(--pl-signal-deep)' },
    del:    { label: 'D', bd: 'oklch(0.55 0.15 25)',  bg: 'oklch(0.97 0.04 25)',  col: 'oklch(0.45 0.13 25)' },
    rename: { label: 'R', bd: 'oklch(0.55 0.13 75)',  bg: 'oklch(0.97 0.04 75)',  col: 'oklch(0.45 0.13 75)' },
  };

  return (
    <div>
      {/* Filter strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 16px',
        border: '1px solid var(--pl-ink-200)', borderRadius: 8,
        background: 'var(--pl-paper)', marginBottom: 16,
      }}>
        <Mono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>
          {entries.length} entries
        </Mono>
        <span style={{ width: 1, height: 14, background: 'var(--pl-ink-200)' }} />
        {[
          ['All', true],
          ['Added', false],
          ['Edited', false],
          ['Removed', false],
          ['Renamed', false],
        ].map(([l, active]) => (
          <button key={l} style={{
            background: active ? 'var(--pl-ink-100)' : 'transparent',
            border: '1px solid', borderColor: active ? 'var(--pl-ink-300)' : 'transparent',
            padding: '3px 10px', borderRadius: 5,
            fontSize: 11.5, color: active ? 'var(--pl-ink-900)' : 'var(--pl-ink-600)',
            fontWeight: active ? 500 : 400, cursor: 'pointer',
          }}>{l}</button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', border: '1px solid var(--pl-ink-200)', borderRadius: 5,
          background: 'var(--pl-canvas)',
        }}>
          <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 10, color: 'var(--pl-ink-500)' }}>↻</span>
          <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 11, color: 'var(--pl-ink-700)' }}>filter…</span>
        </div>
      </div>

      {/* Timeline rail */}
      <div style={{ position: 'relative', paddingLeft: 18 }}>
        {/* vertical rail */}
        <div style={{
          position: 'absolute', left: 6, top: 8, bottom: 8, width: 1,
          background: 'var(--pl-ink-200)',
        }} />

        {entries.map((e, i) => {
          const k = kindStyles[e.kind];
          return (
            <div key={i} style={{ position: 'relative', paddingBottom: 18 }}>
              {/* node */}
              <span style={{
                position: 'absolute', left: -18, top: 18,
                width: 12, height: 12, borderRadius: 999,
                background: 'var(--pl-paper)',
                border: `2px solid ${k.bd}`,
                boxShadow: e.focus ? `0 0 0 4px ${k.bg}` : 'none',
              }} />

              <div style={{
                padding: '14px 18px',
                border: '1px solid var(--pl-ink-200)',
                borderLeft: `3px solid ${k.bd}`,
                borderRadius: 6,
                background: e.focus ? 'oklch(0.99 0.02 240)' : 'var(--pl-paper)',
              }}>
                {/* row 1 — meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'var(--pl-mono)', fontSize: 10,
                    width: 18, height: 18, borderRadius: 3,
                    background: k.bg, color: k.col,
                    border: `1px solid ${k.bd}`,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 600, flexShrink: 0,
                  }}>{k.label}</span>
                  <Mono size={12} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>{e.prompt}</Mono>
                  <Mono size={11} color="var(--pl-ink-500)">{e.rev}</Mono>
                  <span style={{ flex: 1 }} />
                  <Mono size={11} color="var(--pl-ink-500)">{e.author}</Mono>
                  <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
                  <Mono size={11} color="var(--pl-ink-500)" title={e.date}>{e.when}</Mono>
                  <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
                  <Mono size={11} color="var(--pl-ink-500)">{e.sha}</Mono>
                  {e.pr && (
                    <>
                      <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
                      <a href="#" style={{ fontFamily: 'var(--pl-mono)', fontSize: 11, color: 'var(--pl-signal-deep)', textDecoration: 'none' }}>{e.pr}</a>
                    </>
                  )}
                </div>
                {/* row 2 — message */}
                <div style={{ marginTop: 8, fontSize: 13.5, color: 'var(--pl-ink-800)', lineHeight: 1.45 }}>
                  {e.msg}
                </div>
                {/* row 3 — structured field changes */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {e.changes.map((c, j) => <SpecChip key={j} {...c} />)}
                  {e.focus && (
                    <a href="#diff" style={{
                      fontFamily: 'var(--pl-mono)', fontSize: 11,
                      color: 'var(--pl-signal-deep)', textDecoration: 'none',
                      borderBottom: '1px dashed var(--pl-signal-deep)',
                      marginLeft: 6, alignSelf: 'center',
                    }}>view full diff →</a>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Older — load more */}
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: -18, top: 8,
            width: 12, height: 12, borderRadius: 999,
            background: 'var(--pl-paper)', border: '1px dashed var(--pl-ink-300)',
          }} />
          <div style={{ padding: '8px 0' }}>
            <a href="#" style={{
              fontFamily: 'var(--pl-mono)', fontSize: 11.5,
              color: 'var(--pl-ink-600)', textDecoration: 'none',
              borderBottom: '1px dashed var(--pl-ink-400)',
            }}>
              load 47 older entries →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecChip({ f, d, tone }) {
  const tones = {
    add:    { bg: 'oklch(0.97 0.04 155)', bd: 'oklch(0.86 0.05 155)', col: 'oklch(0.36 0.10 155)', glyph: '+' },
    del:    { bg: 'oklch(0.97 0.04 25)',  bd: 'oklch(0.86 0.06 25)',  col: 'oklch(0.40 0.13 25)',  glyph: '−' },
    edit:   { bg: 'oklch(0.97 0.03 240)', bd: 'oklch(0.86 0.04 240)', col: 'var(--pl-signal-deep)', glyph: '~' },
    meta:   { bg: 'var(--pl-ink-100)',    bd: 'var(--pl-ink-200)',    col: 'var(--pl-ink-700)',    glyph: '·' },
  };
  const s = tones[tone] || tones.meta;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 6,
      padding: '3px 9px', borderRadius: 999,
      background: s.bg, border: `1px solid ${s.bd}`,
      fontFamily: 'var(--pl-mono)', fontSize: 11,
      color: s.col,
    }}>
      <span style={{ fontWeight: 600 }}>{s.glyph}</span>
      <span style={{ fontWeight: 500 }}>{f}</span>
      <span style={{ color: 'var(--pl-ink-600)' }}>{d}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Spec diff — JSON-derived field-level diff (not raw TOML)
// ─────────────────────────────────────────────────────────────
function SpecDiff() {
  return (
    <div>
      {/* Header strip */}
      <div style={{
        padding: '12px 16px',
        border: '1px solid var(--pl-ink-200)',
        borderBottom: 'none', borderRadius: '8px 8px 0 0',
        background: 'var(--pl-canvas)',
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}>
        <Mono size={11} color="var(--pl-ink-700)">prompts/rag/doc-rag-answer.toml</Mono>
        <span style={{ width: 1, height: 12, background: 'var(--pl-ink-300)' }} />
        <Mono size={11} color="var(--pl-ink-500)">parsed as <span style={{ color: 'var(--pl-ink-800)' }}>PromptSpec</span></Mono>
        <span style={{ flex: 1 }} />
        {/* legend */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: 'oklch(0.55 0.13 155)' }} />
          <Mono size={10} color="var(--pl-ink-600)">added</Mono>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: 'oklch(0.55 0.15 25)' }} />
          <Mono size={10} color="var(--pl-ink-600)">removed</Mono>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--pl-signal-deep)' }} />
          <Mono size={10} color="var(--pl-ink-600)">changed</Mono>
        </span>
      </div>

      <div style={{
        border: '1px solid var(--pl-ink-200)', borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        background: 'var(--pl-paper)',
        overflow: 'hidden',
      }}>
        {/* Section: meta — collapsed unchanged */}
        <DiffGroup title="meta" status="unchanged">
          <DiffField path="name" l='"doc-rag-answer"' r='"doc-rag-answer"' />
          <DiffField path="group" l='"rag"' r='"rag"' />
          <DiffField path="version" l='"1.7.4"' r='"1.8.0"' kind="edit" />
          <DiffField path="revision" l="33" r="34" kind="edit" />
        </DiffGroup>

        {/* Section: request */}
        <DiffGroup title="request" status="unchanged">
          <DiffField path="request.vendor" l='"openai"' r='"openai"' />
          <DiffField path="request.model" l='"gpt-4.1"' r='"gpt-4.1"' />
          <DiffField path="request.parameters.temperature" l="0.2" r="0.2" />
        </DiffGroup>

        {/* Section: messages */}
        <DiffGroup title="messages · 4 → 4" status="unchanged" />

        {/* Section: placeholders */}
        <DiffGroup title="placeholders · 6 → 6" status="unchanged" />

        {/* Section: rules — the actual change */}
        <DiffGroup title="rules · 4 → 8" status="changed">
          <DiffField path="rules[0]" l='"Cite every claim with [doc-id:section]."' r='"Cite every claim with [doc-id:section]."' />
          <DiffField path="rules[1]"
            l='"Use up to 4 retrieved chunks."'
            r='"Use up to 8 retrieved chunks."' kind="edit" />
          <DiffField path="rules[2]" kind="add"
            r='"When chunks contradict, prefer the most recent doc."' />
          <DiffField path="rules[3]" kind="add"
            r='"When the question is ambiguous, ask for clarification rather than guess."' />
          <DiffField path="rules[4]" kind="add"
            r='"Refuse if context is insufficient."' />
        </DiffGroup>

        {/* Section: evaluation — note about Pro */}
        <DiffGroup title="evaluation" status="unchanged" footnote="Pro · not generated for OSS edition" />
      </div>
    </div>
  );
}

function DiffGroup({ title, status, footnote, children }) {
  const sBg = status === 'changed' ? 'oklch(0.99 0.02 240)' : 'var(--pl-canvas)';
  const sCol = status === 'changed' ? 'var(--pl-signal-deep)' : 'var(--pl-ink-500)';
  return (
    <div style={{ borderBottom: '1px solid var(--pl-ink-200)' }}>
      <div style={{
        padding: '10px 16px', background: sBg,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Mono size={11} color={sCol} style={{ letterSpacing: '0.06em', fontWeight: 500 }}>{title}</Mono>
        <span style={{ flex: 1 }} />
        <Mono size={10} color={sCol} style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>{status}</Mono>
        {footnote && (
          <Mono size={10} color="var(--pl-ink-500)">· {footnote}</Mono>
        )}
      </div>
      {children}
    </div>
  );
}

function DiffField({ path, l, r, kind }) {
  // Two-column field diff. kind: undefined = unchanged, 'edit' | 'add' | 'del'.
  const tones = {
    add:  { bd: 'oklch(0.55 0.13 155)', bg: 'oklch(0.97 0.04 155)' },
    del:  { bd: 'oklch(0.55 0.15 25)',  bg: 'oklch(0.97 0.04 25)' },
    edit: { bd: 'var(--pl-signal-deep)', bg: 'oklch(0.99 0.02 240)' },
  };
  const s = kind ? tones[kind] : null;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '220px 1fr 1fr',
      padding: '8px 16px', alignItems: 'flex-start', gap: 16,
      background: s?.bg,
      borderLeft: s ? `2px solid ${s.bd}` : '2px solid transparent',
    }}>
      <Mono size={11} color="var(--pl-ink-700)" style={{ paddingTop: 2 }}>{path}</Mono>
      <DiffSide value={l} kind={kind === 'add' ? 'empty' : (kind === 'edit' || kind === 'del' ? 'old' : null)} />
      <DiffSide value={r} kind={kind === 'del' ? 'empty' : (kind === 'edit' || kind === 'add' ? 'new' : null)} />
    </div>
  );
}

function DiffSide({ value, kind }) {
  if (value === undefined) {
    return (
      <span style={{
        fontFamily: 'var(--pl-mono)', fontSize: 11, color: 'var(--pl-ink-400)',
        padding: '2px 8px',
      }}>—</span>
    );
  }
  const tones = {
    old: { bg: 'oklch(0.94 0.05 25)',  bd: 'oklch(0.86 0.06 25)',  col: 'oklch(0.36 0.13 25)',  glyph: '−' },
    new: { bg: 'oklch(0.94 0.05 155)', bd: 'oklch(0.86 0.05 155)', col: 'oklch(0.30 0.10 155)', glyph: '+' },
  };
  const s = kind ? tones[kind] : null;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 6,
      padding: '2px 8px', borderRadius: 4,
      background: s?.bg,
      border: s ? `1px solid ${s.bd}` : 'none',
      minHeight: 22,
    }}>
      {s && <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 11, color: s.col, fontWeight: 600 }}>{s.glyph}</span>}
      <span style={{
        fontFamily: 'var(--pl-mono)', fontSize: 11.5,
        color: s?.col || 'var(--pl-ink-800)',
        wordBreak: 'break-word',
      }}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Authors table — git shortlog -sn across all history
// ─────────────────────────────────────────────────────────────
function AuthorsTable() {
  const authors = [
    { name: 'j.santos', email: 'jess@acme.com',   commits: 38, prompts: 4, since: '8 mo ago', last: '3 min ago' },
    { name: 'l.kim',    email: 'l.kim@acme.com',  commits: 27, prompts: 5, since: '6 mo ago', last: '14 hr ago' },
    { name: 'm.holm',   email: 'mh@acme.com',     commits: 19, prompts: 3, since: '5 mo ago', last: '2 days ago' },
    { name: 'a.nguyen', email: 'andy@acme.com',   commits: 11, prompts: 2, since: '4 mo ago', last: '5 days ago' },
    { name: 's.weber',  email: 'sw@acme.com',     commits:  6, prompts: 1, since: '3 mo ago', last: '3 weeks ago' },
  ];
  const max = Math.max(...authors.map(a => a.commits));
  return (
    <div style={{ border: '1px solid var(--pl-ink-200)', borderRadius: 10, overflow: 'hidden', background: 'var(--pl-paper)' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1.1fr 1.4fr 80px 80px 1.2fr 1fr',
        padding: '10px 18px', background: 'var(--pl-canvas)',
        borderBottom: '1px solid var(--pl-ink-200)', gap: 14,
      }}>
        {['Author', 'Email', 'Commits', 'Prompts', 'Activity', 'Last touched'].map((h) => (
          <Mono key={h} size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>{h}</Mono>
        ))}
      </div>
      {authors.map((a, i) => (
        <div key={a.name} style={{
          display: 'grid', gridTemplateColumns: '1.1fr 1.4fr 80px 80px 1.2fr 1fr',
          alignItems: 'center', padding: '12px 18px', gap: 14,
          borderBottom: i === authors.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
        }}>
          <Mono size={12.5} color="var(--pl-ink-900)">{a.name}</Mono>
          <Mono size={11} color="var(--pl-ink-500)">{a.email}</Mono>
          <Mono size={12} color="var(--pl-ink-800)" style={{ fontVariantNumeric: 'tabular-nums' }}>{a.commits}</Mono>
          <Mono size={12} color="var(--pl-ink-800)" style={{ fontVariantNumeric: 'tabular-nums' }}>{a.prompts}</Mono>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--pl-ink-100)', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${(a.commits / max) * 100}%`, background: 'var(--pl-signal-deep)' }} />
            </span>
            <Mono size={10.5} color="var(--pl-ink-500)">{a.since}</Mono>
          </span>
          <Mono size={11} color="var(--pl-ink-700)">{a.last}</Mono>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Group blocks — catalog snapshot organised by group
// ─────────────────────────────────────────────────────────────
function GroupBlocks() {
  const groups = [
    { name: 'agents',  count: 4, items: [
      { name: 'mcp-tool-router',          v: '1.4.2', r: 'r17', model: 'anthropic/claude-haiku-4-5',     msgs: 2, ph: 3, status: 'production', updated: '4d ago' },
      { name: 'pr-summarizer',            v: '0.6.0', r: 'r9',  model: 'openai/gpt-4.1-mini',            msgs: 3, ph: 2, status: 'production', updated: '5d ago' },
      { name: 'meeting-notes-cleanup',    v: '0.1.0', r: 'r1',  model: 'anthropic/claude-haiku-4-5',     msgs: 2, ph: 1, status: 'draft',      updated: '20h ago' },
      { name: 'changelog-from-commits',   v: '1.0.1', r: 'r3',  model: 'anthropic/claude-sonnet-4-5',    msgs: 3, ph: 4, status: 'production', updated: '3w ago' },
    ]},
    { name: 'rag',     count: 2, items: [
      { name: 'doc-rag-answer',           v: '1.8.0', r: 'r34', model: 'openai/gpt-4.1',                 msgs: 4, ph: 6, status: 'production', updated: '3 min ago' },
      { name: 'doc-rag-rewrite-query',    v: '0.4.2', r: 'r7',  model: 'openai/gpt-4.1-mini',            msgs: 2, ph: 2, status: 'production', updated: '2w ago' },
    ]},
    { name: 'support', count: 2, items: [
      { name: 'support-triage-classifier',v: '2.4.1', r: 'r24', model: 'anthropic/claude-sonnet-4-5',    msgs: 3, ph: 4, status: 'production', updated: '2d ago' },
      { name: 'support-reply-draft',      v: '1.2.0', r: 'r11', model: 'anthropic/claude-sonnet-4-5',    msgs: 4, ph: 5, status: 'production', updated: '2w ago' },
    ]},
    { name: 'extract', count: 2, items: [
      { name: 'extract-line-items',       v: '0.7.3', r: 'r13', model: 'openai/gpt-4.1',                 msgs: 2, ph: 3, status: 'production', updated: '14h ago' },
      { name: 'extract-contract-terms',   v: '0.5.0', r: 'r4',  model: 'anthropic/claude-sonnet-4-5',    msgs: 2, ph: 4, status: 'review',     updated: '1w ago' },
    ]},
    { name: 'eval',    count: 2, items: [
      { name: 'rubric-judge-helpfulness', v: '0.3.0', r: 'r5',  model: 'anthropic/claude-sonnet-4-5',    msgs: 2, ph: 3, status: 'draft',      updated: '5d ago' },
      { name: 'rubric-judge-faithfulness',v: '0.3.0', r: 'r5',  model: 'anthropic/claude-sonnet-4-5',    msgs: 2, ph: 3, status: 'draft',      updated: '5d ago' },
    ]},
  ];

  const statusTone = {
    production: 'oklch(0.45 0.12 155)',
    review:     'oklch(0.50 0.13 75)',
    draft:      'var(--pl-ink-500)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {groups.map((g) => (
        <div key={g.name}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
            <Mono size={11} color="var(--pl-ink-900)" style={{ fontWeight: 500, letterSpacing: '0.04em' }}>{g.name}</Mono>
            <Mono size={10} color="var(--pl-ink-500)">{g.count} prompts</Mono>
            <div style={{ flex: 1, height: 1, background: 'var(--pl-ink-200)' }} />
          </div>
          <div style={{ border: '1px solid var(--pl-ink-200)', borderRadius: 8, overflow: 'hidden', background: 'var(--pl-paper)' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1.4fr 0.6fr 0.5fr 1.3fr 0.5fr 0.5fr 0.7fr 0.7fr',
              padding: '8px 16px', background: 'var(--pl-canvas)',
              borderBottom: '1px solid var(--pl-ink-200)', gap: 12,
            }}>
              {['Name', 'Version', 'Rev', 'Model', 'Msgs', 'Vars', 'Status', 'Updated'].map((h) => (
                <Mono key={h} size={9.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>{h}</Mono>
              ))}
            </div>
            {g.items.map((it, i) => (
              <div key={it.name} style={{
                display: 'grid', gridTemplateColumns: '1.4fr 0.6fr 0.5fr 1.3fr 0.5fr 0.5fr 0.7fr 0.7fr',
                alignItems: 'center', padding: '10px 16px', gap: 12,
                borderBottom: i === g.items.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
              }}>
                <Mono size={12} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>{it.name}</Mono>
                <Mono size={11} color="var(--pl-ink-700)">{it.v}</Mono>
                <Mono size={11} color="var(--pl-ink-500)">{it.r}</Mono>
                <Mono size={11} color="var(--pl-ink-700)" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.model}</Mono>
                <Mono size={11} color="var(--pl-ink-700)" style={{ fontVariantNumeric: 'tabular-nums' }}>{it.msgs}</Mono>
                <Mono size={11} color="var(--pl-ink-700)" style={{ fontVariantNumeric: 'tabular-nums' }}>{it.ph}</Mono>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: statusTone[it.status] }} />
                  <Mono size={10.5} color={statusTone[it.status]}>{it.status}</Mono>
                </span>
                <Mono size={10.5} color="var(--pl-ink-500)">{it.updated}</Mono>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Model matrix — vendor × model, count of prompts using
// ─────────────────────────────────────────────────────────────
function ModelMatrix() {
  const models = [
    { vendor: 'anthropic', model: 'claude-sonnet-4-5',    count: 5, color: 'oklch(0.55 0.13 30)' },
    { vendor: 'anthropic', model: 'claude-haiku-4-5',     count: 3, color: 'oklch(0.55 0.13 30)' },
    { vendor: 'openai',    model: 'gpt-4.1',              count: 2, color: 'var(--pl-signal-deep)' },
    { vendor: 'openai',    model: 'gpt-4.1-mini',         count: 2, color: 'var(--pl-signal-deep)' },
  ];
  const max = Math.max(...models.map(m => m.count));
  return (
    <div style={{ border: '1px solid var(--pl-ink-200)', borderRadius: 10, overflow: 'hidden', background: 'var(--pl-paper)' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '0.6fr 1.4fr 60px 1fr',
        padding: '10px 18px', background: 'var(--pl-canvas)',
        borderBottom: '1px solid var(--pl-ink-200)', gap: 14,
      }}>
        {['Vendor', 'Model', 'Prompts', 'Share'].map((h) => (
          <Mono key={h} size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>{h}</Mono>
        ))}
      </div>
      {models.map((m, i) => (
        <div key={m.model} style={{
          display: 'grid', gridTemplateColumns: '0.6fr 1.4fr 60px 1fr',
          alignItems: 'center', padding: '12px 18px', gap: 14,
          borderBottom: i === models.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
            <Mono size={12} color="var(--pl-ink-800)">{m.vendor}</Mono>
          </span>
          <Mono size={12.5} color="var(--pl-ink-900)">{m.model}</Mono>
          <Mono size={12} color="var(--pl-ink-800)" style={{ fontVariantNumeric: 'tabular-nums' }}>{m.count}</Mono>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--pl-ink-100)', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${(m.count / max) * 100}%`, background: m.color }} />
            </span>
            <Mono size={10.5} color="var(--pl-ink-600)">{m.count} of 12</Mono>
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Placeholder index — every variable referenced
// ─────────────────────────────────────────────────────────────
function PlaceholderIndex() {
  const vars = [
    { name: 'user_message',    used: 6, in: ['mcp-tool-router', 'support-triage-classifier', 'support-reply-draft', '+3'] },
    { name: 'tool_catalog',    used: 1, in: ['mcp-tool-router'] },
    { name: 'policy',          used: 3, in: ['mcp-tool-router', 'support-reply-draft', 'doc-rag-answer'] },
    { name: 'agent_name',      used: 4, in: ['mcp-tool-router', 'pr-summarizer', '+2'] },
    { name: 'context_chunks',  used: 2, in: ['doc-rag-answer', 'doc-rag-rewrite-query'] },
    { name: 'ticket',          used: 2, in: ['support-triage-classifier', 'support-reply-draft'] },
    { name: 'document',        used: 2, in: ['extract-line-items', 'extract-contract-terms'] },
    { name: 'rubric',          used: 2, in: ['rubric-judge-helpfulness', 'rubric-judge-faithfulness'] },
    { name: 'commits',         used: 2, in: ['pr-summarizer', 'changelog-from-commits'] },
    { name: 'transcript',      used: 1, in: ['meeting-notes-cleanup'] },
  ];
  return (
    <div style={{ border: '1px solid var(--pl-ink-200)', borderRadius: 10, overflow: 'hidden', background: 'var(--pl-paper)' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1.1fr 0.5fr 2fr',
        padding: '10px 18px', background: 'var(--pl-canvas)',
        borderBottom: '1px solid var(--pl-ink-200)', gap: 14,
      }}>
        {['Variable', 'Used by', 'In'].map((h) => (
          <Mono key={h} size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>{h}</Mono>
        ))}
      </div>
      {vars.map((v, i) => (
        <div key={v.name} style={{
          display: 'grid', gridTemplateColumns: '1.1fr 0.5fr 2fr',
          alignItems: 'center', padding: '11px 18px', gap: 14,
          borderBottom: i === vars.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
        }}>
          <span style={{
            display: 'inline-block',
            background: 'oklch(0.95 0.05 240)',
            border: '1px solid oklch(0.85 0.08 240)',
            color: 'var(--pl-signal-deep)',
            padding: '2px 7px', borderRadius: 3,
            fontFamily: 'var(--pl-mono)', fontSize: 11.5,
            width: 'fit-content',
          }}>{`{{${v.name}}}`}</span>
          <Mono size={12} color="var(--pl-ink-800)" style={{ fontVariantNumeric: 'tabular-nums' }}>{v.used}</Mono>
          <Mono size={11} color="var(--pl-ink-600)">{v.in.join(', ')}</Mono>
        </div>
      ))}
    </div>
  );
}

window.ProductReport = ProductReport;
