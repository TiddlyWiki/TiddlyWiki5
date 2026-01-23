/*\
title: $:/plugins/tiddlywiki/prosemirror/widget-block/actions.js
type: application/javascript
module-type: library

Widget block UI actions (focus/edit) for ProseMirror

\*/

"use strict";

/**
 * Try to find the widget-block nodeview near a document position and enter edit mode.
 * Uses DOM proximity because widget-block is implemented as a paragraph nodeview.
 *
 * @param {import("prosemirror-view").EditorView} view
 * @param {number} pos
 * @returns {boolean}
 */
function tryEnterWidgetBlockEditModeAtPos(view, pos) {
	if(!view || typeof pos !== "number") {
		return false;
	}
	const clampedPos = Math.max(0, Math.min(pos, view.state.doc.content.size));

	let domAt;
	try {
		domAt = view.domAtPos(clampedPos);
	} catch(e) {
		return false;
	}

	let el = domAt && domAt.node;
	if(!el) {
		return false;
	}
	if(el.nodeType === Node.TEXT_NODE) {
		el = el.parentElement;
	}
	if(!el || !el.closest) {
		return false;
	}

	const container = el.closest(".pm-widget-block-nodeview");
	if(!container) {
		return false;
	}

	// Only enter edit mode for actual widget blocks (not normal paragraphs).
	if(!container.classList.contains("pm-widget-block-nodeview-widget")) {
		return false;
	}

	const editBtn = container.querySelector("button.pm-widget-block-nodeview-edit");
	if(!editBtn) {
		return false;
	}

	// If already editing, don't toggle.
	if(container.classList.contains("pm-widget-block-editing")) {
		const textarea = container.querySelector("textarea.pm-widget-block-nodeview-editor");
		if(textarea) {
			textarea.focus();
			textarea.select();
		}
		return true;
	}

	editBtn.click();
	return true;
}

/**
 * Schedule entering widget edit mode near the current selection.
 * Retries for a few frames because nodeviews/decorations update asynchronously.
 *
 * @param {import("prosemirror-view").EditorView} view
 * @param {{maxAttempts?: number}} [options]
 */
function scheduleEnterWidgetBlockEditModeNearSelection(view, options) {
	const maxAttempts = (options && options.maxAttempts) || 6;
	const expectedWidgetName = options && options.expectedWidgetName;
	let attemptsLeft = maxAttempts;

	const tryEnterByClosestWidgetName = () => {
		if(!expectedWidgetName || !view || !view.state) {
			return false;
		}
		let coords;
		try {
			coords = view.coordsAtPos(view.state.selection.to);
		} catch(e) {
			return false;
		}
		if(!coords) {
			return false;
		}
		const root = view.dom;
		if(!root || !root.querySelectorAll) {
			return false;
		}
		const blocks = Array.from(root.querySelectorAll(".pm-widget-block-nodeview.pm-widget-block-nodeview-widget"));
		if(!blocks.length) {
			return false;
		}
		const wantedPrefix = `Widget: ${expectedWidgetName}`;
		const candidates = blocks.filter(b => {
			const title = b.querySelector(".pm-widget-block-nodeview-title");
			return title && (title.textContent || "").indexOf(wantedPrefix) !== -1;
		});
		const pool = candidates.length ? candidates : blocks;
		let best = null;
		let bestScore = Infinity;
		for(const el of pool) {
			const r = el.getBoundingClientRect();
			const score = Math.abs(r.top - coords.top) + Math.abs(r.left - coords.left);
			if(score < bestScore) {
				bestScore = score;
				best = el;
			}
		}
		if(!best) {
			return false;
		}
		const editBtn = best.querySelector("button.pm-widget-block-nodeview-edit");
		if(!editBtn) {
			return false;
		}
		if(!best.classList.contains("pm-widget-block-editing")) {
			editBtn.click();
		}
		return true;
	};

	const tick = () => {
		if(!view || !view.state) {
			return;
		}
		const pos = view.state.selection.from;
		// Try at selection, then just before selection.
		if(
			tryEnterWidgetBlockEditModeAtPos(view, pos) ||
			tryEnterWidgetBlockEditModeAtPos(view, Math.max(0, pos - 1)) ||
			tryEnterByClosestWidgetName()
		) {
			return;
		}

		attemptsLeft--;
		if(attemptsLeft > 0) {
			requestAnimationFrame(tick);
		}
	};

	requestAnimationFrame(tick);
}

exports.tryEnterWidgetBlockEditModeAtPos = tryEnterWidgetBlockEditModeAtPos;
exports.scheduleEnterWidgetBlockEditModeNearSelection = scheduleEnterWidgetBlockEditModeNearSelection;
