/*\
title: $:/plugins/tiddlywiki/prosemirror/widget.js
type: application/javascript
module-type: library

\*/

"use strict";

const Widget = require("$:/core/modules/widgets/widget.js").widget;
const debounce = require("$:/core/modules/utils/debounce.js").debounce;
const wikiAstFromProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/from-prosemirror.js").from;
const wikiAstToProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/to-prosemirror.js").to;

const EditorState = require("prosemirror-state").EditorState;
const EditorView = require("prosemirror-view").EditorView;
const Schema = require("prosemirror-model").Schema;
const DOMParser = require("prosemirror-model").DOMParser;
const TextSelection = require("prosemirror-state").TextSelection;
const basicSchema = require("prosemirror-schema-basic").schema;
const createListPlugins = require("prosemirror-flat-list").createListPlugins;
const createListSpec = require("prosemirror-flat-list").createListSpec;
const listKeymap = require("prosemirror-flat-list").listKeymap;
const exampleSetup = require("$:/plugins/tiddlywiki/prosemirror/setup/setup.js").exampleSetup;
const keymap = require("prosemirror-keymap").keymap;
const inputRules = require("prosemirror-inputrules").inputRules;
const buildInputRules = require("$:/plugins/tiddlywiki/prosemirror/setup/inputrules.js").buildInputRules;
const placeholderPlugin = require("$:/plugins/tiddlywiki/prosemirror/setup/placeholder.js").placeholderPlugin;
const SlashMenuPlugin = require("$:/plugins/tiddlywiki/prosemirror/slash-menu.js").SlashMenuPlugin;
const SlashMenuUI = require("$:/plugins/tiddlywiki/prosemirror/slash-menu-ui.js").SlashMenuUI;
const getAllMenuElements = require("$:/plugins/tiddlywiki/prosemirror/menu-elements.js").getAllMenuElements;
const createWidgetBlockPlugin = require("$:/plugins/tiddlywiki/prosemirror/widget-block/plugin.js").createWidgetBlockPlugin;
const createWidgetBlockNodeViewPlugin = require("$:/plugins/tiddlywiki/prosemirror/widget-block/plugin.js").createWidgetBlockNodeViewPlugin;
const createImageBlockPlugin = require("$:/plugins/tiddlywiki/prosemirror/image-block/plugin.js").createImageBlockPlugin;
const createImageNodeViewPlugin = require("$:/plugins/tiddlywiki/prosemirror/image/plugin.js").createImageNodeViewPlugin;
const computeImageSrc = require("$:/plugins/tiddlywiki/prosemirror/image/utils.js").computeImageSrc;

const NodeSelection = require("prosemirror-state").NodeSelection;

const ProsemirrorWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	// indicate the change is triggered by the widget itself
	this.saveLock = false;
	this.imagePickerOpen = false;
	this.imagePickerInitialized = false;
};

/*
Inherit from the base widget class
*/
ProsemirrorWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ProsemirrorWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();

	const tiddler = this.getAttribute("tiddler");
	const initialText = this.wiki.getTiddlerText(tiddler, "");
	const initialWikiAst = $tw.wiki.parseText(null, initialText).tree;
	const doc = wikiAstToProseMirrorAst(initialWikiAst);

	const outerWrap = $tw.utils.domMaker("div", {
		class: "tc-prosemirror-wrapper"
	});

	const container = $tw.utils.domMaker("div", {
		class: "tc-prosemirror-container"
	});
	const mount = $tw.utils.domMaker("div", {
		class: "tc-prosemirror-mount"
	});
	container.appendChild(mount);
	outerWrap.appendChild(container);

	// Image picker panel (hidden by default; shown when an image is selected)
	const imagePickerWrap = $tw.utils.domMaker("div", {
		class: "tc-prosemirror-imagepicker"
	});
	imagePickerWrap.style.display = "none";
	const imagePickerHeader = $tw.utils.domMaker("div", {
		class: "tc-prosemirror-imagepicker-header"
	});
	const imagePickerTitle = $tw.utils.domMaker("div", {
		class: "tc-prosemirror-imagepicker-title",
		text: "Image"
	});
	const imagePickerClose = $tw.utils.domMaker("button", {
		class: "tc-prosemirror-imagepicker-close",
		text: "关闭"
	});
	imagePickerClose.setAttribute("type", "button");
	imagePickerClose.addEventListener("click", e => {
		e.preventDefault();
		e.stopPropagation();
		this.closeImagePicker();
	});
	imagePickerHeader.appendChild(imagePickerTitle);
	imagePickerHeader.appendChild(imagePickerClose);
	imagePickerWrap.appendChild(imagePickerHeader);
	const imagePickerBody = $tw.utils.domMaker("div", {
		class: "tc-prosemirror-imagepicker-body"
	});
	imagePickerWrap.appendChild(imagePickerBody);
	outerWrap.appendChild(imagePickerWrap);
	this.imagePickerWrap = imagePickerWrap;
	this.imagePickerTitle = imagePickerTitle;
	// Hide picker initially
	imagePickerWrap.style.display = "none";
	
	const baseNodes = basicSchema.spec.nodes.append({ list: createListSpec() });
	const baseImageSpec = basicSchema.spec.nodes.get("image");
	const nodes = baseNodes.update("image", Object.assign({}, baseImageSpec, {
		attrs: Object.assign({}, baseImageSpec && baseImageSpec.attrs, {
			width: { default: null },
			height: { default: null },
			twSource: { default: null },
			twKind: { default: "shortcut" },
			twTooltip: { default: null }
		}),
		toDOM: node => {
			const attrs = {
				src: node.attrs.src,
				alt: node.attrs.alt,
				title: node.attrs.title
			};
			if(node.attrs.width) {
				attrs.width = node.attrs.width;
			}
			if(node.attrs.height) {
				attrs.height = node.attrs.height;
			}
			if(node.attrs.twSource) {
				attrs["data-tw-source"] = node.attrs.twSource;
			}
			if(node.attrs.twKind) {
				attrs["data-tw-kind"] = node.attrs.twKind;
			}
			if(node.attrs.twTooltip) {
				attrs["data-tw-tooltip"] = node.attrs.twTooltip;
			}
			return ["img", attrs];
		},
		parseDOM: [{
			tag: "img[src]",
			getAttrs: dom => ({
				src: dom.getAttribute("src"),
				title: dom.getAttribute("title"),
				alt: dom.getAttribute("alt"),
				width: dom.getAttribute("width") || null,
				height: dom.getAttribute("height") || null,
				twSource: dom.getAttribute("data-tw-source") || null,
				twKind: dom.getAttribute("data-tw-kind") || "shortcut",
				twTooltip: dom.getAttribute("data-tw-tooltip") || null
			})
		}]
	}));

	const schema = new Schema({
		nodes: nodes,
		marks: basicSchema.spec.marks
	});
	
	const listKeymapPlugin = keymap(listKeymap);
	const listPlugins = createListPlugins({ schema: schema });

	const allMenuElements = getAllMenuElements(this.wiki, schema);

	this.view = new EditorView(mount, {
		state: EditorState.create({
			// doc: schema.node("doc", null, [schema.node("paragraph")]),
			doc: schema.nodeFromJSON(doc),
			plugins: [
				SlashMenuPlugin(allMenuElements, {
					triggerCodes: ["Slash", "Backslash"] // Support both / (、) and \ keys
				}),
				createImageBlockPlugin(),
				createImageNodeViewPlugin(this),
				listKeymapPlugin,
				buildInputRules(schema),
				placeholderPlugin({
					text: this.wiki.getTiddlerText("$:/config/prosemirror/placeholder", "Type / for commands")
				}),
				createWidgetBlockPlugin(),
				createWidgetBlockNodeViewPlugin(this)
			]
			.concat(listPlugins)
			.concat(exampleSetup({ schema: schema })),
		}),
		dispatchTransaction: transaction => {
			const newState = this.view.state.apply(transaction);
			this.view.updateState(newState);
			if(this.imagePickerOpen) {
				this.updateImagePickerFromSelection();
			}
			this.debouncedSaveEditorContent();
		}
	});
	
	// Mark events with twEditor and stop propagation so TiddlyWiki/document handlers
	// don't hijack shortcuts or show the import dialog. Attach to the editor DOM in
	// bubble phase so ProseMirror gets first dibs on handling the event.
	this.view.dom.addEventListener("paste", function(event) {
		event.twEditor = true;
		event.stopPropagation();
	});
	this.view.dom.addEventListener("keydown", function(event) {
		event.twEditor = true;
		event.stopPropagation();
	});
	container.setAttribute("data-tw-prosemirror-keycapture", "yes");

	// Add a centered "Add new line" button below the editor.
	// This helps when the last block is a widget nodeview that is not directly editable.
	const addLineWrap = $tw.utils.domMaker("div", {
		class: "tc-prosemirror-addline"
	});
	const addLineBtn = $tw.utils.domMaker("button", {
		class: "tc-prosemirror-addline-btn",
		text: "添加新行"
	});
	addLineBtn.setAttribute("type", "button");
	addLineBtn.setAttribute("contenteditable", "false");
	addLineBtn.addEventListener("mousedown", function(event) {
		event.preventDefault();
		event.stopPropagation();
	}, true);
	addLineBtn.addEventListener("click", () => {
		const view = this.view;
		if(!view) {
			return;
		}
		const state = view.state;
		const endPos = state.doc.content.size;
		const para = state.schema.nodes.paragraph && state.schema.nodes.paragraph.createAndFill();
		if(!para) {
			view.focus();
			return;
		}
		let tr = state.tr.insert(endPos, para);
		tr = tr.setSelection(TextSelection.atEnd(tr.doc));
		view.dispatch(tr.scrollIntoView());
		view.focus();
	});
	addLineWrap.appendChild(addLineBtn);
	
	// Initialize SlashMenu UI
	this.slashMenuUI = new SlashMenuUI(this.view, {
		clickable: true
	});

	// Listen for selection from the embedded image picker
	this.addEventListener("tm-prosemirror-image-picked", "handleProseMirrorImagePicked");
	this.addEventListener("tm-prosemirror-image-picked-nodeview", "handleProseMirrorImagePickedNodeView");
		
	parent.insertBefore(outerWrap,nextSibling);
	this.domNodes.push(outerWrap);

	// Render the built-in TiddlyWiki image picker into our panel
	try {
		const pickerWikitext = [
			"<$macrocall $name=\"image-picker\" actions=\"\"\"",
			"<$action-sendmessage $message=\"tm-prosemirror-image-picked\" imageTitle=<<imageTitle>>/>",
			"\"\"\"/>"
		].join("\n");
		const pickerTree = this.wiki.parseText("text/vnd.tiddlywiki", pickerWikitext).tree;
		const WidgetBase = require("$:/core/modules/widgets/widget.js").widget;
		this.imagePickerWidget = new WidgetBase({
			type: "element",
			tag: "div",
			children: pickerTree
		}, {
			wiki: this.wiki,
			parentWidget: this,
			document: this.document
		});
		this.imagePickerWidget.render(imagePickerBody, null);
		this.children.push(this.imagePickerWidget);
	} catch(e) {
		// ignore
	}
	
	// Ensure picker is hidden after widget renders (widget may modify styles)
	imagePickerWrap.style.display = "none";

	// Attach after mount so prosemirror-menu has wrapped the editor DOM.
	setTimeout(() => {
		try {
			if(!addLineWrap.isConnected) {
				const host = this.view && this.view.dom && this.view.dom.parentNode;
				(host || outerWrap).appendChild(addLineWrap);
			}

			// Sync list indentation with the active TiddlyWiki theme.
			// Rendered lists (ol/ul) typically use padding-left; our ProseMirror lists use a
			// margin-left on each list item, so we expose the theme value via CSS variable.
			const styleHost = (this.view && this.view.dom && this.view.dom.parentNode) || container || outerWrap;
			if(styleHost && !styleHost.__pmListIndentSet) {
				const hostBody = (styleHost.closest && styleHost.closest(".tc-tiddler-body")) || (outerWrap.closest && outerWrap.closest(".tc-tiddler-body")) || outerWrap.parentNode;
				if(hostBody && hostBody.appendChild) {
					const probeTextIndentPx = tagName => {
						const wrapper = document.createElement("div");
						wrapper.style.position = "absolute";
						wrapper.style.visibility = "hidden";
						wrapper.style.pointerEvents = "none";
						wrapper.style.left = "0";
						wrapper.style.top = "0";
						wrapper.style.margin = "0";
						wrapper.style.padding = "0";
						wrapper.style.border = "0";
						wrapper.style.width = "1000px";
						wrapper.style.overflow = "hidden";

						const p = document.createElement("p");
						p.textContent = "X";
						p.style.margin = "0";
						p.style.padding = "0";

						const list = document.createElement(tagName);
						list.style.margin = "0";
						const li = document.createElement("li");
						li.textContent = "X";
						list.appendChild(li);

						wrapper.appendChild(p);
						wrapper.appendChild(list);
						hostBody.appendChild(wrapper);

						const rangeLeft = textNode => {
							if(!textNode) return null;
							const r = document.createRange();
							r.setStart(textNode, 0);
							r.setEnd(textNode, 1);
							const rect = r.getClientRects()[0];
							return rect ? rect.left : null;
						};

						const pLeft = rangeLeft(p.firstChild);
						const liLeft = rangeLeft(li.firstChild);
						wrapper.remove();
						if(pLeft == null || liLeft == null) return 0;
						return liLeft - pLeft;
					};

					const olIndentPx = probeTextIndentPx("ol");
					const ulIndentPx = probeTextIndentPx("ul");
					const chosenIndentPx = Math.max(olIndentPx || 0, ulIndentPx || 0, 40);
					const chosenIndent = `${chosenIndentPx}px`;
					styleHost.style.setProperty("--pm-list-indent", chosenIndent);
					styleHost.__pmListIndentSet = true;

					// Sync vertical gap between distinct list blocks (e.g. bullet list then ordered list)
					if(!styleHost.__pmListBlockGapSet) {
						const probeListBlockGapPx = () => {
							const wrapper = document.createElement("div");
							wrapper.style.position = "absolute";
							wrapper.style.visibility = "hidden";
							wrapper.style.pointerEvents = "none";
							wrapper.style.left = "0";
							wrapper.style.top = "0";
							wrapper.style.margin = "0";
							wrapper.style.padding = "0";
							wrapper.style.border = "0";
							wrapper.style.width = "1000px";
							wrapper.style.overflow = "hidden";

							const ul = document.createElement("ul");
							ul.appendChild(document.createElement("li")).textContent = "X";
							const ol = document.createElement("ol");
							ol.appendChild(document.createElement("li")).textContent = "X";

							wrapper.appendChild(ul);
							wrapper.appendChild(ol);
							hostBody.appendChild(wrapper);

							const ulRect = ul.getBoundingClientRect();
							const olRect = ol.getBoundingClientRect();
							wrapper.remove();
							if(!ulRect || !olRect) return null;
							return Math.max(0, olRect.top - ulRect.bottom);
						};

						const gapPx = probeListBlockGapPx();
						const chosenGapPx = typeof gapPx === "number" && Number.isFinite(gapPx) ? gapPx : 15;
						styleHost.style.setProperty("--pm-list-block-gap", `${chosenGapPx}px`);
						styleHost.__pmListBlockGapSet = true;
					}
				}
			}
		} catch (e) {
			// ignore
		}
	}, 0);
};

ProsemirrorWidget.prototype.getSelectedImageInfo = function() {
	if(!this.view || !this.view.state) {
		return null;
	}
	const sel = this.view.state.selection;
	if(sel && sel instanceof NodeSelection && sel.node && sel.node.type && sel.node.type.name === "image") {
		return {
			pos: sel.from,
			node: sel.node
		};
	}
	return null;
};

ProsemirrorWidget.prototype.openImagePicker = function() {
	this.imagePickerOpen = true;
	this.updateImagePickerFromSelection();
};

ProsemirrorWidget.prototype.closeImagePicker = function() {
	this.imagePickerOpen = false;
	this.updateImagePickerFromSelection();
};

ProsemirrorWidget.prototype.updateImagePickerFromSelection = function() {
	if(!this.imagePickerWrap) {
		return;
	}
	const info = this.getSelectedImageInfo();
	if(!this.imagePickerOpen || !info) {
		this.imagePickerWrap.style.display = "none";
		this.imagePickerOpen = false;
		return;
	}
	this.imagePickerWrap.style.display = "block";
	const src = (info.node.attrs && info.node.attrs.twSource) || (info.node.attrs && info.node.attrs.src) || "";
	if(this.imagePickerTitle) {
		this.imagePickerTitle.textContent = "替换图片: " + src;
	}
};

ProsemirrorWidget.prototype.handleProseMirrorImagePicked = function(event) {
	const pickedTitle = event && event.paramObject && event.paramObject.imageTitle;
	if(!pickedTitle || !this.view) {
		return true;
	}
	const info = this.getSelectedImageInfo();
	if(!info) {
		return true;
	}
	const oldAttrs = info.node.attrs || {};
	const schema = this.view.state.schema;
	const imageType = schema.nodes.image;
	if(!imageType) {
		return true;
	}
	const newAttrs = Object.assign({}, oldAttrs, {
		twSource: pickedTitle,
		src: computeImageSrc(pickedTitle, this.wiki)
	});
	const newNode = imageType.create(newAttrs);
	let tr = this.view.state.tr.replaceWith(info.pos, info.pos + info.node.nodeSize, newNode);
	tr = tr.setSelection(NodeSelection.create(tr.doc, info.pos));
	this.view.dispatch(tr.scrollIntoView());
	this.view.focus();
	return false;
};

ProsemirrorWidget.prototype.handleProseMirrorImagePickedNodeView = function(event) {
	const nodeviewId = event.paramObject && event.paramObject.nodeviewId || event.paramObject && event.paramObject.nodeViewId;
	const pickedTitle = event.paramObject && event.paramObject.imageTitle;
	if(!nodeviewId || !pickedTitle || !this.view) {
		return true;
	}
	
	// Find the nodeview by ID using DOM
	const imageNodeViewEls = this.view.dom.querySelectorAll(".pm-image-nodeview");
	
	for(let el of imageNodeViewEls) {
		// Get the nodeView directly from the DOM element (stored in createDOM)
		const nodeview = el._imageNodeView;
		if(nodeview && typeof nodeview._getNodeViewId === "function" && nodeview._getNodeViewId() === nodeviewId) {
			if(typeof nodeview.handleImagePicked === "function") {
				nodeview.handleImagePicked(pickedTitle);
				return false;
			}
		}
	}
	
	return true;
};

ProsemirrorWidget.prototype.saveEditorContent = function() {
	const content = this.view.state.doc.toJSON();
	const wikiast = wikiAstFromProseMirrorAst(content);
	const wikiText = $tw.utils.serializeWikitextParseTree(wikiast);
	const tiddler = this.getAttribute("tiddler");
	const currentText = this.wiki.getTiddlerText(tiddler, "");
	if(currentText !== wikiText) {
		this.saveLock = true;
		this.wiki.setText(tiddler, "text", undefined, wikiText);
	}
}

// Debounced save function for performance
ProsemirrorWidget.prototype.debouncedSaveEditorContent = debounce(ProsemirrorWidget.prototype.saveEditorContent, 300);

/*
Compute the internal state of the widget
*/
ProsemirrorWidget.prototype.execute = function() {
	// Nothing to do for a text node
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ProsemirrorWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.text) {
		this.refreshSelf();
		return true;
	} else if(changedTiddlers[this.getAttribute("tiddler")]) {
		if(this.saveLock) {
			// Skip refresh if the change is triggered by the widget itself
			this.saveLock = false;
			return false;
		}
		// Not Re-render the widget, which will cause focus lost.
		// We manually update the editor content.
		this.refreshSelf();
		return true;
	}
	return false;
};

exports.prosemirror = ProsemirrorWidget;
