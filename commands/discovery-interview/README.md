# discovery-interview

A Claude Code slash command that runs a structured **discovery interview** to
help a user converge on the right decision. The agent asks questions one at a
time, summarizes each answer, surfaces assumptions / risks / implications in
plain language, and maintains a running decision log so the final
recommendation is fully traceable.

It is intentionally **domain-agnostic**. It works for entity-formation
choices, hiring decisions, architecture tradeoffs, vendor selection, policy
calls, and anything else that benefits from being decomposed before being
decided. When the topic touches a specialized domain (legal, tax,
accounting, finance, compliance, medical, regulatory), the command flags
items that need a licensed professional rather than impersonating one.

## Layout

```
discovery-interview/
├── README.md                     ← you are here
├── PROCEDURE.md                  ← canonical, agent-neutral procedure
├── interview.md                  ← Claude Code slash command wrapper
├── decision-log-template.md      ← running log structure
└── final-report-template.md      ← required final-report structure
```

## Install for Claude Code

Installation is two steps. **Step 1 is required**; step 2 is optional and
only changes the command name from `/discovery-interview:interview` to the
bare `/interview`.

### Step 1 (required) — install the directory

```bash
# From the root of the project where you want to use the command:
mkdir -p .claude/commands
cp -r /path/to/this/discovery-interview .claude/commands/

# Or, if you want to track upstream updates, symlink instead:
ln -s /path/to/this/discovery-interview .claude/commands/discovery-interview
```

After this step the command is available as
`/discovery-interview:interview`.

### Step 2 (optional) — bare command name

```bash
ln -s discovery-interview/interview.md .claude/commands/interview.md
```

This requires step 1, since the wrapper references files under
`.claude/commands/discovery-interview/`.

## Usage

```
/discovery-interview:interview
/discovery-interview:interview <starting-topic>
```

The optional argument seeds the starting topic — for example,
`/discovery-interview:interview "set up a holding company"` — which the
agent will use as a hint while still asking the user to confirm the actual
decision.

## How it works

The wrapper:

1. Loads the operating principles inline.
2. Points the agent at `PROCEDURE.md` (Phase 1 → Phase 5 + Validation).
3. Tells the agent to maintain a running log per
   `decision-log-template.md`.
4. Tells the agent to deliver the final report per
   `final-report-template.md`.

The agent then runs the interview turn by turn:

- **One** question at a time.
- A short summary after each answer.
- Surfacing of new assumptions / risks / implications after each summary.
- An updated decision log on request and at each phase boundary.
- A final report with a traceability table linking every recommendation back
  to objectives, facts, risks, criteria, and tradeoffs.

## Guarantees

- **No invented facts.** Unknowns stay unknown until the user supplies them.
- **No professional advice.** The agent does not impersonate a licensed
  lawyer, accountant, financial advisor, doctor, or compliance officer; it
  flags items that need expert review.
- **Plain language.** Specialized topics are explained without jargon.
- **Traceability.** Every recommendation links to user goals, facts, risks,
  criteria, and tradeoffs in an explicit table.
- **Read-only.** The command does not modify the repository or any external
  system; it only reads its own reference files and writes the conversation
  back to the user.

## Use from other agents

`PROCEDURE.md` is consumer-neutral. To run the workflow with a non-Claude
client:

1. Have the agent read `PROCEDURE.md`, `decision-log-template.md`, and
   `final-report-template.md` as context.
2. Have the agent open with the scripted opening message.
3. Have the agent follow Phases 1–5 and the Validation checklist.

## License

Apache-2.0 (matches the parent repository).
