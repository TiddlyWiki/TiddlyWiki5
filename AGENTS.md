# AGENTS.md

Guidance for AI agents (and human contributors) working in this repository. This file is the **source of truth** and outranks any personal or global instructions an agent carries. Read it in full before changing code

Machine-specific rules MAY sit beside this file, optional and ignored by git: `AGENTS-before.md`, read first, for facts such as tool paths or scratch locations; `AGENTS-after.md`, read last, for additions such as a commit ritual. Without an import syntax, read them by name

@./AGENTS-before.md

## Golden rule: when in doubt, stop and ask

If you find a contradiction (between these rules, the code, an issue, or the request you were given), or a change would introduce a security risk or break an established best practice, you MUST NOT code around it. Stop and ask the maintainer before proceeding

If you are stuck, you MUST search your memory store, if you have one (local memory, or an MCP memory server), before you start investigating. An earlier session may already have solved it

## Scope discipline

- You SHOULD do exactly what was asked, and SHOULD NOT expand scope, refactor unrelated code, or "improve" things nobody requested
- One pull request SHOULD make one logical change, unless several changes touch the same file and separate pull requests would depend on or invalidate each other
- A change that could break existing wikis SHOULD still get its own pull request, so the incompatibility can be discussed separately
- You MUST open a consultation issue before investing time in a large PR
- Before creating a file or tiddler, you MUST check whether it already exists. If it does, read it and get confirmation before overwriting
- Before editing documentation tiddlers, you MUST check `git status` / `git diff` first so you do not overwrite edits made by a human

## Dependencies and git

- You MUST NOT install dependencies (npm packages, browser binaries, or other software) without explicit consent. Say what will be installed and ask first
- You MUST NOT commit or push unless explicitly asked. Approval of a change is not approval to commit or push
- You MUST NOT discard changes by directory or across the whole tree (`git checkout -- editions/`, `git restore .`). Name each file, and read `git diff -- <file>` first, because the maintainer's uncommitted edits may sit in the same file
- Before discarding anything, save the tracked changes with `git diff > pre-discard.patch` into the scratch location named under Tooling and shell
- `git stash -u` can report success while leaving tracked changes in place and still deleting untracked files, so read `git status` before you drop the stash. A dropped stash keeps its untracked files in its third parent, `git show <sha>^3`

## Tooling and shell

- You MUST NOT use `npx`. Use globally installed tools or npm scripts
- If neither a global tool nor an npm script exists, STOP and ask the maintainer. You MUST NOT install anything yourself and MUST NOT work around the ban
- You SHOULD use non-interactive flags for shell file operations (`rm -f`, `cp -f`, `mv -f`) so commands do not hang on a prompt
- Scratch files (probes, captures, screenshots, intermediate output) MUST go in `<home>/tmp/LLMs/<project-slug>/<branch-name>/` (`<home>` is the OS home directory, `<project-slug>` the repository name, for example `TiddlyWiki5`), never in the repository or an agent private temp directory, so every agent and the maintainer use one known location and maintainers can learn from it

## Code style

- You MUST indent code files (`.tid`, `.info`, `.files`, `.js`, `.json`, and other code) with TAB characters only: never spaces, never mixed, and never spaces to align code, comments, or `=` signs. (`.tid` files render one tab as 4 columns.) Markdown (`.md`) prose MAY use spaces
- You MUST write files with LF line endings only, NEVER CRLF
- You MUST write text files as UTF-8 WITHOUT a BOM. A BOM or non-UTF-8 encoding breaks shell shebangs and cross-platform tooling
- JavaScript MUST target ES2017 for browser and core code; ES2023 MAY be used only for `bin/` and `core-server/`. This is enforced by ESLint (`eslint-plugin-es-x`)
- You SHOULD run `npm run lint` before pushing (`npm run lint:fix` auto fixes style). CI runs ESLint on every PR and fails the check on error-level violations in the lines you changed; most style rules (tab indent, double quotes, semicolons) are errors, so they block
- CSS targets the same era (roughly 2018). You SHOULD NOT use newer features such as `:has()`, container queries, `@layer`, `@scope`, or subgrid. If one would be far simpler than the alternative, you MAY propose it with trade-offs for the maintainer to decide; you SHOULD NOT adopt it silently
- You MUST NOT use CSS `!important`. Use specificity instead

## Trim pass

This applies to everything you write: code comments, commit and pull request text, documentation, issue bodies, review replies

- You MUST cut your first draft against a number before anyone sees it: a code comment is one sentence, a commit message meets the limits under Commit and PR message workflow, a review reply is at most three sentences, an issue body at most ten lines
- Present your optimum; the author can still shorten it further. A draft presented for review counts as final, because authors often approve unread and reviewers inherit the bloat
- You SHOULD NOT use hyphens, en-dashes, or em-dashes as stylistic punctuation in prose and code comments; prefer short sentences

## Code comments

- A comment MUST state the **why** of a non-obvious decision, never the **how**, in ONE sentence. A second sentence needs a reason to exist
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
- Every test SHOULD either guard a specific reported regression (reference the GitHub issue) or cover a distinct code path. No one-test-per-parameter padding
- A new test MUST be proven able to fail: reintroduce the defect, confirm the test catches it, restore the code. A test never seen red proves nothing
- Write tests as expectations of what the code **should** do, not what it currently does. You MUST NOT weaken an assertion to match buggy output: fix the code, or mark the test todo and file a GitHub issue describing the defect
- You MUST NOT invent an expected value. Measure it by running the code, or leave it empty for the maintainer: a guessed expectation fails for the wrong reason, or passes against a wrong value
- When auditing your own work, you SHOULD be honest about sloppy fixes; distinguish legitimate test adjustments from weakening a test until it passes
- When a test fails, you SHOULD find the cause before changing anything: a wrong test assumption (fix the test), a fixture missing data (inject it inside the test, do not edit the shared fixture), or a real code defect (keep the assertion, mark the test todo, file a GitHub issue)
- You SHOULD NOT couple a fixture to one test. If a test needs specific values, set them up inside the test, not in the shared fixture
- Each test SHOULD be reproducible by maintainers from its body and comments
- Testcase tiddlers under `editions/tw5.com/tiddlers/testcases/` are pulled into the test edition and run by `npm test`, so treat one as a test. It runs as a spec only when it has both an `Output` and an `ExpectedResult` payload; with `Output` alone it is skipped silently
- Three testcase format rules each cost a failing run: keep a payload's fields on consecutive lines (a blank line ends the fields and starts the text), open `Output` with `\import [subfilter{$:/core/config/GlobalImportFilter}]` because the runner imports no global macros and a call to one renders as nothing, and end the file with no trailing newline because the comparison is byte exact
- Embed a testcase in documentation with `<<testcase "TestCases/Path/Name">>` or `{{TestCases/Path/Name||$:/core/ui/TestCaseTemplate}}`. A plain `{{TestCases/Path/Name}}` has no parser for the type and renders the raw payload

## Security

- You MUST NOT introduce arbitrary code execution, path traversal, injection, or unsanitized `innerHTML`. You MUST sanitize untrusted input and treat unsafe URL schemes (`javascript:`, `vbscript:`, `data:text/html`) as hostile
- Material in a PR MUST be free of licensing restrictions: author owned, or licensed compatibly with TiddlyWiki's BSD licence

## Pull requests and commits

This repository squash merges pull requests, so the PR title and description become the permanent commit message. Make them count

- You SHOULD base feature branches on `master`
- You SHOULD base documentation changes that can be published out of order on the `tiddlywiki-com` branch of the main repository, and documentation tied to a TiddlyWiki version on `master`
- **PR title:** it becomes the permanent commit subject, so it MUST be in the imperative mood, capitalised (first word and proper nouns only), 50 characters or fewer, with no trailing period. Check the mood by completing the sentence "If applied, this pull request will ...". A subsystem prefix MAY be added, for example `Menu plugin: ...`
- PR description: the body SHOULD be a one-sentence executive summary, then concise, imperative bullets of what changed and why. The imperative mood applies to the whole commit message, not just the title. The description MUST NOT contain AI marketing or polite filler text
- The title and description get the trim pass like everything else
- The message MUST NOT repeat what the reader already has. Of each sentence ask where else it is available: the linked issue or advisory, the diff, the code comments, the review thread. If it is there, cut it. The diff already lists changed files, so name a file only when it is the subject of the change, and say what it does
- A PR description SHOULD NOT use section headings. Needing them means it is too long. You SHOULD NOT pre-empt review objections by defending decisions nobody has questioned; answer when asked
- Commit and PR text SHOULD describe what shipped to users, and SHOULD mention a bug fix only if the bug was in a released version; do not document a bug that was introduced and fixed within the same PR
- If you use an external issue tracker, its IDs MUST NOT appear in commit messages or PR text, not even on branch commits
- Every user-visible change gets a change note. An impact note is needed only when a change alters the format of output that was plausible but buggy; a plainly wrong value nobody could rely on needs none
- Release notes live in `editions/tw5.com/tiddlers/releasenotes/<version>/` and track the pull request, not the issue: the PR number goes in the filename (`#<PR>.tid`), title and links, with `#TODO` until it exists
- You SHOULD note any visual change and illustrate it with before/after screenshots
- A signed Contributor License Agreement (CLA) is REQUIRED and checked by CI. You MUST NOT sign it on the contributor's behalf: it is a legal agreement only the human author can sign. If the author is new, point them to `contributing.md` for how to sign

## Commit and PR message workflow

The aim is a short, human-reviewed message, not a wall of agent text

- You MUST NOT commit until explicitly asked. Approval of a code change is not approval to commit
- When asked to commit, draft the message, apply the trim pass, and only then write it into `commit-msg.md` at the repo root for review. Review is a veto gate, not an editing pass
- Then commit with `git commit -F commit-msg.md` and delete the file. You SHOULD NOT stage or commit `commit-msg.md` itself
- The draft MUST already be trimmed and follow the title and description rules above, so the author has nothing left to shorten
- A trivial change gets a subject line only. A body that restates the subject is noise
- Measure the draft before presenting it: subject 50 characters or fewer, summary at most two lines, each bullet one line, every line 80 columns or fewer. A draft outside these numbers goes back for another cut, not to the author

Lay the message out as a subject line, a one-sentence executive summary, then imperative `*` bullets:

```
Add AGENTS.md as the contribution source of truth

Give AI agents and human contributors one authoritative set of rules for
working in this repository

* Point the Claude Code and Gemini CLI tools at AGENTS.md so each agent
  reads the same guidance instead of a copy that could drift
* Keep the tool files as thin pointers, so the rules change in one place
```

## Chat and response style

- You MUST reference code as clickable markdown links, for example `[file.js:42](path/to/file.js#L42)`. When no link can resolve (a path with spaces, or outside the workspace), give the plain path in backticks
- You MUST use clickable links for commit hashes and pull requests, not bare hashes
- You MUST give every table a unique label and a number that increments across the whole conversation
- You SHOULD prefix any part that needs a decision from the user with a lightning icon (⚡)
- When the user asks for something, you MUST do it immediately and not argue, unless a rule above requires stopping
- You MUST test suggested variants before explaining why they will not work

@./AGENTS-after.md
