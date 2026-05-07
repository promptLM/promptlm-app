---
name: research-programme
description: Bootstrap a verified multi-topic research programme — orchestrated sub-agents producing a pre-implementation design dossier. Calls research-topic for each topic; rules in research-methodology.
---

# research-programme — bootstrap a multi-topic research programme

You are the orchestrator. The user gives you a domain and constraints in `$ARGUMENTS`.

## Bundle map

This command is part of the research bundle:
- **`research-methodology`** — the canonical rules. Read this first if you don't know the doctrine.
- **`research-programme`** (this command) — bootstraps the programme: project structure, topic backlog, operating model, then iterates over the backlog calling `research-topic` for each.
- **`research-topic`** — runs one topic with the hardened agent prompt, critic pass, distillation, archive.

Whenever this command says "dispatch a topic", it means: invoke `research-topic` with the appropriate scope and sub-questions. Do NOT re-implement the per-topic workflow inline — that logic lives in `research-topic` so changes to the harness are made in one place.

## Step 1 — Clarify if needed

If `$ARGUMENTS` is empty or vague, ask up to four clarifying questions before doing anything else (use AskUserQuestion if available; load deferred tools first if needed):

1. **Domain and product framing** — what's being researched, anchored to a one-sentence product description.
2. **Hard constraints** — licence posture (commercial-use OK? Apache-2.0/MIT/BSD preferred? AGPL flagged?), deployment topology (on-prem? SaaS? both?), regulatory or jurisdictional anchors if any, data sensitivity.
3. **Topic backlog** — does the user have a list of topics to research, or should you propose one?
4. **Cadence** — sequential single-topic-at-a-time, or parallel? MVP-time-pressure or research-first?

## Step 2 — Bootstrap the project structure

Create this directory layout in the working directory:

```
docs/
├── tech-spec.md                # definitive architecture (skeleton; fills as topics close)
├── log.md                      # chronological session record + decision register (D-NN)
├── research-plan.md            # topic backlog + per-topic deliverable contract
├── research-summary.md         # executive synthesis (written at the end)
├── findings/                   # per-topic distilled outputs (created as topics close)
└── research/                   # primary sources (PDFs, RFCs, regulations)

_archive/
├── transcripts/                # raw agent transcripts, framed by orchestrator
└── reasoning/                  # long-form orchestrator reasoning (often empty; that's OK)
```

Add `_archive/` to `.gitignore` on a `main` branch by default. Initialise git if requested.

Write `research-plan.md` with:
- The topic backlog (numbered).
- A reference to `research-methodology` and `research-topic` (the bundle the programme uses).
- The per-topic deliverable contract (sources cited, mechanics described, licences stated, benchmarks sourced, recommendation defended).

## Step 3 — Establish the operating model in `log.md`

Write the opening session entry. Record:
- Operating roles: orchestrator (you), research sub-agents (one per topic), critic sub-agents (one per topic, after each findings draft), optional final reviewer.
- Strict separation rule: working set in `docs/`; raw audit trail in `_archive/`. Sub-agents never receive `_archive/` content.
- Topic-flow contract: each topic goes through `research-topic`.
- Decision-register convention: D-NN globally numbered, cross-referenced from `log.md` to `tech-spec.md` sections.
- Anchor strategy decisions (D-01 onwards): inherited constraints, picked architectural blueprint, deployment topologies.

## Step 4 — Iterate the backlog

For each topic in the backlog, in the chosen order (sequential by default):

1. **Compose scope and sub-questions** for the topic, inheriting locked-in constraints from prior topics' decisions.
2. **Invoke `research-topic`** with the topic name + sub-questions + inherited constraints. Do not re-implement the per-topic workflow here — `research-topic` handles dispatch, verification, critic pass, distillation, archive, and working-set updates.
3. **Wait for `research-topic` to complete.** It will return when the findings doc is written, the transcript archived, and `tech-spec.md` / `log.md` / `research-plan.md` are updated.
4. **Advance** to the next topic.

If a topic surfaces a new sub-topic that wasn't in the backlog, add it to a "Surfaced during research" section of `research-plan.md` and schedule it after the main backlog (unless it's blocking; then handle inline).

## Step 5 — End-of-programme synthesis

When all backlog topics are closed:

1. Write `research-summary.md` — executive synthesis. One-sentence product description, topic outcomes table, architectural anchors (the non-negotiables that emerged), build-cost line items, exclusions, single-deliverable index for first-readers ("if you read only one doc per concern, here's where to look").
2. Optionally dispatch a **final independent reviewer** — a separate agent (or human) tasked to challenge the entire working set. Adopt gaps as new tracked open questions; push back where decisions are misread.
3. Output the project state: branch heads, open questions count, primary-source count, transcripts count, decisions count.

## Step 6 — Hand off

The output of this command is a complete pre-implementation design dossier. Hand it off with:
- Pointer to `research-summary.md` for executives / new joiners.
- Pointer to `tech-spec.md` for engineers (lookup by section).
- Pointer to `log.md` for "why was this decided" questions.
- Pointer to the implementation-readiness review (if produced) for sprint-1 prep.

## Hard rules — do not skip

- The harness rules in `research-methodology` are non-negotiable. Read that command's body if anything is unclear.
- `research-topic` is the canonical per-topic dispatcher; do not duplicate its logic here.
- Working-set / archive separation is non-negotiable.
- Decisions are globally numbered (D-NN) and cross-referenced log↔spec↔findings.
- Critic-agent pass per topic is mandatory (handled inside `research-topic`).

---

If `$ARGUMENTS` already contains the domain and constraints, proceed to step 2 (skip clarifying questions for what's already provided).
