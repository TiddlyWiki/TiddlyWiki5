# AGENTS.md

Guidance for AI agents (and human contributors) working in this repository. This file is the **source of truth**. Read it in full before changing code. Tool specific files such as `CLAUDE.md` only point back here.

## Golden rule: when in doubt, stop and ask

If you find a contradiction (between these rules, the code, an issue, or the request you were given), or a change would introduce a security risk or break an established best practice, **do not code around it**. Stop and ask the maintainer before proceeding.

## Scope discipline

- Do exactly what was asked. Do not expand scope, refactor unrelated code, or "improve" things nobody requested.
- One pull request makes one logical change. Open a consultation issue before investing time in a large PR.
- Before creating a file or tiddler, check whether it already exists. If it does, read it and ask before overwriting.
- Before editing documentation tiddlers, check `git status` / `git diff` first so you do not overwrite edits made by a human.

## Dependencies and git

- Never install dependencies (npm packages, browser binaries, or other software) without explicit consent. Say what will be installed and ask first.
- Do not commit or push unless explicitly asked. Approval of a change is not approval to commit or push.

## Tooling and shell

- Do not use `npx`. Use globally installed tools or npm scripts.
- Use non-interactive flags for shell file operations (`rm -f`, `cp -f`, `mv -f`) so commands do not hang on a prompt.

## Code style

- Indent code files (`.tid`, `.info`, `.files`, `.js`, `.json`, and other code) with TAB characters only: never spaces, never mixed, and never spaces to align code, comments, or `=` signs. (`.tid` files render one tab as 4 columns.) Markdown (`.md`) prose may use spaces.
- Write files with LF line endings only, never CRLF.
- Write text files as UTF-8 WITHOUT a BOM. A BOM or non-UTF-8 encoding breaks shell shebangs and cross-platform tooling.
- JavaScript baseline: ES2017 for browser and core code; ES2023 only for `bin/` and `core-server/`. This is enforced by ESLint (`eslint-plugin-es-x`).
- Run `npm run lint` before pushing (`npm run lint:fix` auto fixes style). CI runs ESLint on every PR and fails the check on error-level violations in the lines you changed; most style rules (tab indent, double quotes, semicolons) are errors, so they block.
- CSS baseline is the same era (roughly 2018). Avoid newer features such as `:has()`, container queries, `@layer`, `@scope`, and subgrid. If one would be far simpler than the alternative, propose it with trade-offs and let the maintainer decide. Never adopt it silently.
- Never use CSS `!important`. Use specificity instead.

## Code Comments

- Comment the **why** of a non-obvious decision, never the **how**. One sentence is usually enough.
- Use a concrete example, not abstract placeholders. No conversational filler and no explanations of standard APIs or basic language constructs.
- Bad: a five line paragraph restating what the code already says.
- Good: `// 'instant' avoids re-animation by CSS scroll-behavior: smooth`.

## Wikitext and TiddlyWiki conventions

- Use `\procedure`. The `\define` pragma is deprecated.
- Use the `<%if%>` conditional shortcut for filter-driven rendering. Reserve `$reveal` for state-driven show/hide UI (popups, animation, `retain`).
- Use `\whitespace trim` only in templates that are purely widgets and markup. Do not use it when the template contains prose or text runs; it eats meaningful whitespace around the text.
- Name derived variables (values computed from parameters) with a leading underscore, for example `_myValue`.
- For a widget with several attributes, put one attribute per line. Put a space before `>` when it is immediately followed by `<<variable>>`.

## Backwards compatibility

- You MUST NOT change the signature of a globally available procedure, macro, function, widget, or existing JavaScript API function or method (for example `$tw.utils.*`, widget prototype methods, or module `exports`) without explicit maintainer approval. Backwards compatibility must be preserved; breaking it needs a very strong reason.

## Tests

- Run the suite with `npm test`. (This builds the `test` edition; it is not a `--test` flag.)
- Do not run the full suite after every small change; run it before pushing or when asked.
- Every test must either guard a specific reported regression (reference the issue) or cover a distinct code path. No one-test-per-parameter padding.
- Write tests as expectations of what the code **should** do, not what it currently does. Never weaken an assertion to match buggy output: fix the code, or mark the test todo and file an issue describing the defect.
- When auditing your own work, be honest about sloppy fixes; distinguish legitimate test adjustments from weakening a test until it passes.
- When a test fails, find the cause before changing anything: a wrong test assumption (fix the test), a fixture missing data (inject it inside the test, do not edit the shared fixture), or a real code defect (keep the assertion, mark the test todo, file an issue).
- Do not couple a fixture to one test. If a test needs specific values, set them up inside the test, not in the shared fixture.
- Write each test so a human can reproduce it by hand from its body and comments.

## Security

- Never introduce arbitrary code execution, path traversal, injection, or unsanitized `innerHTML`. Sanitize untrusted input. Treat unsafe URL schemes (`javascript:`, `vbscript:`, `data:text/html`) as hostile.
- Material in a PR must be free of licensing restrictions: author owned, or licensed compatibly with TiddlyWiki's BSD licence.

## Pull requests and commits

This repository squash merges pull requests, so the PR title and description become the permanent commit message. Make them count.

- Base feature branches on `master`.
- **PR title (MUST):** it becomes the permanent commit subject, so it MUST be in the imperative mood, capitalised (first word and proper nouns only), 50 characters or fewer, with no trailing period. Test the mood: the title must complete the sentence "If applied, this pull request will ...". An optional subsystem prefix is fine, for example `Menu plugin: ...`.
- PR description: a one-sentence executive summary, then concise, imperative bullets of what changed and why. The imperative mood applies to the whole commit message, not just the title. No AI marketing or polite filler text.
- Describe behaviour and why, not a file inventory: the diff already lists changed files. Name a file only when it is the subject of the change, and say what it does.
- Avoid hyphens, en-dashes, and em-dashes in prose and code comments; prefer short sentences.
- Commit and PR text describes what shipped to users. Mention a bug fix only if the bug was in a released version; do not document a bug that was introduced and fixed within the same PR.
- Note any visual change and illustrate it with before/after screenshots.
- A signed Contributor License Agreement (CLA) is required and checked by CI. Do not sign it on the contributor's behalf: it is a legal agreement the human author must sign. If the author is new, point them to `contributing.md` for how to sign.

## Commit and PR message workflow

The aim is a short, human-reviewed message, not a wall of agent text.

- Do not commit until explicitly asked. Approval of a code change is not approval to commit.
- When asked to commit, draft the message into `commit-msg.md` at the repo root and let the author review and shorten it before committing. This is where the PR opening post gets trimmed.
- Then commit with `git commit -F commit-msg.md` and delete the file. Never stage or commit `commit-msg.md` itself.
- The draft must already follow the title and description rules above, so the author is trimming, not rewriting.

Lay the message out as a subject line, a one-sentence executive summary, then imperative `*` bullets. Wrap body lines at 80 columns or fewer:

```
Add AGENTS.md as the contribution source of truth

Give AI agents and human contributors one authoritative set of rules for
working in this repository.

* Capture the contribution and coding conventions in AGENTS.md, covering
  scope discipline, code style, tests, security, and the pull request and
  commit workflow.
* Point the Claude Code and Gemini CLI tools at AGENTS.md so each agent
  reads the same guidance instead of a separate copy that could drift.
* Keep AGENTS.md as the single place to update when the rules change, so
  the tool files stay thin pointers.
```

## Chat and response style

_(Draft, pending discussion.)_

- Reference code as clickable markdown links, for example `[file.js:42](path/to/file.js#L42)`, never bare paths or backticks.
- Use clickable links for commit hashes and pull requests, not bare hashes.
- Give every table a unique label and a number that increments across the whole conversation.
- Prefix any part that needs a decision from the user with a lightning icon.
- When the user asks for something, do it immediately; do not argue.
- Test suggested variants before explaining why they will not work.
