// prompt-diff.jsx — Interactive prompt diff view
//
// Two pickers (left/right). Each picks { prompt, revision }.
// Defaults to comparing two revisions of the SAME prompt.
// Can also compare two different prompts at any rev.
//
// The diff is computed client-side from a hardcoded corpus of prompt
// revisions (in production, this is loaded from the same specs.json
// the report generates). Diff is field-level on the parsed PromptSpec
// JSON, NOT line-level on raw TOML.
//
// Mono is provided globally by product.jsx.

// ─────────────────────────────────────────────────────────────
// Corpus of prompt revisions (sample data)
// ─────────────────────────────────────────────────────────────
const CORPUS = {
  'doc-rag-answer': {
    group: 'rag',
    revisions: {
      r34: {
        version: '1.8.0', author: 'j.santos', when: '3 min ago', sha: '3f7c2e1',
        spec: {
          name: 'doc-rag-answer', group: 'rag', version: '1.8.0', revision: 34,
          request: { vendor: 'openai', model: 'gpt-4.1', parameters: { temperature: 0.2, top_p: 1, max_tokens: 1024 } },
          placeholders: ['user_message', 'context_chunks', 'policy', 'agent_name', 'lang', 'now'],
          messages: [
            { role: 'system', body: 'You are {{agent_name}}, a careful assistant that answers from the provided context only.' },
            { role: 'system', body: '## Rules\n- Cite every claim with [doc-id:section].\n- Use up to 8 retrieved chunks.\n- When chunks contradict, prefer the most recent doc.\n- When the question is ambiguous, ask for clarification rather than guess.\n- Refuse if context is insufficient.' },
            { role: 'user', body: '{{#each context_chunks}}\n[{{this.id}}:{{this.section}}]\n{{this.text}}\n{{/each}}\n\nQuestion: {{user_message}}' },
            { role: 'assistant', body: 'Use the citation format above. If you cannot answer, say so plainly.' },
          ],
          rules: [
            'Cite every claim with [doc-id:section].',
            'Use up to 8 retrieved chunks.',
            'When chunks contradict, prefer the most recent doc.',
            'When the question is ambiguous, ask for clarification rather than guess.',
            'Refuse if context is insufficient.',
          ],
        },
      },
      r33: {
        version: '1.7.4', author: 'j.santos', when: '6 days ago', sha: '7e2ff',
        spec: {
          name: 'doc-rag-answer', group: 'rag', version: '1.7.4', revision: 33,
          request: { vendor: 'openai', model: 'gpt-4.1', parameters: { temperature: 0.2, top_p: 1, max_tokens: 1024 } },
          placeholders: ['user_message', 'context_chunks', 'policy', 'agent_name', 'lang', 'now'],
          messages: [
            { role: 'system', body: 'You are {{agent_name}}, a careful assistant that answers from the provided context only.' },
            { role: 'system', body: '## Rules\n- Cite every claim with [doc-id:section].\n- Use up to 4 retrieved chunks.\n- Refuse if context is insufficient.' },
            { role: 'user', body: '{{#each context_chunks}}\n[{{this.id}}:{{this.section}}]\n{{this.text}}\n{{/each}}\n\nQuestion: {{user_message}}' },
            { role: 'assistant', body: 'Use the citation format above. If you cannot answer, say so plainly.' },
          ],
          rules: [
            'Cite every claim with [doc-id:section].',
            'Use up to 4 retrieved chunks.',
            'Refuse if context is insufficient.',
          ],
        },
      },
      r30: {
        version: '1.7.0', author: 'j.santos', when: '1mo ago', sha: '4ac21',
        spec: {
          name: 'doc-rag-answer', group: 'rag', version: '1.7.0', revision: 30,
          request: { vendor: 'openai', model: 'gpt-4.1', parameters: { temperature: 0.2, top_p: 1, max_tokens: 1024 } },
          placeholders: ['user_message', 'context_chunks', 'policy', 'agent_name', 'lang', 'now'],
          messages: [
            { role: 'system', body: 'You are {{agent_name}}, a careful assistant.' },
            { role: 'system', body: '## Rules\n- Cite every claim.\n- Use up to 4 retrieved chunks.' },
            { role: 'user', body: '{{#each context_chunks}}\n[{{this.id}}]\n{{this.text}}\n{{/each}}\n\nQuestion: {{user_message}}' },
          ],
          rules: [
            'Cite every claim.',
            'Use up to 4 retrieved chunks.',
          ],
        },
      },
      r1: {
        version: '1.0.0', author: 'j.santos', when: '8mo ago', sha: '1a8e0',
        spec: {
          name: 'doc-rag-answer', group: 'rag', version: '1.0.0', revision: 1,
          request: { vendor: 'openai', model: 'gpt-4', parameters: { temperature: 0.0, max_tokens: 512 } },
          placeholders: ['user_message', 'context_chunks'],
          messages: [
            { role: 'system', body: 'Answer the question from the context.' },
            { role: 'user', body: '{{context_chunks}}\n\nQuestion: {{user_message}}' },
          ],
          rules: [
            'Cite the doc.',
          ],
        },
      },
    },
  },
  'mcp-tool-router': {
    group: 'agents',
    revisions: {
      r17: {
        version: '1.4.2', author: 'j.santos', when: '4 days ago', sha: '0aa18',
        spec: {
          name: 'mcp-tool-router', group: 'agents', version: '1.4.2', revision: 17,
          request: { vendor: 'anthropic', model: 'claude-haiku-4-5', parameters: { temperature: 0.1, max_tokens: 800 } },
          placeholders: ['user_message', 'tool_catalog', 'policy'],
          messages: [
            { role: 'system', body: 'You route a user request to one of the tools in the catalog.' },
            { role: 'user', body: 'Catalog:\n{{tool_catalog}}\n\nPolicy:\n{{policy}}\n\nUser: {{user_message}}' },
          ],
          rules: [
            'Pick exactly one tool from the catalog.',
            'Refuse if no tool fits.',
            'Return JSON: {tool, args, why}.',
          ],
        },
      },
      r16: {
        version: '1.3.0', author: 'j.santos', when: '1w ago', sha: 'aa11d',
        spec: {
          name: 'mcp-tool-router', group: 'agents', version: '1.3.0', revision: 16,
          request: { vendor: 'anthropic', model: 'claude-sonnet-4-5', parameters: { temperature: 0.1, max_tokens: 800 } },
          placeholders: ['user_message', 'tool_catalog'],
          messages: [
            { role: 'system', body: 'You route a user request to one of the tools in the catalog.' },
            { role: 'user', body: 'Catalog:\n{{tool_catalog}}\n\nUser: {{user_message}}' },
          ],
          rules: [
            'Pick exactly one tool from the catalog.',
            'Return JSON: {tool, args, why}.',
          ],
        },
      },
    },
  },
  'support-triage-classifier': {
    group: 'support',
    revisions: {
      r24: {
        version: '2.4.1', author: 'm.holm', when: '2 days ago', sha: 'b41d3',
        spec: {
          name: 'support-triage-classifier', group: 'support', version: '2.4.1', revision: 24,
          request: { vendor: 'anthropic', model: 'claude-sonnet-4-5', parameters: { temperature: 0, max_tokens: 200 } },
          placeholders: ['ticket', 'topic_enum', 'priority_enum', 'now'],
          messages: [
            { role: 'system', body: 'Classify a support ticket.' },
            { role: 'user', body: 'Ticket:\n{{ticket}}\n\nReturn topic and priority.' },
          ],
          rules: [
            'Return one of the topics: account, billing, billing-dispute, bug, feature-request.',
            'Return priority p1 / p2 / p3.',
          ],
        },
      },
    },
  },
  'extract-line-items': {
    group: 'extract',
    revisions: {
      r13: {
        version: '0.7.3', author: 'l.kim', when: '14h ago', sha: 'cc911',
        spec: {
          name: 'extract-line-items', group: 'extract', version: '0.7.3', revision: 13,
          request: { vendor: 'openai', model: 'gpt-4.1', parameters: { temperature: 0, max_tokens: 1500 } },
          placeholders: ['document', 'tax_lines', 'currency'],
          messages: [
            { role: 'system', body: 'Extract line items from a document.' },
            { role: 'user', body: 'Document:\n{{document}}' },
          ],
          rules: [
            'Normalise currency symbols to ISO codes.',
            'Pull tax lines into {{tax_lines}}.',
          ],
        },
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────
// Tiny diff helpers
// ─────────────────────────────────────────────────────────────
function diffArray(left = [], right = []) {
  const out = [];
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i++) {
    const l = left[i], r = right[i];
    if (l === undefined) out.push({ kind: 'add', l: undefined, r });
    else if (r === undefined) out.push({ kind: 'del', l, r: undefined });
    else if (typeof l === 'object' && typeof r === 'object') {
      const lj = JSON.stringify(l), rj = JSON.stringify(r);
      out.push({ kind: lj === rj ? 'same' : 'edit', l, r });
    } else {
      out.push({ kind: l === r ? 'same' : 'edit', l, r });
    }
  }
  return out;
}

function diffObject(left = {}, right = {}) {
  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])];
  return keys.map(k => {
    const l = left[k], r = right[k];
    if (l === undefined) return { k, kind: 'add', l, r };
    if (r === undefined) return { k, kind: 'del', l, r };
    return { k, kind: l === r ? 'same' : 'edit', l, r };
  });
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
function PromptDiffPage() {
  const [sel, setSel] = React.useState({
    promptA: 'doc-rag-answer', revA: 'r33',
    promptB: 'doc-rag-answer', revB: 'r34',
  });

  // Allow other artboards (the detail page) to drive selection
  React.useEffect(() => {
    window.__setDiffSelection = (next) => setSel((s) => ({ ...s, ...next }));
    return () => { delete window.__setDiffSelection; };
  }, []);

  const A = CORPUS[sel.promptA]?.revisions[sel.revA];
  const B = CORPUS[sel.promptB]?.revisions[sel.revB];

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
        <Mono size={11} color="var(--pl-ink-500)">diff</Mono>
        <div style={{ flex: 1 }} />
        <Mono size={11} color="var(--pl-ink-500)">spec-level · derived from PromptSpec JSON</Mono>
      </div>

      {/* ───────────────────── Title ─────────── */}
      <div style={{ padding: '36px 56px 8px' }}>
        <Mono size={11} color="var(--pl-signal-deep)" style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, display: 'block', marginBottom: 10 }}>
          Diff
        </Mono>
        <h1 style={{
          margin: 0, fontFamily: 'var(--pl-display)',
          fontSize: 36, fontWeight: 500, letterSpacing: '-0.02em',
          lineHeight: 1.05, color: 'var(--pl-ink-900)',
        }}>
          Compare two prompts.
          <span style={{ color: 'var(--pl-ink-500)' }}> Anywhere in the corpus, any rev.</span>
        </h1>
        <p style={{
          margin: '12px 0 0', fontSize: 14.5, lineHeight: 1.55,
          color: 'var(--pl-ink-600)', maxWidth: 720,
        }}>
          Pick a prompt and a revision on each side. Most-common case: same prompt across two revs.
          Cross-prompt comparisons work too — useful when you've forked a prompt and want to see what diverged.
        </p>
      </div>

      {/* ───────────────────── Pickers ─────────── */}
      <div style={{ padding: '24px 56px 0' }}>
        <PickerStrip sel={sel} onChange={setSel} A={A} B={B} />
      </div>

      {/* ───────────────────── Summary ─────────── */}
      <div style={{ padding: '24px 56px 0' }}>
        <DiffSummary A={A?.spec} B={B?.spec} />
      </div>

      {/* ───────────────────── Diff body ─────────── */}
      <div style={{ padding: '24px 56px 56px' }}>
        <SpecDiffBody A={A?.spec} B={B?.spec} />
      </div>

      {/* ───────────────────── Footer ─────────── */}
      <div style={{
        padding: '16px 56px',
        borderTop: '1px solid var(--pl-ink-200)',
        background: 'var(--pl-paper)',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <Mono size={11} color="var(--pl-ink-500)">
          comparison runs in your browser · no data sent
        </Mono>
        <div style={{ flex: 1 }} />
        <Mono size={11} color="var(--pl-ink-500)">
          equivalent CLI: <Mono color="var(--pl-ink-700)">{`promptlm diff ${sel.promptA}@${sel.revA} ${sel.promptB}@${sel.revB}`}</Mono>
        </Mono>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Picker strip (left side, swap, right side)
// ─────────────────────────────────────────────────────────────
function PickerStrip({ sel, onChange, A, B }) {
  const swap = () => onChange({
    promptA: sel.promptB, revA: sel.revB,
    promptB: sel.promptA, revB: sel.revA,
  });
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 56px 1fr',
      gap: 14,
      alignItems: 'stretch',
    }}>
      <Picker
        side="A"
        sideColor="oklch(0.55 0.15 25)"
        sideBg="oklch(0.97 0.04 25)"
        sideBd="oklch(0.86 0.06 25)"
        prompt={sel.promptA}
        rev={sel.revA}
        meta={A}
        onChange={(next) => onChange({ ...sel, ...next })}
      />
      <button
        onClick={swap}
        title="swap sides"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--pl-paper)',
          border: '1px solid var(--pl-ink-200)',
          borderRadius: 999,
          fontFamily: 'var(--pl-mono)', fontSize: 13,
          color: 'var(--pl-ink-700)', cursor: 'pointer',
          alignSelf: 'center', height: 36, width: 36, marginInline: 'auto',
        }}
      >⇄</button>
      <Picker
        side="B"
        sideColor="oklch(0.45 0.12 155)"
        sideBg="oklch(0.97 0.04 155)"
        sideBd="oklch(0.86 0.05 155)"
        prompt={sel.promptB}
        rev={sel.revB}
        meta={B}
        onChange={(next) => onChange({ ...sel, ...next })}
      />
    </div>
  );
}

function Picker({ side, sideColor, sideBg, sideBd, prompt, rev, meta, onChange }) {
  const isA = side === 'A';
  const fieldP = isA ? 'promptA' : 'promptB';
  const fieldR = isA ? 'revA' : 'revB';

  const promptList = Object.keys(CORPUS);
  const revList = CORPUS[prompt] ? Object.keys(CORPUS[prompt].revisions) : [];

  return (
    <div style={{
      border: `1px solid ${sideBd}`,
      background: sideBg,
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, borderRadius: 5,
          background: sideColor, color: 'var(--pl-paper)',
          fontFamily: 'var(--pl-mono)', fontSize: 12, fontWeight: 600,
        }}>{side}</span>
        <Mono size={11} color={sideColor} style={{ letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 500 }}>
          {isA ? 'baseline' : 'compare'}
        </Mono>
        <div style={{ flex: 1 }} />
        {meta && (
          <Mono size={10.5} color="var(--pl-ink-500)">
            {meta.author} · {meta.when} · {meta.sha}
          </Mono>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.8fr', gap: 10 }}>
        {/* prompt picker */}
        <DropdownField label="prompt" value={prompt} onChange={(v) => {
          // when changing prompt, snap rev to the latest available
          const firstRev = Object.keys(CORPUS[v].revisions)[0];
          onChange({ [fieldP]: v, [fieldR]: firstRev });
        }}>
          {promptList.map(p => (
            <option key={p} value={p}>{p} · {CORPUS[p].group}</option>
          ))}
        </DropdownField>

        {/* rev picker */}
        <DropdownField label="revision" value={rev} onChange={(v) => onChange({ [fieldR]: v })}>
          {revList.map(r => {
            const m = CORPUS[prompt].revisions[r];
            return <option key={r} value={r}>{r} · {m.version}</option>;
          })}
        </DropdownField>
      </div>
    </div>
  );
}

function DropdownField({ label, value, onChange, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Mono size={9.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</Mono>
      <div style={{
        position: 'relative',
        background: 'var(--pl-paper)',
        border: '1px solid var(--pl-ink-300)',
        borderRadius: 6,
      }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%', appearance: 'none', WebkitAppearance: 'none',
            background: 'transparent', border: 'none', outline: 'none',
            padding: '8px 28px 8px 10px',
            fontFamily: 'var(--pl-mono)', fontSize: 12.5,
            color: 'var(--pl-ink-900)', cursor: 'pointer',
          }}
        >
          {children}
        </select>
        <span style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          fontFamily: 'var(--pl-mono)', fontSize: 10, color: 'var(--pl-ink-500)',
          pointerEvents: 'none',
        }}>▾</span>
      </div>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// Diff summary chip strip
// ─────────────────────────────────────────────────────────────
function DiffSummary({ A, B }) {
  if (!A || !B) return null;
  // count adds/dels/edits roughly
  let adds = 0, dels = 0, edits = 0;
  // request
  const req = diffObject(A.request, B.request);
  req.forEach(d => { if (d.kind === 'add') adds++; else if (d.kind === 'del') dels++; else if (d.kind === 'edit') edits++; });
  // params
  const par = diffObject(A.request.parameters || {}, B.request.parameters || {});
  par.forEach(d => { if (d.kind === 'add') adds++; else if (d.kind === 'del') dels++; else if (d.kind === 'edit') edits++; });
  // placeholders
  const phA = new Set(A.placeholders), phB = new Set(B.placeholders);
  for (const x of phA) if (!phB.has(x)) dels++;
  for (const x of phB) if (!phA.has(x)) adds++;
  // messages
  const msgs = diffArray(A.messages, B.messages);
  msgs.forEach(d => { if (d.kind === 'add') adds++; else if (d.kind === 'del') dels++; else if (d.kind === 'edit') edits++; });
  // rules
  const rA = new Set(A.rules), rB = new Set(B.rules);
  for (const x of rA) if (!rB.has(x)) dels++;
  for (const x of rB) if (!rA.has(x)) adds++;

  const same = !adds && !dels && !edits;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      padding: '12px 16px',
      border: '1px solid var(--pl-ink-200)',
      background: 'var(--pl-paper)',
      borderRadius: 10,
    }}>
      <Mono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Summary
      </Mono>
      <span style={{ width: 1, height: 14, background: 'var(--pl-ink-200)' }} />
      {same ? (
        <Mono size={12} color="var(--pl-ink-700)">specs are identical</Mono>
      ) : (
        <>
          <SummaryChip n={adds} label="added" tone="add" />
          <SummaryChip n={dels} label="removed" tone="del" />
          <SummaryChip n={edits} label="changed" tone="edit" />
        </>
      )}
      <div style={{ flex: 1 }} />
      {/* legend */}
      <Mono size={10} color="var(--pl-ink-500)">A → B</Mono>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 9, height: 9, borderRadius: 2, background: 'oklch(0.55 0.15 25)' }} />
        <Mono size={10} color="var(--pl-ink-600)">in A only</Mono>
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 9, height: 9, borderRadius: 2, background: 'oklch(0.55 0.13 155)' }} />
        <Mono size={10} color="var(--pl-ink-600)">in B only</Mono>
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--pl-signal-deep)' }} />
        <Mono size={10} color="var(--pl-ink-600)">changed</Mono>
      </span>
    </div>
  );
}

function SummaryChip({ n, label, tone }) {
  const tones = {
    add:  { bg: 'oklch(0.97 0.04 155)', bd: 'oklch(0.86 0.05 155)', col: 'oklch(0.36 0.10 155)', glyph: '+' },
    del:  { bg: 'oklch(0.97 0.04 25)',  bd: 'oklch(0.86 0.06 25)',  col: 'oklch(0.40 0.13 25)',  glyph: '−' },
    edit: { bg: 'oklch(0.97 0.03 240)', bd: 'oklch(0.86 0.04 240)', col: 'var(--pl-signal-deep)', glyph: '~' },
  };
  const s = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 6,
      padding: '3px 10px', borderRadius: 999,
      background: s.bg, border: `1px solid ${s.bd}`,
      fontFamily: 'var(--pl-mono)', fontSize: 11.5,
      color: s.col,
    }}>
      <span style={{ fontWeight: 600 }}>{s.glyph}</span>
      <span style={{ fontWeight: 500 }}>{n}</span>
      <span style={{ color: 'var(--pl-ink-600)' }}>{label}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Spec diff body — sections grouped by area
// ─────────────────────────────────────────────────────────────
function SpecDiffBody({ A, B }) {
  if (!A || !B) {
    return (
      <Mono size={12} color="var(--pl-ink-500)">missing revision data</Mono>
    );
  }

  return (
    <div style={{
      border: '1px solid var(--pl-ink-200)', borderRadius: 10,
      background: 'var(--pl-paper)', overflow: 'hidden',
    }}>
      {/* meta */}
      <Section title="meta">
        <FieldRow path="name" l={A.name} r={B.name} />
        <FieldRow path="group" l={A.group} r={B.group} />
        <FieldRow path="version" l={A.version} r={B.version} />
        <FieldRow path="revision" l={A.revision} r={B.revision} />
      </Section>

      {/* request */}
      <Section title="request">
        <FieldRow path="request.vendor" l={A.request.vendor} r={B.request.vendor} />
        <FieldRow path="request.model" l={A.request.model} r={B.request.model} />
        {(() => {
          const par = diffObject(A.request.parameters || {}, B.request.parameters || {});
          return par.map(d => (
            <FieldRow key={d.k} path={`request.parameters.${d.k}`} l={d.l} r={d.r} />
          ));
        })()}
      </Section>

      {/* placeholders */}
      <Section title={`placeholders · ${A.placeholders.length} → ${B.placeholders.length}`}>
        {(() => {
          const all = [...new Set([...A.placeholders, ...B.placeholders])];
          return all.map(p => {
            const inA = A.placeholders.includes(p);
            const inB = B.placeholders.includes(p);
            return (
              <FieldRow
                key={p}
                path={`placeholders.${p}`}
                l={inA ? `{{${p}}}` : undefined}
                r={inB ? `{{${p}}}` : undefined}
              />
            );
          });
        })()}
      </Section>

      {/* messages */}
      <Section title={`messages · ${A.messages.length} → ${B.messages.length}`}>
        {(() => {
          const ds = diffArray(A.messages, B.messages);
          return ds.map((d, i) => (
            <MessageDiffRow key={i} idx={i} d={d} />
          ));
        })()}
      </Section>

      {/* rules */}
      <Section title={`rules · ${A.rules.length} → ${B.rules.length}`}>
        {(() => {
          const all = [...new Set([...A.rules, ...B.rules])];
          return all.map((r, i) => {
            const inA = A.rules.includes(r);
            const inB = B.rules.includes(r);
            return (
              <FieldRow
                key={i}
                path={`rules[${i}]`}
                l={inA ? `"${r}"` : undefined}
                r={inB ? `"${r}"` : undefined}
                wrap
              />
            );
          });
        })()}
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  // collapse if all children rendered as 'same' — peek at children types is messy,
  // so we just always render. Could enhance later.
  return (
    <div style={{ borderBottom: '1px solid var(--pl-ink-200)' }}>
      <div style={{
        padding: '10px 18px', background: 'var(--pl-canvas)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Mono size={11} color="var(--pl-ink-700)" style={{ letterSpacing: '0.06em', fontWeight: 500 }}>{title}</Mono>
      </div>
      {children}
    </div>
  );
}

function FieldRow({ path, l, r, wrap }) {
  let kind = 'same';
  if (l === undefined && r !== undefined) kind = 'add';
  else if (r === undefined && l !== undefined) kind = 'del';
  else if (JSON.stringify(l) !== JSON.stringify(r)) kind = 'edit';

  const tones = {
    same: null,
    add:  { bg: 'oklch(0.99 0.02 155)', bd: 'oklch(0.86 0.05 155)' },
    del:  { bg: 'oklch(0.99 0.02 25)',  bd: 'oklch(0.86 0.06 25)' },
    edit: { bg: 'oklch(0.99 0.02 240)', bd: 'var(--pl-signal-deep)' },
  };
  const s = tones[kind];

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '240px 1fr 1fr',
      padding: '8px 18px', alignItems: 'flex-start', gap: 14,
      background: s?.bg,
      borderLeft: s ? `2px solid ${s.bd}` : '2px solid transparent',
    }}>
      <Mono size={11} color="var(--pl-ink-700)" style={{ paddingTop: 2 }}>{path}</Mono>
      <DiffSide value={l} kind={kind === 'same' ? null : (kind === 'add' ? 'empty' : 'old')} wrap={wrap} />
      <DiffSide value={r} kind={kind === 'same' ? null : (kind === 'del' ? 'empty' : 'new')} wrap={wrap} />
    </div>
  );
}

function DiffSide({ value, kind, wrap }) {
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
        wordBreak: wrap ? 'break-word' : 'normal',
        whiteSpace: wrap ? 'normal' : 'nowrap',
        overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{String(value)}</span>
    </div>
  );
}

// Special-case: messages render their full body when changed
function MessageDiffRow({ idx, d }) {
  const path = `messages[${idx}]`;

  if (d.kind === 'same') {
    return (
      <FieldRow path={path} l={`${d.l.role} · …`} r={`${d.r.role} · …`} />
    );
  }
  if (d.kind === 'add') {
    return (
      <div style={{
        display: 'grid', gridTemplateColumns: '240px 1fr 1fr',
        padding: '8px 18px', alignItems: 'flex-start', gap: 14,
        background: 'oklch(0.99 0.02 155)', borderLeft: '2px solid oklch(0.86 0.05 155)',
      }}>
        <Mono size={11} color="var(--pl-ink-700)" style={{ paddingTop: 2 }}>{path}</Mono>
        <DiffSide value={undefined} />
        <MsgBody role={d.r.role} body={d.r.body} kind="new" />
      </div>
    );
  }
  if (d.kind === 'del') {
    return (
      <div style={{
        display: 'grid', gridTemplateColumns: '240px 1fr 1fr',
        padding: '8px 18px', alignItems: 'flex-start', gap: 14,
        background: 'oklch(0.99 0.02 25)', borderLeft: '2px solid oklch(0.86 0.06 25)',
      }}>
        <Mono size={11} color="var(--pl-ink-700)" style={{ paddingTop: 2 }}>{path}</Mono>
        <MsgBody role={d.l.role} body={d.l.body} kind="old" />
        <DiffSide value={undefined} />
      </div>
    );
  }
  // edit
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '240px 1fr 1fr',
      padding: '8px 18px', alignItems: 'flex-start', gap: 14,
      background: 'oklch(0.99 0.02 240)', borderLeft: '2px solid var(--pl-signal-deep)',
    }}>
      <Mono size={11} color="var(--pl-ink-700)" style={{ paddingTop: 2 }}>{path}</Mono>
      <MsgBody role={d.l.role} body={d.l.body} kind="old" />
      <MsgBody role={d.r.role} body={d.r.body} kind="new" />
    </div>
  );
}

function MsgBody({ role, body, kind }) {
  const tones = {
    old: { bg: 'oklch(0.94 0.05 25)',  bd: 'oklch(0.86 0.06 25)',  col: 'oklch(0.36 0.13 25)',  glyph: '−' },
    new: { bg: 'oklch(0.94 0.05 155)', bd: 'oklch(0.86 0.05 155)', col: 'oklch(0.30 0.10 155)', glyph: '+' },
  };
  const s = tones[kind];
  return (
    <div style={{
      padding: '4px 8px', borderRadius: 4,
      background: s.bg, border: `1px solid ${s.bd}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 11, color: s.col, fontWeight: 600 }}>{s.glyph}</span>
        <Mono size={9.5} color="var(--pl-ink-600)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>{role}</Mono>
      </div>
      <pre style={{
        margin: 0, fontFamily: 'var(--pl-mono)', fontSize: 11.5,
        color: s.col, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5,
      }}>{body}</pre>
    </div>
  );
}

window.PromptDiffPage = PromptDiffPage;
