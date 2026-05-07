# Contributing

Thanks for your interest in contributing to Agent Skills! This guide covers
everything you need to add, improve, or fix a skill.

## Adding a new skill

1. Create a directory under `skills/` named after your skill (lowercase,
   hyphens):

   ```
   skills/my-new-skill/
   └── SKILL.md
   ```

2. Add **YAML front matter** at the top of `SKILL.md` with `name` and
   `description`:

   ```yaml
   ---
   name: my-new-skill
   description: One-line summary of what the skill does.
   ---
   ```

   These fields are used to auto-generate the skills table in README.md.

3. Write the skill body below the front matter. Follow these conventions:
   - Use `$ARGUMENTS` as the placeholder for user input.
   - Structure the skill in numbered phases or steps.
   - Be explicit — the agent executes your instructions literally.

4. **Optional:** add supporting files (scripts, templates) in the same
   directory. See `skills/check-oss-readiness/` for an example with helper
   shell scripts.

5. Open a Pull Request. The CI will automatically update the skills table in
   README.md when your `SKILL.md` is merged.

## Improving an existing skill

- Edit the `SKILL.md` directly. If you change `name` or `description` in the
  front matter, the README table updates automatically on merge.
- Keep changes focused — one concern per PR.

## Skill conventions

| Convention | Details |
|---|---|
| Front matter | YAML between `---` fences; must include `name` and `description` |
| Arguments | Use `$ARGUMENTS` for user-supplied input |
| Phases | Number your phases/steps so the agent works through them in order |
| Idempotency | Skills should be safe to re-run without side effects |
| Supporting files | Place scripts, templates, etc. alongside `SKILL.md` in the same directory |

## Local development setup

See [DEVELOPER.md](DEVELOPER.md) for repo structure, hooks, and automation
details.

## Code of conduct

Be kind, be constructive. We follow the
[Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## License

By contributing you agree that your contributions will be licensed under
Apache-2.0 (see [LICENSE](LICENSE)).
