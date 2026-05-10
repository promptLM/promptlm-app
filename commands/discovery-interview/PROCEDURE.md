# Discovery Interview — Procedure

This is the canonical, agent-neutral procedure for running a structured
discovery interview that produces a traceable decision recommendation.

## Operating principles

1. **One question at a time.** Never batch questions. Wait for the user's
   answer before asking the next one.
2. **Summarize before advancing.** After each answer, restate what you
   understood in 1–3 sentences and ask the user to confirm or correct.
3. **Surface, don't conclude.** After each summary, list any new assumptions,
   risks, missing facts, or implications. Do not skip to a recommendation
   until the decision log is materially complete.
4. **No invention.** If a fact is unknown, record it as an open question, not
   as a fact.
5. **Plain language.** The user is technically capable but not necessarily
   expert in specialized domains. Translate jargon. Define acronyms.
6. **No professional advice.** Do not impersonate a licensed lawyer,
   accountant, financial advisor, doctor, or compliance officer. Flag items
   that need expert review.
7. **Neutrality.** Avoid leading questions. Present tradeoffs evenly.
8. **Traceability over speed.** Every later claim must trace back to a
   recorded fact, assumption, or risk.

## Phase 1 — Frame the decision

Goal: pin down what is actually being decided and why.

Ask, in order, one at a time:

1. What decision are you trying to make?
2. What outcome would success look like? (objective in user's words)
3. By when does the decision need to be made? What forces the deadline?
4. Who else is affected by or part of this decision? (stakeholders)
5. What constraints are non-negotiable? (budget, time, regulatory, ethical, contractual)

After Phase 1, write the first version of the decision log:
- Decision being considered
- User objective
- Stakeholders
- Constraints
- Deadline
- Initial open questions

## Phase 2 — Gather facts and context

Goal: collect the facts a reasonable advisor would need before opining.

For each question, summarize the answer, then update the decision log.

Cover at minimum:
- Current situation / status quo
- What has already been tried or ruled out, and why
- Relevant numbers (costs, revenues, headcount, dates, volumes) — record exactly as the user states them
- Relevant entities, jurisdictions, contracts, systems, or third parties
- Domain-specific context (e.g., for a tax decision: residency, entity type, fiscal year; for a hiring decision: role, level, location, comp band; for an architecture decision: scale, latency, team size)

If the user says "I don't know," **do not guess** — record it as an unknown
and note whether it needs expert input.

## Phase 3 — Surface options, risks, and tradeoffs

Goal: lay out the option space and the consequences of each.

For each option:

1. State the option neutrally.
2. List its main upsides.
3. List its main downsides and risks.
4. Note dependencies and required preconditions.
5. Estimate effort/cost qualitatively (the user can refine).

For each risk surfaced anywhere in the interview, explain in plain language:

- **What** the risk is
- **Why** it matters (impact)
- **What could happen** if ignored (worst-case and likely-case)
- **How** to reduce or investigate it (mitigations or diligence steps)
- **Whether expert review is needed** and what kind

Ask the user which downsides are dealbreakers. Use that to derive **decision
criteria** (e.g., "must be reversible," "max 30-day implementation," "no new
recurring cost above $X"). Confirm the criteria with the user before moving on.

## Phase 4 — Pre-recommendation check

Before giving a recommendation, verify:

- The decision log has at least: objective, options, criteria, risks, key facts, and open questions.
- All material assumptions are explicitly labeled as assumptions.
- Each option has been evaluated against the agreed criteria.
- Items needing expert review are flagged.

If anything in this checklist is missing, return to the appropriate earlier
phase and ask the next best question. Do not guess to fill gaps.

## Phase 5 — Final report

When the user signals readiness — or when the log is complete and you have
asked "Is there anything else I should know before I summarize?" and received
no new material — produce the final report following
`final-report-template.md`.

Every recommendation in the report must connect explicitly back to:

- User goals
- Facts provided
- Risks identified
- Decision criteria
- Tradeoffs discussed

Use the **traceability table** in the template to make those links explicit.
Label every assumption as an assumption, not a fact.

## Validation checklist

Before declaring the interview complete, confirm:

- [ ] You asked one question at a time throughout.
- [ ] Every user answer has a corresponding summary.
- [ ] No fact in the log is invented or inferred without being labeled an assumption.
- [ ] Every risk has the five-part explanation (what / why / consequence / mitigation / expert-review).
- [ ] The recommendation traces to objective, facts, risks, criteria, and tradeoffs.
- [ ] Items needing licensed-professional review are explicitly flagged.
- [ ] Open questions are listed and not silently dropped.
- [ ] The final report follows `final-report-template.md` section by section.

If any item fails, fix it before reporting "done."
