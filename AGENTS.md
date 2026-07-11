# AGENTS.md

Guidance for AI agents (and human contributors) working in this repository. This file is the **source of truth**. Read it in full before changing code

## Golden rule: when in doubt, stop and ask

If you find a contradiction (between these rules, the code, an issue, or the request you were given), or a change would introduce a security risk or break an established best practice, you MUST NOT code around it. Stop and ask the maintainer before proceeding

## Scope discipline

- You SHOULD do exactly what was asked, and SHOULD NOT expand scope, refactor unrelated code, or "improve" things nobody requested
- One pull request SHOULD make one logical change. Open a consultation issue before investing time in a large PR
- Before creating a file or tiddler, you MUST check whether it already exists. If it does, read it and get confirmation before overwriting
- Before editing documentation tiddlers, you MUST check `git status` / `git diff` first so you do not overwrite edits made by a human

## Dependencies and git

- You MUST NOT install dependencies (npm packages, browser binaries, or other software) without explicit consent. Say what will be installed and ask first
- You MUST NOT commit or push unless explicitly asked. Approval of a change is not approval to commit or push

## Tooling and shell

- You MUST NOT use `npx`. Use globally installed tools or npm scripts
- You SHOULD use non-interactive flags for shell file operations (`rm -f`, `cp -f`, `mv -f`) so commands do not hang on a prompt

## Code style

- You MUST indent code files (`.tid`, `.info`, `.files`, `.js`, `.json`, and other code) with TAB characters only: never spaces, never mixed, and never spaces to align code, comments, or `=` signs. (`.tid` files render one tab as 4 columns.) Markdown (`.md`) prose MAY use spaces
- You MUST write files with LF line endings only, NEVER CRLF
- You MUST write text files as UTF-8 WITHOUT a BOM. A BOM or non-UTF-8 encoding breaks shell shebangs and cross-platform tooling
- JavaScript MUST target ES2017 for browser and core code; ES2023 MAY be used only for `bin/` and `core-server/`. This is enforced by ESLint (`eslint-plugin-es-x`)
- You SHOULD run `npm run lint` before pushing (`npm run lint:fix` auto fixes style). CI runs ESLint on every PR and fails the check on error-level violations in the lines you changed; most style rules (tab indent, double quotes, semicolons) are errors, so they block
- CSS targets the same era (roughly 2018). You SHOULD NOT use newer features such as `:has()`, container queries, `@layer`, `@scope`, or subgrid. If one would be far simpler than the alternative, you MAY propose it with trade-offs for the maintainer to decide; you SHOULD NOT adopt it silently
- You MUST NOT use CSS `!important`. Use specificity instead

## Code Comments

- A comment SHOULD state the **why** of a non-obvious decision, never the **how**. One sentence is usually enough
- Use a concrete example, not abstract placeholders. Comments SHOULD NOT contain conversational filler or explanations of standard APIs or basic language constructs
- Bad: a five line paragraph restating what the code already says
- Good: `// 'instant' avoids re-animation by CSS scroll-behavior: smooth`

## Wikitext and TiddlyWiki conventions

- You SHOULD use `\procedure`; the `\define` pragma is deprecated
- You SHOULD use the `<%if%>` conditional shortcut for filter-driven rendering, and reserve `$reveal` for state-driven show/hide UI (popups, animation, `retain`)
- You SHOULD NOT use `\whitespace trim` when a template contains prose or text runs; it eats meaningful whitespace around the text. Use it only in templates that are purely widgets and markup
- You SHOULD name derived variables (values computed from parameters) with a leading underscore, for example `_myValue`
- For a widget with several attributes, you SHOULD put one attribute per line, and put a space before `>` when it is immediately followed by `<<variable>>`

## Backwards compatibility

- You MUST NOT change the signature of a globally available procedure, macro, function, widget, or existing JavaScript API function or method (for example `$tw.utils.*`, widget prototype methods, or module `exports`) without explicit maintainer approval. Preserving backwards compatibility is the default; breaking it needs a very strong reason

## Tests

- Run the suite with `npm test`. (This builds the `test` edition; it is not a `--test` flag.)
- On Windows, or to iterate on a few specs, run `node editions/test/quick-test.js [spec-name ...]` (no argument runs all specs). It boots the test edition and skips the slow `--build index` render step, so it is much faster than `npm test`
- You SHOULD NOT run the full suite after every small change; run it before pushing or when asked
- Every test SHOULD either guard a specific reported regression (reference the issue) or cover a distinct code path. No one-test-per-parameter padding
- Write tests as expectations of what the code **should** do, not what it currently does. You MUST NOT weaken an assertion to match buggy output: fix the code, or mark the test todo and file an issue describing the defect
- When auditing your own work, you SHOULD be honest about sloppy fixes; distinguish legitimate test adjustments from weakening a test until it passes
- When a test fails, you SHOULD find the cause before changing anything: a wrong test assumption (fix the test), a fixture missing data (inject it inside the test, do not edit the shared fixture), or a real code defect (keep the assertion, mark the test todo, file an issue)
- You SHOULD NOT couple a fixture to one test. If a test needs specific values, set them up inside the test, not in the shared fixture
- Each test SHOULD be reproducible by maintainers from its body and comments

## Security

- You MUST NOT introduce arbitrary code execution, path traversal, injection, or unsanitized `innerHTML`. You MUST sanitize untrusted input and treat unsafe URL schemes (`javascript:`, `vbscript:`, `data:text/html`) as hostile
- Material in a PR MUST be free of licensing restrictions: author owned, or licensed compatibly with TiddlyWiki's BSD licence

## Pull requests and commits

This repository squash merges pull requests, so the PR title and description become the permanent commit message. Make them count

- You SHOULD base feature branches on `master`
- You SHOULD  base documentation changes that can be published "out of order" on `upstream tiddlywiki-com` branch. Change TW version specific documentation based on `master`
- **PR title:** it becomes the permanent commit subject, so it MUST be in the imperative mood, capitalised (first word and proper nouns only), 50 characters or fewer, with no trailing period. Check the mood by completing the sentence "If applied, this pull request will ...". A subsystem prefix MAY be added, for example `Menu plugin: ...`
- PR description: the body SHOULD be a one-sentence executive summary, then concise, imperative bullets of what changed and why. The imperative mood applies to the whole commit message, not just the title. The description MUST NOT contain AI marketing or polite filler text
- You MUST rewrite your first draft of any comment or commit text about 30 percent shorter before showing it to anyone. Present your optimum; the author can still shorten it further. A draft presented for review counts as final: authors often approve unread, and reviewers inherit the bloat
- The message SHOULD describe behaviour and why, not a file inventory: the diff already lists changed files. Name a file only when it is the subject of the change, and say what it does
- You SHOULD NOT use hyphens, en-dashes, or em-dashes as stylistic punctuation in prose and code comments; prefer short sentences
- Commit and PR text SHOULD describe what shipped to users, and SHOULD mention a bug fix only if the bug was in a released version; do not document a bug that was introduced and fixed within the same PR
- You SHOULD note any visual change and illustrate it with before/after screenshots.
- A signed Contributor License Agreement (CLA) is REQUIRED and checked by CI. You MUST NOT sign it on the contributor's behalf: it is a legal agreement only the human author can sign. If the author is new, point them to `contributing.md` for how to sign

## Commit and PR message workflow

The aim is a short, human-reviewed message, not a wall of agent text

- You MUST NOT commit until explicitly asked. Approval of a code change is not approval to commit
- When asked to commit, draft the message, apply the 30 percent trim pass, and only then write it into `commit-msg.md` at the repo root for review. Review is a veto gate, not an editing pass
- Then commit with `git commit -F commit-msg.md` and delete the file. You SHOULD NOT stage or commit `commit-msg.md` itself
- The draft MUST already be trimmed and follow the title and description rules above, so the author has nothing left to shorten

Lay the message out as a subject line, a one-sentence executive summary, then imperative `*` bullets. Wrap body lines at 80 columns or fewer:

```
Add AGENTS.md as the contribution source of truth

Give AI agents and human contributors one authoritative set of rules for
working in this repository

* Capture the contribution and coding conventions in AGENTS.md, covering
  scope discipline, code style, tests, security, and the pull request and
  commit workflow
* Point the Claude Code and Gemini CLI tools at AGENTS.md so each agent
  reads the same guidance instead of a separate copy that could drift
* Keep AGENTS.md as the single place to update when the rules change, so
  the tool files stay thin pointers
```

## Chat and response style

- Reference code as clickable markdown links, for example `[file.js:42](path/to/file.js#L42)`, never bare paths or backticks
- Use clickable links for commit hashes and pull requests, not bare hashes.
- Give every table a unique label and a number that increments across the whole conversation
- You SHOULD prefix any part that needs a decision from the user with a lightning icon
- When the user asks for something, do it immediately; do not argue
- Test suggested variants before explaining why they will not work
