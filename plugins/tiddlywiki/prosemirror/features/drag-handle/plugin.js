/*\
title: $:/plugins/tiddlywiki/prosemirror/features/drag-handle/plugin.js
type: application/javascript
module-type: library

ProseMirror plugin that adds drag handles to block-level nodes for reordering.
Supports nested blocks (list items, blockquotes).
Clicking the handle opens a block action menu (type conversion, delete, etc.).

\*/

"use strict";

const Plugin = require("prosemirror-state").Plugin;
const NodeSelection = require("prosemirror-state").NodeSelection;
const DOMSerializer = require("prosemirror-model").DOMSerializer;

const helpers = require("$:/plugins/tiddlywiki/prosemirror/features/drag-handle/helpers.js");
const menu = require("$:/plugins/tiddlywiki/prosemirror/features/drag-handle/menu.js");

class DragHandleController {
	constructor() {
		this.handle = null;
		this.currentBlockPos = null;
		this.currentBlockNode = null;
		this.currentView = null;
		this.menuEl = null;
		this.menuVisible = false;
		this.destroyed = false;
		this.pendingTimers = [];
		this.dragWrapper = null;
		this.draggingBlock = null;
		this.isDraggingFromHandle = false;
		this.removeDocumentMousemove = null;
		this.removeDocumentDragEvents = null;

		this._suppressNextClick = false;
		this._touchStartX = 0;
		this._touchStartY = 0;
		this._touchMoved = false;
		this._longPressTimer = null;

		this.onDocumentMouseMove = this.onDocumentMouseMove.bind(this);
		this.onDocumentDragOver = this.onDocumentDragOver.bind(this);
		this.onDocumentDrop = this.onDocumentDrop.bind(this);
		this.closeOnOutsideClick = this.closeOnOutsideClick.bind(this);
	}

	safeTimeout(fn, delay) {
		const id = setTimeout(() => {
			const idx = this.pendingTimers.indexOf(id);
			if(idx >= 0) this.pendingTimers.splice(idx, 1);
			if(!this.destroyed) fn();
		}, delay);
		this.pendingTimers.push(id);
		return id;
	}

	isPointerNearHandle(event) {
		if(!this.handle || this.handle.style.display === "none" || !event) return false;
		const rect = this.handle.getBoundingClientRect();
		return event.clientX >= rect.left - helpers.HANDLE_POINTER_BRIDGE &&
			event.clientX <= rect.right + 8 &&
			event.clientY >= rect.top - 12 &&
			event.clientY <= rect.bottom + 12;
	}

	onDocumentMouseMove(event) {
		if(this.destroyed || this.menuVisible || !this.currentView) return;
		const info = helpers.findBlockAtCoords(this.currentView, { left: event.clientX, top: event.clientY });
		if(info) {
			this.showHandle(this.currentView, info);
			return;
		}
		// The handle itself or the pointer-bridge around it keeps the handle
		// visible while the user moves from a block to the handle.
		if(this.isPointerNearHandle(event)) return;
		if(this.handle && this.handle.matches(":hover")) return;
		if(this.menuEl && this.menuEl.matches(":hover")) return;
		this.hideHandle();
	}

	attachDocumentMousemove() {
		if(!this.removeDocumentMousemove) {
			document.addEventListener("mousemove", this.onDocumentMouseMove, true);
			this.removeDocumentMousemove = () => document.removeEventListener("mousemove", this.onDocumentMouseMove, true);
		}
		if(!this.removeDocumentDragEvents) {
			document.addEventListener("dragover", this.onDocumentDragOver, true);
			document.addEventListener("drop", this.onDocumentDrop, true);
			this.removeDocumentDragEvents = () => {
				document.removeEventListener("dragover", this.onDocumentDragOver, true);
				document.removeEventListener("drop", this.onDocumentDrop, true);
			};
		}
	}

	clearDragState() {
		if(this.dragWrapper && this.dragWrapper.parentNode) {
			this.dragWrapper.parentNode.removeChild(this.dragWrapper);
		}
		this.dragWrapper = null;
		this.draggingBlock = null;
		this.isDraggingFromHandle = false;
		if($tw.dragInProgress === this.handle) {
			$tw.dragInProgress = null;
		}
		if(this.currentView) {
			this.currentView.dragging = null;
		}
	}

	onDocumentDragOver(event) {
		if(!this.isDraggingFromHandle || !this.currentView) return;
		if(!helpers.isCoordsInEditorHandleZone(this.currentView, { left: event.clientX, top: event.clientY })) return;
		event.preventDefault();
		if(event.dataTransfer) {
			event.dataTransfer.dropEffect = "move";
		}
	}

	onDocumentDrop(event) {
		if(!this.isDraggingFromHandle || !this.currentView) return;
		if(this.performDrop(this.currentView, event)) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	createHandle() {
		const el = document.createElement("div");
		el.className = "tc-prosemirror-drag-handle";
		el.setAttribute("draggable", "true");
		el.setAttribute("contenteditable", "false");
		el.setAttribute("role", "button");
		el.setAttribute("tabindex", "0");
		el.setAttribute("aria-label", helpers.lang("AriaLabel", "Drag to reorder, click for options"));
		el.setAttribute("aria-haspopup", "true");
		el.setAttribute("aria-expanded", "false");
		el.textContent = "\u2982";
		el.style.display = "none";
		document.body.appendChild(el);

		el.addEventListener("click", (e) => {
			// Suppress menu open if this click was triggered by a touch (use long-press instead)
			if(this._suppressNextClick) {
				this._suppressNextClick = false;
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			if(this.menuVisible) {
				this.hideMenu();
			} else {
				this.showMenu();
			}
		});

		// Touch support: long-press to open menu, short tap does nothing (avoids blocking scroll)
		el.addEventListener("touchstart", (e) => {
			this._suppressNextClick = true;
			const touch = e.touches[0];
			this._touchStartX = touch.clientX;
			this._touchStartY = touch.clientY;
			this._touchMoved = false;
			this._longPressTimer = this.safeTimeout(() => {
				if(!this._touchMoved) {
					if(this.menuVisible) {
						this.hideMenu();
					} else {
						this.showMenu();
					}
				}
				this._suppressNextClick = false;
			}, 500);
		}, { passive: true });

		el.addEventListener("touchmove", (e) => {
			if(e.touches.length > 0) {
				const dx = Math.abs(e.touches[0].clientX - this._touchStartX);
				const dy = Math.abs(e.touches[0].clientY - this._touchStartY);
				if(dx > 8 || dy > 8) {
					this._touchMoved = true;
					if(this._longPressTimer) {
						clearTimeout(this._longPressTimer);
						this._longPressTimer = null;
					}
				}
			}
		}, { passive: true });

		el.addEventListener("touchend", () => {
			if(this._longPressTimer) {
				clearTimeout(this._longPressTimer);
				this._longPressTimer = null;
			}
			// Keep _suppressNextClick = true so the synthesised click is ignored;
			// reset after the synthetic-click delay (~300 ms)
			this.safeTimeout(() => { this._suppressNextClick = false; }, 400);
		}, { passive: true });

		el.addEventListener("keydown", (e) => {
			if(e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				if(this.menuVisible) {
					this.hideMenu();
				} else {
					this.showMenu();
				}
			} else if(e.key === "Escape" && this.menuVisible) {
				e.preventDefault();
				this.hideMenu();
			}
		});

		el.addEventListener("mousedown", () => {
			if(this.currentView && this.currentBlockPos !== null) {
				try {
					const sel = NodeSelection.create(this.currentView.state.doc, this.currentBlockPos);
					this.currentView.dispatch(this.currentView.state.tr.setSelection(sel));
				} catch(ex) {
					// ignore invalid positions
				}
			}
		});

		el.addEventListener("dragstart", (e) => {
			if(!this.currentView || this.currentBlockPos === null) {
				e.preventDefault();
				return;
			}
			this.hideMenu();
			try {
				const sel = NodeSelection.create(this.currentView.state.doc, this.currentBlockPos);
				this.currentView.dispatch(this.currentView.state.tr.setSelection(sel));
				const slice = sel.content();
				const serializer = DOMSerializer.fromSchema(this.currentView.state.schema);
				const dragDom = serializer.serializeFragment(slice.content);
				this.dragWrapper = document.createElement("div");
				this.dragWrapper.appendChild(dragDom);
				this.dragWrapper.style.position = "absolute";
				this.dragWrapper.style.left = "-9999px";
				document.body.appendChild(this.dragWrapper);
				if(e.dataTransfer) {
					e.dataTransfer.setData("text/html", this.dragWrapper.innerHTML);
					e.dataTransfer.setData("text/plain", this.currentBlockNode ? this.currentBlockNode.textContent : "");
				}
				e.dataTransfer.setDragImage(this.dragWrapper, 0, 0);
				e.dataTransfer.effectAllowed = "move";
				this.currentView.dragging = { slice: slice, move: true };
				this.draggingBlock = { pos: this.currentBlockPos, node: this.currentBlockNode };
				this.isDraggingFromHandle = true;
				$tw.dragInProgress = el;
			} catch(ex) {
				// fallback: let PM handle naturally
			}
		});

		el.addEventListener("dragend", () => {
			// Clear ProseMirror's dragging state — the view.dragging flag causes the
			// editor to apply ProseMirror-hideselection (transparent text selection).
			// Because our handle lives outside the editor DOM, PM's own dragend
			// listener never fires, so we must reset it manually.
			this.clearDragState();
			if(this.currentView) {
				// Dispatch a no-op transaction so PM re-renders and removes the
				// ProseMirror-hideselection class.
				try {
					this.currentView.dispatch(this.currentView.state.tr);
				} catch(ex) {
					// ignore
				}
			}
		});

		el.addEventListener("mouseleave", (e) => {
			const related = e.relatedTarget;
			if(this.currentView && this.currentView.dom && this.currentView.dom.contains(related)) return;
			if(this.menuEl && this.menuEl.contains(related)) return;
			this.safeTimeout(() => {
				if(this.handle && this.handle.matches(":hover")) return;
				if(this.currentView && this.currentView.dom && this.currentView.dom.matches(":hover")) return;
				if(this.menuEl && this.menuEl.matches(":hover")) return;
				if(this.menuVisible) return;
				this.hideHandle();
			}, 150);
		});

		return el;
	}

	showHandle(view, info) {
		if(this.destroyed) return;
		if(!this.handle) this.handle = this.createHandle();
		this.currentView = view;
		this.currentBlockPos = info.pos;
		this.currentBlockNode = info.node;

		const box = info.dom.getBoundingClientRect();
		if(box.width === 0 && box.height === 0) {
			this.hideHandle();
			return;
		}

		const editorBox = view.dom.getBoundingClientRect();
		const rtl = helpers.isRTL();
		const handleWidth = this.handle.offsetWidth || 20;
		const handleGap = 6;
		const editorGutter = 8;
		if(rtl) {
			const desiredRight = box.right + handleGap + handleWidth;
			const maxRight = editorBox.right + handleWidth + editorGutter;
			const handleRight = Math.min(maxRight, desiredRight) + window.scrollX;
			this.handle.style.left = "";
			this.handle.style.right = (window.innerWidth - handleRight) + "px";
		} else {
			const desiredLeft = box.left - handleWidth - handleGap;
			const minLeft = editorBox.left - handleWidth - editorGutter;
			const handleLeft = Math.max(minLeft, desiredLeft) + window.scrollX;
			this.handle.style.right = "";
			this.handle.style.left = handleLeft + "px";
		}

		this.handle.style.display = "flex";
		this.handle.style.position = "absolute";
		this.handle.style.top = (box.top + window.scrollY) + "px";
		this.handle.style.zIndex = "100";
	}

	hideHandle() {
		if(this.menuVisible) return;
		if(this.handle) {
			this.handle.style.display = "none";
			this.handle.setAttribute("aria-expanded", "false");
		}
		this.currentBlockPos = null;
		this.currentBlockNode = null;
	}

	static createMenu() {
		const el = document.createElement("div");
		el.className = "tc-prosemirror-block-menu";
		el.setAttribute("role", "menu");
		el.style.display = "none";
		document.body.appendChild(el);
		el.addEventListener("mousedown", (e) => {
			e.preventDefault();
		});
		return el;
	}

	showMenu() {
		if(!this.currentView || this.currentBlockPos === null || !this.handle) return;
		if(!this.menuEl) this.menuEl = DragHandleController.createMenu();
		this.menuVisible = true;
		this.handle.setAttribute("aria-expanded", "true");

		while(this.menuEl.firstChild) this.menuEl.removeChild(this.menuEl.firstChild);

		const view = this.currentView;
		const schema = view.state.schema;
		const searchInput = document.createElement("input");
		searchInput.type = "text";
		searchInput.className = "tc-prosemirror-block-menu-search";
		searchInput.setAttribute("aria-label", helpers.lang("FilterAriaLabel", "Filter actions"));
		searchInput.placeholder = helpers.lang("FilterPlaceholder", "Filter actions...");
		this.menuEl.appendChild(searchInput);

		const itemsContainer = document.createElement("div");
		itemsContainer.className = "tc-prosemirror-block-menu-items";
		this.menuEl.appendChild(itemsContainer);

		const actions = menu.buildBlockActions({
			view: view,
			schema: schema,
			origPos: this.currentBlockPos,
			origNode: this.currentBlockNode,
			onAfterAction: () => {
				this.hideMenu();
				view.focus();
			}
		});
		menu.renderActions(itemsContainer, actions);

		searchInput.addEventListener("input", () => {
			const filter = searchInput.value.toLowerCase().trim();
			menu.filterActions(itemsContainer, filter);
		});

		searchInput.addEventListener("keydown", (e) => {
			if(e.key === "Escape") {
				e.preventDefault();
				this.hideMenu();
				view.focus();
			} else if(e.key === "Enter") {
				e.preventDefault();
				const focused = itemsContainer.querySelector(".tc-prosemirror-block-menu-item-focused:not(.tc-prosemirror-hidden)");
				if(focused) {
					focused.click();
				} else {
					const first = itemsContainer.querySelector(".tc-prosemirror-block-menu-item:not(.tc-prosemirror-hidden)");
					if(first) first.click();
				}
			} else if(e.key === "ArrowDown" || e.key === "ArrowUp") {
				e.preventDefault();
				menu.navigateMenuItems(itemsContainer, e.key === "ArrowDown" ? 1 : -1);
			}
		});

		const handleRect = this.handle.getBoundingClientRect();
		this.menuEl.style.display = "block";
		this.menuEl.style.position = "absolute";
		this.menuEl.style.zIndex = "101";

		const rtl = helpers.isRTL();
		if(rtl) {
			this.menuEl.style.left = "";
			this.menuEl.style.right = (window.innerWidth - handleRect.right + window.scrollX) + "px";
		} else {
			this.menuEl.style.right = "";
			this.menuEl.style.left = (handleRect.left + window.scrollX) + "px";
		}
		this.menuEl.style.top = (handleRect.bottom + 4 + window.scrollY) + "px";

		requestAnimationFrame(() => {
			if(!this.menuEl || this.destroyed) return;
			const menuRect = this.menuEl.getBoundingClientRect();
			if(menuRect.bottom > window.innerHeight) {
				this.menuEl.style.top = (handleRect.top - menuRect.height - 4 + window.scrollY) + "px";
			}
			if(!rtl && menuRect.right > window.innerWidth) {
				this.menuEl.style.left = Math.max(4, window.innerWidth - menuRect.width - 8 + window.scrollX) + "px";
			}
			if(rtl && menuRect.left < 0) {
				this.menuEl.style.right = Math.max(4, window.innerWidth - menuRect.width - 8) + "px";
			}
		});

		this.safeTimeout(() => { searchInput.focus(); }, 0);
		document.removeEventListener("mousedown", this.closeOnOutsideClick);
		this.safeTimeout(() => {
			document.addEventListener("mousedown", this.closeOnOutsideClick);
		}, 0);
	}

	closeOnOutsideClick(e) {
		if(this.menuEl && !this.menuEl.contains(e.target) && this.handle && !this.handle.contains(e.target)) {
			this.hideMenu();
		}
	}

	hideMenu() {
		this.menuVisible = false;
		if(this.menuEl) {
			this.menuEl.style.display = "none";
		}
		if(this.handle) {
			this.handle.setAttribute("aria-expanded", "false");
		}
		document.removeEventListener("mousedown", this.closeOnOutsideClick);
	}

	handleMouseMove(view, event) {
		if(this.menuVisible) return false;
		const info = helpers.findBlockAtCoords(view, { left: event.clientX, top: event.clientY });
		if(info) {
			this.showHandle(view, info);
		} else if((!this.handle || !this.handle.matches(":hover")) && !this.isPointerNearHandle(event)) {
			this.hideHandle();
		}
		return false;
	}

	handleMouseLeave(view, event) {
		const related = event.relatedTarget;
		if(this.handle && this.handle.contains(related)) return false;
		if(this.menuEl && this.menuEl.contains(related)) return false;
		this.safeTimeout(() => {
			if(this.handle && this.handle.matches(":hover")) return;
			if(this.menuEl && this.menuEl.matches(":hover")) return;
			if(this.isPointerNearHandle(event)) return;
			if(this.menuVisible) return;
			this.hideHandle();
		}, 150);
		return false;
	}

	handleScroll() {
		if(!this.menuVisible) this.hideHandle();
		return false;
	}

	performDrop(view, event) {
		if(!this.isDraggingFromHandle || !this.draggingBlock) return false;
		const source = helpers.resolveCurrentBlock(view, this.draggingBlock.pos, this.draggingBlock.node);
		if(!source) return false;
		const dropLogic = require("$:/plugins/tiddlywiki/prosemirror/features/drag-handle/drop-logic.js");
		const target = dropLogic.computeDropTarget(view, { left: event.clientX, top: event.clientY }, source.node);
		if(!target) return false;

		const tr = dropLogic.buildMoveTransaction(view, source, target);
		if(tr === null) {
			this.clearDragState();
			return true;
		}
		try {
			view.focus();
			view.dispatch(tr.setMeta("uiEvent", "drop").scrollIntoView());
			this.clearDragState();
			this.hideHandle();
			return true;
		} catch(ex) {
			return false;
		}
	}

	handleDrop(view, event, slice, move) {
		if(!move || !this.isDraggingFromHandle) return false;
		return this.performDrop(view, event, slice);
	}

	update(view) {
		this.currentView = view;
		if(this.menuVisible && this.currentBlockPos !== null && this.currentBlockNode !== null) {
			const resolved = helpers.resolveCurrentBlock(view, this.currentBlockPos, this.currentBlockNode);
			if(!resolved) {
				this.hideMenu();
			}
		}
	}

	destroy() {
		this.destroyed = true;
		this.hideMenu();
		for(let i = 0; i < this.pendingTimers.length; i++) {
			clearTimeout(this.pendingTimers[i]);
		}
		this.pendingTimers.length = 0;
		if(this.dragWrapper && this.dragWrapper.parentNode) {
			this.dragWrapper.parentNode.removeChild(this.dragWrapper);
		}
		this.dragWrapper = null;
		if(this.handle && this.handle.parentNode) {
			this.handle.parentNode.removeChild(this.handle);
		}
		if(this.menuEl && this.menuEl.parentNode) {
			this.menuEl.parentNode.removeChild(this.menuEl);
		}
		if(this.removeDocumentMousemove) {
			this.removeDocumentMousemove();
			this.removeDocumentMousemove = null;
		}
		if(this.removeDocumentDragEvents) {
			this.removeDocumentDragEvents();
			this.removeDocumentDragEvents = null;
		}
		this.clearDragState();
		this.handle = null;
		this.menuEl = null;
		this.currentBlockPos = null;
		this.currentBlockNode = null;
		this.currentView = null;
	}
}

function createDragHandlePlugin() {
	const controller = new DragHandleController();
	const plugin = new Plugin({
		props: {
			handleDOMEvents: {
				mousemove: (view, event) => controller.handleMouseMove(view, event),
				mouseleave: (view, event) => controller.handleMouseLeave(view, event),
				scroll: () => controller.handleScroll()
			},
			handleDrop: (view, event, slice, move) => controller.handleDrop(view, event, slice, move)
		},
		view: function(view) {
			controller.currentView = view;
			controller.attachDocumentMousemove();
			return {
				update: (view) => controller.update(view),
				destroy: () => controller.destroy()
			};
		}
	});
	return plugin;
}

exports.createDragHandlePlugin = createDragHandlePlugin;