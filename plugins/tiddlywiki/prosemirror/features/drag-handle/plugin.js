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
		this.removeDocumentMousemove = null;

		this.onDocumentMouseMove = this.onDocumentMouseMove.bind(this);
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
			e.preventDefault();
			e.stopPropagation();
			if(this.menuVisible) {
				this.hideMenu();
			} else {
				this.showMenu();
			}
		});

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
				const slice = this.currentView.state.selection.content();
				const serializer = DOMSerializer.fromSchema(this.currentView.state.schema);
				const dragDom = serializer.serializeFragment(slice.content);
				this.dragWrapper = document.createElement("div");
				this.dragWrapper.appendChild(dragDom);
				this.dragWrapper.style.position = "absolute";
				this.dragWrapper.style.left = "-9999px";
				document.body.appendChild(this.dragWrapper);
				e.dataTransfer.setDragImage(this.dragWrapper, 0, 0);
				e.dataTransfer.effectAllowed = "move";
				this.currentView.dragging = { slice: slice, move: true };
				$tw.dragInProgress = el;
			} catch(ex) {
				// fallback: let PM handle naturally
			}
		});

		el.addEventListener("dragend", () => {
			if(this.dragWrapper && this.dragWrapper.parentNode) {
				this.dragWrapper.parentNode.removeChild(this.dragWrapper);
			}
			this.dragWrapper = null;
			if($tw.dragInProgress === el) {
				$tw.dragInProgress = null;
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
		if(rtl) {
			const handleRight = Math.max(editorBox.right - 18, box.right + 18) + window.scrollX;
			this.handle.style.left = "";
			this.handle.style.right = (window.innerWidth - handleRight) + "px";
		} else {
			const handleLeft = Math.max(editorBox.left - 10, box.left - 18) + window.scrollX;
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
		this.handle = null;
		this.menuEl = null;
		this.currentBlockPos = null;
		this.currentBlockNode = null;
		this.currentView = null;
	}
}

function createDragHandlePlugin() {
	const controller = new DragHandleController();
	return new Plugin({
		props: {
			handleDOMEvents: {
				mousemove: (view, event) => controller.handleMouseMove(view, event),
				mouseleave: (view, event) => controller.handleMouseLeave(view, event),
				scroll: () => controller.handleScroll()
			}
		},
		view: function() {
			controller.attachDocumentMousemove();
			return {
				update: (view) => controller.update(view),
				destroy: () => controller.destroy()
			};
		}
	});
}

exports.createDragHandlePlugin = createDragHandlePlugin;