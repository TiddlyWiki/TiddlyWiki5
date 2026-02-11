# Release Notes Redesign Prompt (TiddlyWiki5)

You are editing the TiddlyWiki5 repo, focusing on the release notes presentation under `editions/tw5.com/tiddlers/releasenotes/`.

## Goals
- Present release notes with tabs:
  - **Summary**: collapsible sections for Highlights, Big Bug Fixes, Clearing the Decks (curated lists).
  - **Change Types**
  - **Change Categories**
  - **Impacts**
  - **Credits** (acknowledgements)
- Headings must be customisable via the releases info tiddler.
- Use TiddlyWiki idioms: state stored in tiddlers (not DOM).
- Keep procedures small (≈20 lines), with sensible identifiers.

## Current Implementation (after recent edits)
- `editions/tw5.com/tiddlers/releasenotes/ReleasesProcedures.tid`
  - Reworked into many small procedures.
  - Tabs use `$:/core/macros/tabs` and template `$:/tw5.com/releases/tab-template`.
  - Sections use `$reveal` + `$action-setfield` toggles; state stored in `$:/state/release/...`.
  - Summary pulls curated lists from `$:/tw5.com/releases/info/summary-lists` (fields named `<section>/<release>`).
  - Change Types/Categories/Impacts list change notes by filters; Credits tab shows acknowledgements.
- `editions/tw5.com/tiddlers/releasenotes/ReleasesTabTemplate.tid`
  - Uses `<$list match>` to choose the tab body: Summary, Change Types, Change Categories, Impacts, Credits.
- `editions/tw5.com/tiddlers/releasenotes/ReleasesInfo.multids`
  - Added tab order, summary sections & captions/order, change/impact orders.
- `editions/tw5.com/tiddlers/releasenotes/ReleasesStyles.tid`
  - Styles for tabs, section headers, toggle icons, impact cards.
- `editions/tw5.com/tiddlers/releasenotes/ReleasesSummaryLists.tid`
  - Example curated fields for 5.4.0 (Highlights, Big Bug Fixes, Clearing the Decks) using wiki-links.

## Outstanding Issue
- Summary tab still shows raw keys (e.g., “highlights”) and not the curated change lists. Captions/list lookup likely still failing; needs robust caption lookup and ensuring summary lists are read correctly (field names and filters).
- Other tabs (types/categories/impacts) expand/collapse correctly.

## Open Files in IDE (for context)
- ReleasesProcedures.tid
- ReleasesStyles.tid
- Release Notes and Changes Internals.tid
- Release 5.3.8.tid
- Release 5.4.0.tid

## Reminder
- Avoid adding fields to change notes; curation is via list fields on `$:/tw5.com/releases/info/summary-lists`.
- Keep using tiddler-store state; no DOM state.
