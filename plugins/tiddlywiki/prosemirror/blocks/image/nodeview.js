/*\
title: $:/plugins/tiddlywiki/prosemirror/blocks/image/nodeview.js
type: application/javascript
module-type: library

Image node view for ProseMirror

\*/

"use strict";

const BaseSourceEditableNodeView = require("$:/plugins/tiddlywiki/prosemirror/blocks/base-source-editable.js").BaseSourceEditableNodeView;

class ImageNodeView extends BaseSourceEditableNodeView {
	constructor(node, view, getPos, parentWidget) {
		super(node, view, getPos, parentWidget);

		this.img = null;
		this.resizeHandle = null;
		this.imagePickerWidget = null;
		this._nodeViewId = null;

		this._createDOM();
	}

	_createDOM() {
		const wrap = document.createElement("span");
		wrap.className = "pm-nodeview pm-nodeview-image";
		wrap.draggable = false;

		const header = this.createHeader(this.node.attrs.twSource || this.constructor.getLanguageString("ImagePicker/Title", "Image"));
		const contentContainer = document.createElement("div");
		contentContainer.className = "pm-nodeview-content pm-image-nodeview-content";

		const img = document.createElement("img");
		img.className = "pm-image-nodeview-img";
		img.draggable = false;
		this.constructor._applyImgAttrs(img, this.node.attrs);

		contentContainer.appendChild(img);

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
		wrap._imageNodeView = this;

		this._setupResizeHandler();
	}

	static _applyImgAttrs(img, attrs) {
		img.setAttribute("src", attrs.src || "");
		const optionals = ["alt", "title", "width", "height"];
		for(let i = 0; i < optionals.length; i++) {
			if(attrs[optionals[i]]) img.setAttribute(optionals[i], attrs[optionals[i]]);
			else img.removeAttribute(optionals[i]);
		}
		if(attrs.twSource) img.setAttribute("data-tw-source", attrs.twSource);
		if(attrs.twKind) img.setAttribute("data-tw-kind", attrs.twKind);
	}

	updateTitle() {
		if(this._titleEl) {
			this._titleEl.textContent = this.node.attrs.twSource || this.constructor.getLanguageString("ImagePicker/Title", "Image");
		}
		if(this.img) this.constructor._applyImgAttrs(this.img, this.node.attrs);
	}

	renderEditMode() {
		if(!this.contentContainer) return;
		while(this.contentContainer.firstChild) this.contentContainer.removeChild(this.contentContainer.firstChild);

		const form = this.createEditForm([
			{ key: "twSource", label: "Source", value: this.node.attrs.twSource || "", placeholder: "Image tiddler title or URL" },
			{ key: "width", label: "Width", value: this.node.attrs.width || "", placeholder: "e.g. 200" },
			{ key: "height", label: "Height", value: this.node.attrs.height || "", placeholder: "e.g. 150" },
			{ key: "twTooltip", label: "Tooltip", value: this.node.attrs.twTooltip || "", placeholder: "Hover text" },
			{ key: "alt", label: "Alt", value: this.node.attrs.alt || "", placeholder: "Alt text" }
		]);
		this.contentContainer.appendChild(form);

		// Render image picker below form
		this._renderImagePicker();

		const firstInput = form.querySelector(".pm-nodeview-form-input");
		if(firstInput) setTimeout(() => { firstInput.focus(); }, 0);
	}

	renderViewMode() {
		if(!this.contentContainer) return;
		while(this.contentContainer.firstChild) this.contentContainer.removeChild(this.contentContainer.firstChild);

		this.contentContainer.appendChild(this.img);
		if(this.resizeHandle) this.contentContainer.appendChild(this.resizeHandle);

		// Remove image picker
		if(this.imagePickerWidget) {
			try { this.imagePickerWidget.destroy(); } catch(e) { /* ignore */ }
			this.imagePickerWidget = null;
		}
	}

	getEditValue() {
		if(!this.contentContainer) return {};
		const form = this.contentContainer.querySelector(".pm-nodeview-form");
		if(!form) return {};
		const inputs = form.querySelectorAll(".pm-nodeview-form-input");
		const result = {};
		for(let i = 0; i < inputs.length; i++) {
			result[inputs[i].dataset.key] = inputs[i].value;
		}
		return result;
	}

	saveEdit(formValues) {
		if(!formValues || typeof formValues !== "object") return;
		const pos = this.getPos();
		if(typeof pos !== "number") return;

		const source = formValues.twSource || "";
		if(!source) return;

		// Resolve image src via TW
		let src = source;
		const wiki = this.parentWidget ? this.parentWidget.wiki : $tw.wiki;
		const tiddler = wiki.getTiddler(source);
		if(tiddler) {
			const type = tiddler.fields.type || "";
			if(type.indexOf("image/") === 0) {
				if(tiddler.fields._canonical_uri) {
					src = tiddler.fields._canonical_uri;
				} else if(tiddler.fields.text) {
					src = "data:" + type + ";base64," + tiddler.fields.text;
				}
			}
		}

		const newAttrs = {
			src: src,
			twSource: source,
			twKind: this.node.attrs.twKind || "shortcut",
			width: formValues.width || null,
			height: formValues.height || null,
			twTooltip: formValues.twTooltip || null,
			alt: formValues.alt || null,
			title: formValues.twTooltip || null
		};

		const tr = this.view.state.tr.setNodeMarkup(pos, null, newAttrs);
		this.view.dispatch(tr);
	}

	handleImagePicked(imageName) {
		// Update the source field if form is visible
		if(this.contentContainer) {
			const sourceInput = this.contentContainer.querySelector('.pm-nodeview-form-input[data-key="twSource"]');
			if(sourceInput) {
				sourceInput.value = imageName;
				// Auto-commit and exit edit mode after picker selection
				this.commitEdit();
				return;
			}
		}
		// Otherwise directly save
		this.saveEdit({ twSource: imageName, width: this.node.attrs.width, height: this.node.attrs.height, twTooltip: this.node.attrs.twTooltip, alt: this.node.attrs.alt });
	}

	getNodeViewId() {
		if(!this._nodeViewId) {
			this._nodeViewId = "img-nv-" + Math.random().toString(36).substr(2, 9);
		}
		return this._nodeViewId;
	}

	_getNodeViewId() {
		return this.getNodeViewId();
	}

	_renderImagePicker() {
		const pickerWrap = document.createElement("div");
		pickerWrap.className = "pm-image-picker-wrap pm-image-nodeview-picker";

		const pickerBody = document.createElement("div");
		pickerBody.className = "pm-image-picker-body";
		pickerWrap.appendChild(pickerBody);

		this.contentContainer.appendChild(pickerWrap);

		if(this.parentWidget) {
			const nodeViewId = this.getNodeViewId();
			const safeId = nodeViewId.replace(/[^a-zA-Z0-9_-]/g, "");
			const pickerWikitext = '<<image-picker actions:"<$action-sendmessage $message=\'tm-prosemirror-image-picked-nodeview\' nodeViewId=\'' + safeId + '\' imageTitle=<<imageTitle>>/>">>'; 

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

	_setupResizeHandler() {
		
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
		
		this.resizeHandle.addEventListener("mousedown", (e) => {
			e.preventDefault();
			e.stopPropagation();
			startResize(e.clientX, e.clientY);
			self._activeResizeListeners = { mouse: true };
			document.addEventListener("mousemove", onPointerMove);
			document.addEventListener("mouseup", onPointerUp);
		});

		// Touch support for mobile devices
		this.resizeHandle.addEventListener("touchstart", (e) => {
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
			const rc = this._resizeCleanup;
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

