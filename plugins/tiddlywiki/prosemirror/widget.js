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

const ProsemirrorWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	// indicate the change is triggered by the widget itself
	this.saveLock = false;
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
	
	const schema = new Schema({
		nodes: basicSchema.spec.nodes.append({ list: createListSpec() }),
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
		
	parent.insertBefore(outerWrap,nextSibling);
	this.domNodes.push(outerWrap);

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
