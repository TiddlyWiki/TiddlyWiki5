/*\
title: $:/plugins/tiddlywiki/prosemirror/drag-handle.js
type: application/javascript
module-type: library

ProseMirror plugin that adds drag handles to block-level nodes for reordering.

\*/

"use strict";

var Plugin = require("prosemirror-state").Plugin;
var NodeSelection = require("prosemirror-state").NodeSelection;

/**
 * Block drag handle plugin.
 * Renders a drag handle (⠿ grip icon) when hovering over block-level nodes.
 * Dragging the handle initiates a ProseMirror node drag for block reordering.
 */
function createDragHandlePlugin() {
	var handle = null;
	var currentBlockPos = null;
	var currentView = null;

	function createHandle() {
		var el = document.createElement("div");
		el.className = "tc-prosemirror-drag-handle";
		el.setAttribute("draggable", "true");
		el.setAttribute("contenteditable", "false");
		el.setAttribute("role", "button");
		el.setAttribute("aria-label", "Drag to reorder");
		el.textContent = "⠿";
		el.style.display = "none";
		document.body.appendChild(el);

		// Prevent mousedown from stealing editor focus
		el.addEventListener("mousedown", function(e) {
			e.preventDefault();
			if(currentView && currentBlockPos !== null) {
				// Select the block node so PM's native drag works
				try {
					var $pos = currentView.state.doc.resolve(currentBlockPos);
					var sel = NodeSelection.create(currentView.state.doc, currentBlockPos);
					currentView.dispatch(currentView.state.tr.setSelection(sel));
				} catch(ex) {
					// ignore invalid positions
				}
			}
		});

		el.addEventListener("dragstart", function(e) {
			if(!currentView || currentBlockPos === null) {
				e.preventDefault();
				return;
			}
			// Use ProseMirror's built-in drag handling by triggering it through NodeSelection
			try {
				var slice = currentView.state.selection.content();
				var { dom, text } = currentView.domSerializer 
					? currentView.domSerializer.serializeSlice(slice)
					: { dom: null, text: "" };
				if(dom) {
					e.dataTransfer.setDragImage(dom, 0, 0);
				}
				e.dataTransfer.effectAllowed = "move";
				// ProseMirror will handle the actual node movement via its
				// built-in drop handler when a NodeSelection is active
				currentView.dragging = { slice: slice, move: true };
			} catch(ex) {
				// Fallback: let PM handle naturally
			}
		});

		return el;
	}

	function showHandle(view, pos, node, dom) {
		if(!handle) handle = createHandle();
		currentView = view;
		currentBlockPos = pos;

		// Position the handle to the left of the block node
		var box = dom.getBoundingClientRect();
		handle.style.display = "flex";
		handle.style.position = "absolute";
		handle.style.left = (box.left - 24 + window.scrollX) + "px";
		handle.style.top = (box.top + window.scrollY) + "px";
		handle.style.zIndex = "100";
	}

	function hideHandle() {
		if(handle) {
			handle.style.display = "none";
		}
		currentBlockPos = null;
	}

	return new Plugin({
		props: {
			handleDOMEvents: {
				mouseover: function(view, event) {
					var target = event.target;
					// Walk up to find a direct child of the doc (top-level block)
					var pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
					if(!pos) {
						hideHandle();
						return false;
					}
					try {
						var $pos = view.state.doc.resolve(pos.inside >= 0 ? pos.inside : pos.pos);
						// Find the top-level block (depth 1 under doc)
						if($pos.depth >= 1) {
							var blockPos = $pos.before(1);
							var blockNode = view.state.doc.nodeAt(blockPos);
							if(blockNode && blockNode.isBlock) {
								var dom = view.nodeDOM(blockPos);
								if(dom && dom.nodeType === 1) {
									showHandle(view, blockPos, blockNode, dom);
									return false;
								}
							}
						}
					} catch(ex) {
						// ignore
					}
					hideHandle();
					return false;
				},
				mouseleave: function(view, event) {
					// Only hide if not hovering the handle itself
					var related = event.relatedTarget;
					if(handle && handle.contains(related)) return false;
					hideHandle();
					return false;
				}
			}
		},
		view: function() {
			return {
				destroy: function() {
					if(handle && handle.parentNode) {
						handle.parentNode.removeChild(handle);
					}
					handle = null;
					currentBlockPos = null;
					currentView = null;
				}
			};
		}
	});
}

exports.createDragHandlePlugin = createDragHandlePlugin;
