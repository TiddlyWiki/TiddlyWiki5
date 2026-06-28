# Repository Contribution Guidelines & Automation

This document establishes the single source of truth for repository contribution guidelines, optimized for AI context consumption, alongside a TiddlyWiki-based automation strategy to prevent source-of-truth drift.

---

## 📄 The High-Density Ruleset
*Copy the content below into a single master tiddler titled `ProjectContributionRules` with the type `text/x-markdown`.*

```markdown
# CONTRIBUTING

## AI & Comment Rules
* Banned: Conversational filler, verbose explanations of standard APIs, or teaching basic programming logic.
* Required: Prune all AI-generated comment blocks down to a single sentence maximum.
* Focus: Comments must only state the "why" behind non-obvious engineering decisions, never the "how".
* PR Descriptions: Write concise, bulleted summaries of what changed. Do not use AI-generated marketing/polite filler text.

### Code Comment Examples
* BAD: // Use behavior:"instant" so that this animation's per-frame position updates are applied immediately and are NOT re-animated by a CSS `scroll-behavior: smooth` on the scrolling element (which would make the page lag behind and stutter).
* GOOD: // Use 'instant' to prevent conflicts with CSS scroll-behavior: smooth.

## Workflow Rules
* Branching: Base all feature branches on `main`. Use `feat/` or `fix/` prefixes.
* Scope: Keep pull requests limited to a single logical change. Massive, multi-feature PRs will be rejected.
* Testing: Run local tests and formatting checks before pushing.
* Merging: All commits are squashed on merge.
```

---

## 🛠️ TiddlyWiki Build Integration
To ensure this file is distributed automatically to all required locations without duplication, use TiddlyWiki's native command-line rendering tool.

### 1. Update `tiddlywiki.info`
Add a dedicated `repo-configs` target to your project's `tiddlywiki.info` JSON file. This instructs TiddlyWiki to compile the master tiddler out to both human-facing and AI-facing configuration endpoints:

```json
{
    "description": "Project build targets",
    "plugins": [
        "tiddlywiki/markdown"
    ],
    "build": {
        "repo-configs": [
            "--rendertiddler", "ProjectContributionRules", "./CONTRIBUTING.md", "text/plain",
            "--rendertiddler", "ProjectContributionRules", "./.claudecode", "text/plain"
        ]
    }
}
```

### 2. Update `package.json`
Integrate the rendering command into your existing Node.js project lifecycle scripts so it triggers automatically during development builds or pre-commit checks:

```json
{
  "scripts": {
    "build:configs": "tiddlywiki --build repo-configs"
  }
}
```

---

## 🚀 Why This Works
* **Zero Duplication:** Edits are made exclusively within `ProjectContributionRules` inside the wiki workspace.
* **Human Visibility:** Browsing GitHub automatically surfaces `CONTRIBUTING.md` to human contributors.
* **Claude Code Ready:** When **Claude Code** sweeps the project root, it instantly reads the identical, strict engineering boundaries outputted to `.claudecode`.
