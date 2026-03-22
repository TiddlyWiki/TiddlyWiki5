/*\
title: $:/plugins/tiddlywiki/prosemirror/image/nodeview.js
type: application/javascript
module-type: library

Image node view for ProseMirror

\*/

"use strict";

const BaseSourceEditableNodeView = require("$:/plugins/tiddlywiki/prosemirror/base-source-editable-nodeview.js").BaseSourceEditableNodeView;

class ImageNodeView extends BaseSourceEditableNodeView {
	constructor(node, view, getPos, parentWidget) {
		super(node, view, getPos, parentWidget);
		
		this.img = null;
		this.imagePickerWrap = null;
		this._nodeViewId = null;
		
		this.createDOM();
	}

	createDOM() {
		const wrap = document.createElement("span");
		wrap.className = "pm-image-nodeview";
		wrap.draggable = false;

		// Create header with title and buttons
		const header = this.createHeader(this.node.attrs.twSource || this.getLanguageString("ImagePicker/Title", "Image"));

		// Create content container to hold image, textarea, and picker
		const contentContainer = document.createElement("div");
		contentContainer.className = "pm-image-nodeview-content";

		const img = document.createElement("img");
		img.className = "pm-image-nodeview-img";
		img.draggable = false;
		img.setAttribute("src", this.node.attrs.src || "");
		if(this.node.attrs.alt) {
			img.setAttribute("alt", this.node.attrs.alt);
		}
		if(this.node.attrs.title) {
			img.setAttribute("title", this.node.attrs.title);
		}
		if(this.node.attrs.width) {
			img.setAttribute("width", this.node.attrs.width);
		}
		if(this.node.attrs.height) {
			img.setAttribute("height", this.node.attrs.height);
		}
		if(this.node.attrs.twSource) {
			img.setAttribute("data-tw-source", this.node.attrs.twSource);
		}
		if(this.node.attrs.twKind) {
			img.setAttribute("data-tw-kind", this.node.attrs.twKind);
		}

		contentContainer.appendChild(img);
		
		// Add resize handle for WYSIWYG resizing
		const resizeHandle = document.createElement("div");
		resizeHandle.className = "pm-image-resize-handle";
		resizeHandle.draggable = false;
		resizeHandle.contentEditable = false;
		contentContainer.appendChild(resizeHandle);
		
		wrap.appendChild(header);
		wrap.appendChild(contentContainer);

		this.dom = wrap;
		this.img = img;
		this.contentContainer = contentContainer;
		this.resizeHandle = resizeHandle;
		
		// Store reference to this nodeView on the DOM element for message handling
		wrap._imageNodeView = this;
		
		// Setup resize handler
		this.setupResizeHandler();
	}

	updateTitle() {
		if(this._titleEl) {
			this._titleEl.textContent = this.node.attrs.twSource || this.getLanguageString("ImagePicker/Title", "Image");
		}
		if(this.img) {
			this.img.setAttribute("src", this.node.attrs.src || "");
			if(this.node.attrs.alt) {
				this.img.setAttribute("alt", this.node.attrs.alt);
			} else {
				this.img.removeAttribute("alt");
			}
			if(this.node.attrs.title) {
				this.img.setAttribute("title", this.node.attrs.title);
			} else {
				this.img.removeAttribute("title");
			}
			if(this.node.attrs.width) {
				this.img.setAttribute("width", this.node.attrs.width);
			} else {
				this.img.removeAttribute("width");
			}
			if(this.node.attrs.height) {
				this.img.setAttribute("height", this.node.attrs.height);
			} else {
				this.img.removeAttribute("height");
			}
			if(this.node.attrs.twSource) {
				this.img.setAttribute("data-tw-source", this.node.attrs.twSource);
			} else {
				this.img.removeAttribute("data-tw-source");
			}
			if(this.node.attrs.twKind) {
				this.img.setAttribute("data-tw-kind", this.node.attrs.twKind);
			} else {
				this.img.removeAttribute("data-tw-kind");
			}
		}
	}

	renderEditMode() {
		if(!this.contentContainer) return;
		
		// Clear content (hide image during edit, like widget-block does)
		while(this.contentContainer.firstChild) { this.contentContainer.removeChild(this.contentContainer.firstChild); }
		
		// Create textarea for editing image wikitext
		const twSource = this.node.attrs.twSource || "";
		const twKind = this.node.attrs.twKind || "shortcut";
		
		let initialValue;
		if(twKind === "widget") {
			let attrs = `source="${twSource}"`;
			if(this.node.attrs.width) attrs += ` width="${this.node.attrs.width}"`;
			if(this.node.attrs.height) attrs += ` height="${this.node.attrs.height}"`;
			if(this.node.attrs.twTooltip) attrs += ` tooltip="${this.node.attrs.twTooltip}"`;
			initialValue = `<$image ${attrs}/>`;
		} else {
			// Build shortcut syntax manually with quoted width/height
			let attrs = "";
			if(this.node.attrs.width) attrs += `width="${this.node.attrs.width}" `;
			if(this.node.attrs.height) attrs += `height="${this.node.attrs.height}" `;
			const attrsStr = attrs.trim();
			const tooltip = this.node.attrs.twTooltip || "";
			if(tooltip) {
				initialValue = `[img${attrsStr ? " " + attrsStr : ""}[${tooltip}|${twSource}]]`;
			} else {
				initialValue = `[img${attrsStr ? " " + attrsStr + " " : ""}[${twSource}]]`;
			}
		}
		
		const textarea = this.createEditTextarea(initialValue, 2);
		this.contentContainer.appendChild(textarea);
		this.editTextarea = textarea;  // Save reference for handleImagePicked
		
		// Render image picker below textarea
		this.renderImagePicker();
		
		// Focus textarea
		setTimeout(() => textarea.focus(), 0);
	}

	renderViewMode() {
		if(!this.contentContainer) return;
		
		// Clear content
		while(this.contentContainer.firstChild) { this.contentContainer.removeChild(this.contentContainer.firstChild); }
		
		// Add image and resize handle back
		this.contentContainer.appendChild(this.img);
		if(this.resizeHandle) {
			this.contentContainer.appendChild(this.resizeHandle);
		}
		
		// Remove image picker
		if(this.imagePickerWrap && this.imagePickerWrap.parentNode) {
			this.imagePickerWrap.parentNode.removeChild(this.imagePickerWrap);
		}
		this.imagePickerWrap = null;
		this.editTextarea = null;
	}

	renderImagePicker() {
		// Create container for image picker
		const pickerWrap = document.createElement("div");
		pickerWrap.className = "pm-image-picker-wrap pm-image-nodeview-picker";
		
		const pickerBody = document.createElement("div");
		pickerBody.className = "pm-image-picker-body";
		pickerWrap.appendChild(pickerBody);
		
		this.contentContainer.appendChild(pickerWrap);
		this.imagePickerWrap = pickerWrap;

		// Render TW image picker widget using the built-in image-picker macro
		if(this.parentWidget) {
			const nodeViewId = this.getNodeViewId();
			// Sanitise nodeViewId for safe embedding in single-quoted TW attribute.
			// The id is alphanumeric by construction, but defence-in-depth matters.
			const safeId = nodeViewId.replace(/[^a-zA-Z0-9_-]/g, "");
			const pickerWikitext = `<<image-picker actions:"<$action-sendmessage $message='tm-prosemirror-image-picked-nodeview' nodeViewId='${safeId}' imageTitle=<<imageTitle>>/>">>`;
			
			const pickerTree = this.parentWidget.wiki.parseText("text/vnd.tiddlywiki", pickerWikitext).tree;
			const WidgetBase = require("$:/core/modules/widgets/widget.js").widget;
			this.imagePickerWidget = new WidgetBase({
				type: "widget",
				children: pickerTree
			}, {
				parentWidget: this.parentWidget,
				document: document,
				wiki: this.parentWidget.wiki
			});
			this.imagePickerWidget.render(pickerBody, null);
		}
	}

	getNodeViewId() {
		if(!this._nodeViewId) {
			this._nodeViewId = "img-nv-" + Math.random().toString(36).substr(2, 9);
		}
		return this._nodeViewId;
	}

	// Alias for compatibility with widget.js handler
	_getNodeViewId() {
		return this.getNodeViewId();
	}

	saveEdit(newText) {
		const pos = this.getPos();
		if(typeof pos !== "number") {
			// Exit edit mode on error
			if(this.isEditMode) {
				this.toggleEditMode();
			}
			return;
		}
		
		// Parse the wikitext to get full attributes
		if(!this.parentWidget || !this.parentWidget.wiki) {
			if(this.isEditMode) {
				this.toggleEditMode();
			}
			return;
		}
		
		const wiki = this.parentWidget.wiki;
		const parseTree = wiki.parseText("text/vnd.tiddlywiki", newText);
		
		// Look for image node in parse tree
		let imageNode = null;
		
		function findImageNode(node) {
			if(!node) return null;
			
			// Check if this is an image shortcut syntax
			if(node.type === "image") {
				return node;
			}
			
			// Check if this is a $image widget (element type with tag="$image")
			if(node.type === "element" && node.tag === "$image") {
				return node;
			}
			
			// Recursively search children
			if(node.children && node.children.length > 0) {
				for(let child of node.children) {
					const found = findImageNode(child);
					if(found) return found;
				}
			}
			
			return null;
		}
		
		if(parseTree && parseTree.tree && parseTree.tree.length > 0) {
			for(let node of parseTree.tree) {
				imageNode = findImageNode(node);
				if(imageNode) break;
			}
		}
		
		if(imageNode) {
			// Use getImageAttrsFromWikiAstImageNode to extract all attributes
			const getImageAttrsFromWikiAstImageNode = require("$:/plugins/tiddlywiki/prosemirror/image/utils.js").getImageAttrsFromWikiAstImageNode;
			const attrs = getImageAttrsFromWikiAstImageNode(imageNode, wiki);
			
			// Update node with all attributes
			const tr = this.view.state.tr.setNodeMarkup(pos, null, attrs);
			this.view.dispatch(tr);
			
			// Exit edit mode after successful save
			if(this.isEditMode) {
				this.toggleEditMode();
			}
		} else {
			// Invalid format, just close
			if(this.isEditMode) {
				this.toggleEditMode();
			}
		}
	}

	handleImagePicked(imageName) {
		if(!this.editTextarea) return;
		
		const twKind = this.node.attrs.twKind || "shortcut";
		let newValue;
		if(twKind === "widget") {
			let attrs = `source="${imageName}"`;
			if(this.node.attrs.width) attrs += ` width="${this.node.attrs.width}"`;
			if(this.node.attrs.height) attrs += ` height="${this.node.attrs.height}"`;
			if(this.node.attrs.twTooltip) attrs += ` tooltip="${this.node.attrs.twTooltip}"`;
			newValue = `<$image ${attrs}/>`;
		} else {
			// Build shortcut syntax manually with quoted width/height, preserving attributes
			let attrs = "";
			if(this.node.attrs.width) attrs += `width="${this.node.attrs.width}" `;
			if(this.node.attrs.height) attrs += `height="${this.node.attrs.height}" `;
			const attrsStr = attrs.trim();
			const tooltip = this.node.attrs.twTooltip || "";
			if(tooltip) {
				newValue = `[img${attrsStr ? " " + attrsStr : ""}[${tooltip}|${imageName}]]`;
			} else {
				newValue = `[img${attrsStr ? " " + attrsStr + " " : ""}[${imageName}]]`;
			}
		}
		
		// Update textarea
		this.editTextarea.value = newValue;
		
		// Auto-save and exit edit mode
		this.saveEdit(newValue);
	}

	// Override class names
	// eslint-disable-next-line class-methods-use-this
	getHeaderClass() {
		return "pm-image-nodeview-header";
	}

	// eslint-disable-next-line class-methods-use-this
	getTitleClass() {
		return "pm-image-nodeview-title";
	}

	// eslint-disable-next-line class-methods-use-this
	getButtonsClass() {
		return "pm-image-nodeview-buttons";
	}

	// eslint-disable-next-line class-methods-use-this
	getDeleteButtonClass() {
		return "pm-image-nodeview-btn pm-image-nodeview-delete";
	}

	// eslint-disable-next-line class-methods-use-this
	getEditButtonClass() {
		return "pm-image-nodeview-btn pm-image-nodeview-edit";
	}

	// eslint-disable-next-line class-methods-use-this
	getSaveButtonClass() {
		return "pm-image-nodeview-btn pm-image-nodeview-save";
	}

	// eslint-disable-next-line class-methods-use-this
	getCancelButtonClass() {
		return "pm-image-nodeview-btn pm-image-nodeview-cancel";
	}

	// eslint-disable-next-line class-methods-use-this
	getEditorClass() {
		return "pm-image-nodeview-editor";
	}

	setupResizeHandler() {
		if(!this.resizeHandle || !this.img) return;
		
		let startX, startY, startWidth, startHeight;
		const self = this;

		// Store listener references for cleanup in destroy()
		function onPointerMove(e) {
			doResize(e.clientX, e.clientY);
		}

		function onTouchMove(e) {
			e.preventDefault(); // Prevent scroll during resize
			const touch = e.touches[0];
			doResize(touch.clientX, touch.clientY);
		}

		function onPointerUp() {
			document.removeEventListener("mousemove", onPointerMove);
			document.removeEventListener("mouseup", onPointerUp);
			self._activeResizeListeners = null;
			commitResize();
		}

		function onTouchEnd() {
			document.removeEventListener("touchmove", onTouchMove);
			document.removeEventListener("touchend", onTouchEnd);
			self._activeResizeListeners = null;
			commitResize();
		}

		// Save references so destroy() can clean up mid-drag
		this._resizeCleanup = { onPointerMove, onPointerUp, onTouchMove, onTouchEnd };
		
		this.resizeHandle.addEventListener("mousedown", function(e) {
			e.preventDefault();
			e.stopPropagation();
			startResize(e.clientX, e.clientY);
			self._activeResizeListeners = { mouse: true };
			document.addEventListener("mousemove", onPointerMove);
			document.addEventListener("mouseup", onPointerUp);
		});

		// Touch support for mobile devices
		this.resizeHandle.addEventListener("touchstart", function(e) {
			e.preventDefault();
			e.stopPropagation();
			const touch = e.touches[0];
			startResize(touch.clientX, touch.clientY);
			self._activeResizeListeners = { touch: true };
			document.addEventListener("touchmove", onTouchMove, { passive: false });
			document.addEventListener("touchend", onTouchEnd);
		});

		function startResize(x, y) {
			startX = x;
			startY = y;
			startWidth = parseInt(self.img.getAttribute("width") || self.img.offsetWidth);
			startHeight = parseInt(self.img.getAttribute("height") || self.img.offsetHeight);
		}

		function doResize(x, y) {
			const dx = x - startX;
			const dy = y - startY;
			const newWidth = Math.max(50, startWidth + dx);
			const newHeight = Math.max(30, startHeight + dy);
			self.img.style.width = newWidth + "px";
			self.img.style.height = newHeight + "px";
		}

		function commitResize() {
			const finalWidth = Math.round(self.img.offsetWidth);
			const finalHeight = Math.round(self.img.offsetHeight);
			self.img.style.width = "";
			self.img.style.height = "";
			const tr = self.view.state.tr;
			const pos = self.getPos();
			if(pos !== undefined) {
				tr.setNodeMarkup(pos, null, Object.assign({}, self.node.attrs, {
					width: String(finalWidth),
					height: String(finalHeight)
				}));
				self.view.dispatch(tr);
			}
		}
	}

	destroy() {
		// Destroy imagePickerWidget if it exists
		if(this.imagePickerWidget) {
			try { this.imagePickerWidget.destroy(); } catch(e) { /* ignore */ }
			this.imagePickerWidget = null;
		}
		// Clean up any active resize document listeners (handles mid-drag destroy)
		if(this._activeResizeListeners && this._resizeCleanup) {
			var rc = this._resizeCleanup;
			document.removeEventListener("mousemove", rc.onPointerMove);
			document.removeEventListener("mouseup", rc.onPointerUp);
			document.removeEventListener("touchmove", rc.onTouchMove);
			document.removeEventListener("touchend", rc.onTouchEnd);
			this._activeResizeListeners = null;
		}
		this._resizeCleanup = null;
		super.destroy();
	}
}

exports.ImageNodeView = ImageNodeView;

