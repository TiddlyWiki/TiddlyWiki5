/*\
title: $:/plugins/tiddlywiki/prosemirror/drag-handle.js
type: application/javascript
module-type: library

ProseMirror plugin that adds drag handles to block-level nodes for reordering.
Supports nested blocks (list items, blockquotes).
Clicking the handle opens a block action menu (type conversion, delete, etc.).

\*/

"use strict";

var Plugin = require("prosemirror-state").Plugin;
var NodeSelection = require("prosemirror-state").NodeSelection;
var DOMSerializer = require("prosemirror-model").DOMSerializer;
var pmCommands = require("prosemirror-commands");
var flatListCommands = require("prosemirror-flat-list");

// Language helper — reads from TW language tiddlers with fallback
function lang(suffix, fallback) {
return $tw.wiki.getTiddlerText(
"$:/plugins/tiddlywiki/prosemirror/language/DragHandle/" + suffix, fallback);
}

/**
 * Get SVG icon from a TW image tiddler.
 * Uses TW's rendering pipeline so wikitext macros (<<size>> etc.) are resolved.
 * Returns a sanitized SVG DOM element or null.
 */
function getSvgIcon(tiddlerTitle, size) {
size = size || "1em";
try {
	var htmlStr = $tw.wiki.renderTiddler("text/html", tiddlerTitle, {
		variables: { size: size }
	});
	if(!htmlStr) return null;
	var container = document.createElement("div");
	container.innerHTML = htmlStr;
	var svgEl = container.querySelector("svg");
	if(svgEl) return svgEl;
} catch(e) { /* ignore */ }
return null;
}

/**
 * Detect RTL document direction.
 */
function isRTL() {
var dir = document.documentElement.getAttribute("dir");
return dir === "rtl";
}

/**
 * Find the nearest draggable/selectable block node under the cursor.
 * Walks outward from the resolved position to find a block we can operate on.
 * Returns { pos, node, dom, depth } or null.
 */
function findBlockAtCoords(view, coords) {
var posInfo = view.posAtCoords(coords);
if(!posInfo) return null;

try {
// Always resolve using posInfo.pos (the text-level position).
// posInfo.inside can land on node boundaries (depth 0) which breaks depth walking.
var $pos = view.state.doc.resolve(posInfo.pos);

// Walk from deepest to shallowest to find the tightest enclosing block
for(var depth = $pos.depth; depth >= 1; depth--) {
var node = $pos.node(depth);
var pos = $pos.before(depth);

// Skip inline and non-selectable nodes
if(!node.isBlock) continue;

// If this is a list node (prosemirror-flat-list), it's directly draggable
if(node.type.name === "list") {
var dom = view.nodeDOM(pos);
if(dom && dom.nodeType === 1) {
return { pos: pos, node: node, dom: dom, depth: depth };
}
}

// For other block types at depth 1 (direct children of doc), always draggable
if(depth === 1) {
var dom1 = view.nodeDOM(pos);
if(dom1 && dom1.nodeType === 1) {
return { pos: pos, node: node, dom: dom1, depth: depth };
}
}

// For atom/draggable blocks at any depth, allow dragging
if(node.type.spec.atom || node.type.spec.draggable) {
var domA = view.nodeDOM(pos);
if(domA && domA.nodeType === 1) {
return { pos: pos, node: node, dom: domA, depth: depth };
}
}
}

// Fallback: depth-1 parent
if($pos.depth >= 1) {
var blockPos = $pos.before(1);
var blockNode = view.state.doc.nodeAt(blockPos);
if(blockNode && blockNode.isBlock) {
var domF = view.nodeDOM(blockPos);
if(domF && domF.nodeType === 1) {
return { pos: blockPos, node: blockNode, dom: domF, depth: 1 };
}
}
}
} catch(ex) {
// ignore resolution errors
}
return null;
}

/**
 * Re-resolve a block node's position in the current document.
 * When the document changes between opening the menu and executing an action,
 * the original pos/node captured at menu-open time may be stale. This function
 * attempts to find the node at the original position and validates it is still
 * the same type. Returns { pos, node } or null.
 */
function resolveCurrentBlock(view, origPos, origNode) {
try {
var doc = view.state.doc;
if(origPos < 0 || origPos >= doc.content.size) return null;
var node = doc.nodeAt(origPos);
if(node && node.type === origNode.type) {
return { pos: origPos, node: node };
}
} catch(e) {
// ignore
}
return null;
}

/**
 * Block drag handle + action menu plugin.
 */
function createDragHandlePlugin() {
var handle = null;
var currentBlockPos = null;
var currentBlockNode = null;
var currentView = null;
var menuEl = null;
var menuVisible = false;
var destroyed = false;
var pendingTimers = [];
var dragWrapper = null;

function safeTimeout(fn, delay) {
var id = setTimeout(function() {
var idx = pendingTimers.indexOf(id);
if(idx >= 0) pendingTimers.splice(idx, 1);
if(!destroyed) fn();
}, delay);
pendingTimers.push(id);
return id;
}

function createHandle() {
var el = document.createElement("div");
el.className = "tc-prosemirror-drag-handle";
el.setAttribute("draggable", "true");
el.setAttribute("contenteditable", "false");
el.setAttribute("role", "button");
el.setAttribute("tabindex", "0");
el.setAttribute("aria-label", lang("AriaLabel", "Drag to reorder, click for options"));
el.setAttribute("aria-haspopup", "true");
el.setAttribute("aria-expanded", "false");
el.textContent = "\u2982";
el.style.display = "none";
document.body.appendChild(el);

el.addEventListener("click", function(e) {
e.preventDefault();
e.stopPropagation();
if(menuVisible) {
hideMenu();
} else {
showMenu();
}
});

el.addEventListener("keydown", function(e) {
if(e.key === "Enter" || e.key === " ") {
e.preventDefault();
if(menuVisible) { hideMenu(); } else { showMenu(); }
} else if(e.key === "Escape" && menuVisible) {
e.preventDefault();
hideMenu();
}
});

el.addEventListener("mousedown", function(e) {
e.preventDefault();
if(currentView && currentBlockPos !== null) {
try {
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
hideMenu();
try {
var slice = currentView.state.selection.content();
var serializer = DOMSerializer.fromSchema(currentView.state.schema);
var fragment = slice.content;
var dragDom = serializer.serializeFragment(fragment);
dragWrapper = document.createElement("div");
dragWrapper.appendChild(dragDom);
dragWrapper.style.position = "absolute";
dragWrapper.style.left = "-9999px";
document.body.appendChild(dragWrapper);
e.dataTransfer.setDragImage(dragWrapper, 0, 0);
e.dataTransfer.effectAllowed = "move";
currentView.dragging = { slice: slice, move: true };
} catch(ex) {
// Fallback: let PM handle naturally
}
});

el.addEventListener("dragend", function() {
if(dragWrapper && dragWrapper.parentNode) {
dragWrapper.parentNode.removeChild(dragWrapper);
}
dragWrapper = null;
});

el.addEventListener("mouseleave", function(e) {
var related = e.relatedTarget;
if(currentView && currentView.dom && currentView.dom.contains(related)) return;
if(menuEl && menuEl.contains(related)) return;
hideHandle();
});

return el;
}

function showHandle(view, info) {
if(destroyed) return;
if(!handle) handle = createHandle();
currentView = view;
currentBlockPos = info.pos;
currentBlockNode = info.node;

var box = info.dom.getBoundingClientRect();
if(box.width === 0 && box.height === 0) {
hideHandle();
return;
}

// Position the handle inside the editor's left padding area,
// aligned with the top of the block node.
var editorBox = view.dom.getBoundingClientRect();
var rtl = isRTL();

if(rtl) {
// For RTL, position inside the editor's right padding area
var handleRight = editorBox.right - 24 + window.scrollX;
handle.style.left = "";
handle.style.right = (window.innerWidth - handleRight) + "px";
} else {
// Position at the left edge of the editor content area
var handleLeft = editorBox.left + 2 + window.scrollX;
handle.style.right = "";
handle.style.left = handleLeft + "px";
}

handle.style.display = "flex";
handle.style.position = "absolute";
handle.style.top = (box.top + window.scrollY) + "px";
handle.style.zIndex = "100";
}

function hideHandle() {
if(menuVisible) return;
if(handle) {
handle.style.display = "none";
handle.setAttribute("aria-expanded", "false");
}
currentBlockPos = null;
currentBlockNode = null;
}

function createMenu() {
var el = document.createElement("div");
el.className = "tc-prosemirror-block-menu";
el.setAttribute("role", "menu");
el.style.display = "none";
document.body.appendChild(el);

el.addEventListener("mousedown", function(e) {
e.preventDefault();
});

return el;
}

function showMenu() {
if(!currentView || currentBlockPos === null) return;
if(!handle) return;
if(!menuEl) menuEl = createMenu();
menuVisible = true;
handle.setAttribute("aria-expanded", "true");

while(menuEl.firstChild) menuEl.removeChild(menuEl.firstChild);

var view = currentView;
var schema = view.state.schema;
var origPos = currentBlockPos;
var origNode = currentBlockNode;

var searchInput = document.createElement("input");
searchInput.type = "text";
searchInput.className = "tc-prosemirror-block-menu-search";
searchInput.setAttribute("aria-label", lang("FilterAriaLabel", "Filter actions"));
searchInput.placeholder = lang("FilterPlaceholder", "Filter actions...");
menuEl.appendChild(searchInput);

var itemsContainer = document.createElement("div");
itemsContainer.className = "tc-prosemirror-block-menu-items";
menuEl.appendChild(itemsContainer);

var actions = getBlockActions(view, schema, origPos, origNode);
renderActions(itemsContainer, actions);

searchInput.addEventListener("input", function() {
var filter = searchInput.value.toLowerCase().trim();
filterActions(itemsContainer, filter);
});

searchInput.addEventListener("keydown", function(e) {
if(e.key === "Escape") {
e.preventDefault();
hideMenu();
view.focus();
} else if(e.key === "Enter") {
e.preventDefault();
var focused = itemsContainer.querySelector(".tc-prosemirror-block-menu-item-focused:not(.tc-prosemirror-hidden)");
if(focused) {
focused.click();
} else {
var first = itemsContainer.querySelector(".tc-prosemirror-block-menu-item:not(.tc-prosemirror-hidden)");
if(first) first.click();
}
} else if(e.key === "ArrowDown" || e.key === "ArrowUp") {
e.preventDefault();
navigateMenuItems(itemsContainer, e.key === "ArrowDown" ? 1 : -1);
}
});

var handleRect = handle.getBoundingClientRect();
menuEl.style.display = "block";
menuEl.style.position = "absolute";
menuEl.style.zIndex = "101";

var rtl = isRTL();
if(rtl) {
menuEl.style.left = "";
menuEl.style.right = (window.innerWidth - handleRect.right + window.scrollX) + "px";
} else {
menuEl.style.right = "";
menuEl.style.left = (handleRect.left + window.scrollX) + "px";
}
menuEl.style.top = (handleRect.bottom + 4 + window.scrollY) + "px";

requestAnimationFrame(function() {
if(!menuEl || destroyed) return;
var menuRect = menuEl.getBoundingClientRect();
if(menuRect.bottom > window.innerHeight) {
menuEl.style.top = (handleRect.top - menuRect.height - 4 + window.scrollY) + "px";
}
if(!rtl && menuRect.right > window.innerWidth) {
menuEl.style.left = Math.max(4, window.innerWidth - menuRect.width - 8 + window.scrollX) + "px";
}
if(rtl && menuRect.left < 0) {
menuEl.style.right = Math.max(4, window.innerWidth - menuRect.width - 8) + "px";
}
});

safeTimeout(function() { searchInput.focus(); }, 0);

document.removeEventListener("mousedown", closeOnOutsideClick);
safeTimeout(function() {
document.addEventListener("mousedown", closeOnOutsideClick);
}, 0);
}

function closeOnOutsideClick(e) {
if(menuEl && !menuEl.contains(e.target) && handle && !handle.contains(e.target)) {
hideMenu();
}
}

function hideMenu() {
menuVisible = false;
if(menuEl) {
menuEl.style.display = "none";
}
if(handle) {
handle.setAttribute("aria-expanded", "false");
}
document.removeEventListener("mousedown", closeOnOutsideClick);
}

function navigateMenuItems(container, direction) {
var items = container.querySelectorAll(".tc-prosemirror-block-menu-item:not(.tc-prosemirror-hidden)");
if(items.length === 0) return;
var focusedIdx = -1;
for(var i = 0; i < items.length; i++) {
if(items[i].classList.contains("tc-prosemirror-block-menu-item-focused")) {
focusedIdx = i;
items[i].classList.remove("tc-prosemirror-block-menu-item-focused");
break;
}
}
var nextIdx = focusedIdx + direction;
if(nextIdx < 0) nextIdx = items.length - 1;
if(nextIdx >= items.length) nextIdx = 0;
items[nextIdx].classList.add("tc-prosemirror-block-menu-item-focused");
items[nextIdx].scrollIntoView({ block: "nearest" });
}

function getBlockActions(view, schema, origPos, origNode) {
var actions = [];

function safeAction(fn) {
return function() {
var resolved = resolveCurrentBlock(view, origPos, origNode);
if(!resolved) {
hideMenu();
view.focus();
return;
}
try {
fn(resolved.pos, resolved.node);
} catch(ex) {
// Command failed
}
hideMenu();
view.focus();
};
}

actions.push({ type: "group", label: lang("TurnInto", "Turn into") });

if(schema.nodes.paragraph && origNode.type !== schema.nodes.paragraph) {
actions.push({
label: lang("Paragraph", "Paragraph"),
icon: "¶",
action: safeAction(function() {
pmCommands.setBlockType(schema.nodes.paragraph)(view.state, view.dispatch);
})
});
}

for(var level = 1; level <= 6; level++) {
(function(lvl) {
if(schema.nodes.heading && !(origNode.type === schema.nodes.heading && origNode.attrs.level === lvl)) {
actions.push({
label: lang("Heading", "Heading") + " " + lvl,
icon: "H" + lvl,
action: safeAction(function() {
pmCommands.setBlockType(schema.nodes.heading, { level: lvl })(view.state, view.dispatch);
})
});
}
})(level);
}

if(schema.nodes.code_block && origNode.type !== schema.nodes.code_block) {
actions.push({
label: lang("CodeBlock", "Code block"),
icon: "</>",
action: safeAction(function() {
pmCommands.setBlockType(schema.nodes.code_block)(view.state, view.dispatch);
})
});
}

if(schema.nodes.blockquote) {
actions.push({
label: lang("Blockquote", "Blockquote"),
icon: "\u00AB",
iconTiddler: "$:/core/images/quote",
action: safeAction(function() {
var $from = view.state.selection.$from;
for(var d = $from.depth; d > 0; d--) {
if($from.node(d).type === schema.nodes.blockquote) {
pmCommands.lift(view.state, view.dispatch);
return;
}
}
pmCommands.wrapIn(schema.nodes.blockquote)(view.state, view.dispatch);
})
});
}

if(origNode.type.name === "list") {
actions.push({ type: "group", label: lang("List", "List") });

if(origNode.attrs.kind !== "bullet") {
actions.push({
label: lang("BulletList", "Bullet list"),
icon: "•",
action: safeAction(function(pos, node) {
var tr = view.state.tr.setNodeMarkup(pos, null, Object.assign({}, node.attrs, { kind: "bullet" }));
view.dispatch(tr);
})
});
}

if(origNode.attrs.kind !== "ordered") {
actions.push({
label: lang("NumberedList", "Numbered list"),
icon: "1.",
action: safeAction(function(pos, node) {
var tr = view.state.tr.setNodeMarkup(pos, null, Object.assign({}, node.attrs, { kind: "ordered" }));
view.dispatch(tr);
})
});
}

if(origNode.attrs.kind !== "task") {
actions.push({
label: lang("TaskList", "Task list"),
icon: "\u2610",
iconTiddler: "$:/core/images/done-button",
action: safeAction(function(pos, node) {
var tr = view.state.tr.setNodeMarkup(pos, null, Object.assign({}, node.attrs, { kind: "task", checked: false }));
view.dispatch(tr);
})
});
}

if(flatListCommands.indentListCommand) {
actions.push({
label: lang("Indent", "Indent"),
icon: "→",
action: safeAction(function() {
flatListCommands.indentListCommand(view.state, view.dispatch);
})
});
}
if(flatListCommands.dedentListCommand) {
actions.push({
label: lang("Dedent", "Dedent"),
icon: "←",
action: safeAction(function() {
flatListCommands.dedentListCommand(view.state, view.dispatch);
})
});
}
}

actions.push({ type: "group", label: lang("Actions", "Actions") });

actions.push({
label: lang("Duplicate", "Duplicate"),
icon: "+",
iconTiddler: "$:/core/images/clone-button",
action: safeAction(function(pos, node) {
var tr = view.state.tr;
var insertPos = pos + node.nodeSize;
tr.insert(insertPos, node.type.create(node.attrs, node.content, node.marks));
view.dispatch(tr);
})
});

actions.push({
label: lang("Delete", "Delete"),
icon: "\u00D7",
iconTiddler: "$:/core/images/delete-button",
action: safeAction(function(pos, node) {
var tr = view.state.tr.delete(pos, pos + node.nodeSize);
view.dispatch(tr);
})
});

return actions;
}

function renderActions(container, actions) {
while(container.firstChild) container.removeChild(container.firstChild);

for(var i = 0; i < actions.length; i++) {
var act = actions[i];
if(act.type === "group") {
var groupEl = document.createElement("div");
groupEl.className = "tc-prosemirror-block-menu-group";
groupEl.textContent = act.label;
groupEl.setAttribute("data-group", "true");
container.appendChild(groupEl);
} else {
var item = document.createElement("div");
item.className = "tc-prosemirror-block-menu-item";
item.setAttribute("role", "menuitem");
item.setAttribute("data-label", act.label.toLowerCase());

var iconSpan = document.createElement("span");
iconSpan.className = "tc-prosemirror-block-menu-item-icon";
if(act.iconTiddler) {
var svgEl = getSvgIcon(act.iconTiddler, "1em");
if(svgEl) {
	iconSpan.appendChild(document.importNode(svgEl, true));
} else {
	iconSpan.textContent = act.icon || "\u2022";
}
} else {
iconSpan.textContent = act.icon || "\u2022";
}
item.appendChild(iconSpan);

var labelSpan = document.createElement("span");
labelSpan.className = "tc-prosemirror-block-menu-item-label";
labelSpan.textContent = act.label;
item.appendChild(labelSpan);

(function(actionFn) {
item.addEventListener("click", function(e) {
e.preventDefault();
e.stopPropagation();
actionFn();
});
})(act.action);

item.addEventListener("mouseenter", function() {
var siblings = container.querySelectorAll(".tc-prosemirror-block-menu-item-focused");
for(var s = 0; s < siblings.length; s++) {
siblings[s].classList.remove("tc-prosemirror-block-menu-item-focused");
}
this.classList.add("tc-prosemirror-block-menu-item-focused");
});

container.appendChild(item);
}
}
}

function filterActions(container, filter) {
var items = container.querySelectorAll(".tc-prosemirror-block-menu-item");
var groups = container.querySelectorAll("[data-group]");

for(var i = 0; i < items.length; i++) {
var label = items[i].getAttribute("data-label") || "";
if(!filter || label.indexOf(filter) >= 0) {
items[i].classList.remove("tc-prosemirror-hidden");
} else {
items[i].classList.add("tc-prosemirror-hidden");
}
}

for(var g = 0; g < groups.length; g++) {
var groupEl = groups[g];
var hasVisibleChild = false;
var next = groupEl.nextElementSibling;
while(next && !next.hasAttribute("data-group")) {
if(!next.classList.contains("tc-prosemirror-hidden")) {
hasVisibleChild = true;
break;
}
next = next.nextElementSibling;
}
if(hasVisibleChild || !filter) {
groupEl.classList.remove("tc-prosemirror-hidden");
} else {
groupEl.classList.add("tc-prosemirror-hidden");
}
}
}

return new Plugin({
props: {
handleDOMEvents: {
mousemove: function(view, event) {
if(menuVisible) return false;
var info = findBlockAtCoords(view, { left: event.clientX, top: event.clientY });
if(info) {
showHandle(view, info);
} else {
hideHandle();
}
return false;
},
mouseleave: function(view, event) {
var related = event.relatedTarget;
if(handle && handle.contains(related)) return false;
if(menuEl && menuEl.contains(related)) return false;
hideHandle();
return false;
},
scroll: function() {
if(!menuVisible) hideHandle();
return false;
}
}
},
view: function() {
return {
update: function(view) {
if(menuVisible && currentBlockPos !== null && currentBlockNode !== null) {
var resolved = resolveCurrentBlock(view, currentBlockPos, currentBlockNode);
if(!resolved) {
hideMenu();
}
}
},
destroy: function() {
destroyed = true;
hideMenu();
for(var i = 0; i < pendingTimers.length; i++) {
clearTimeout(pendingTimers[i]);
}
pendingTimers = [];
if(dragWrapper && dragWrapper.parentNode) {
dragWrapper.parentNode.removeChild(dragWrapper);
}
dragWrapper = null;
if(handle && handle.parentNode) {
handle.parentNode.removeChild(handle);
}
if(menuEl && menuEl.parentNode) {
menuEl.parentNode.removeChild(menuEl);
}
handle = null;
menuEl = null;
currentBlockPos = null;
currentBlockNode = null;
currentView = null;
}
};
}
});
}

exports.createDragHandlePlugin = createDragHandlePlugin;
