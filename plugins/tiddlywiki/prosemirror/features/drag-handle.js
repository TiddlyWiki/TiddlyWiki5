/*\
title: $:/plugins/tiddlywiki/prosemirror/features/drag-handle.js
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
const pmCommands = require("prosemirror-commands");
const flatListCommands = require("prosemirror-flat-list");

// Language helper — reads from TW language tiddlers with fallback
function lang(suffix, fallback) {
return $tw.wiki.getTiddlerText(
"$:/plugins/tiddlywiki/prosemirror/language/DragHandle/" + suffix, fallback);
}

function getSvgIcon(tiddlerTitle, size) {
size = size || "1em";
try {
	const htmlStr = $tw.wiki.renderTiddler("text/html", tiddlerTitle, {
		variables: { size: size }
	});
	if(!htmlStr) return null;
	const container = document.createElement("div");
	container.innerHTML = htmlStr;
	const svgEl = container.querySelector("svg");
	if(svgEl) return svgEl;
} catch(e) { /* ignore */ }
return null;
}

function isRTL() {
const dir = document.documentElement.getAttribute("dir");
return dir === "rtl";
}

function findBlockAtCoords(view, coords) {
const posInfo = view.posAtCoords(coords);
if(!posInfo) return null;

try {
// Always resolve using posInfo.pos (the text-level position).
// posInfo.inside can land on node boundaries (depth 0) which breaks depth walking.
const $pos = view.state.doc.resolve(posInfo.pos);

// Walk from deepest to shallowest to find the tightest enclosing block
for(let depth = $pos.depth; depth >= 1; depth--) {
const node = $pos.node(depth);
const pos = $pos.before(depth);

// Skip inline and non-selectable nodes
if(!node.isBlock) continue;

// If this is a list node (prosemirror-flat-list), it's directly draggable
if(node.type.name === "list") {
const dom = view.nodeDOM(pos);
if(dom && dom.nodeType === 1) {
return { pos: pos, node: node, dom: dom, depth: depth };
}
}

// For other block types at depth 1 (direct children of doc), always draggable
if(depth === 1) {
const dom1 = view.nodeDOM(pos);
if(dom1 && dom1.nodeType === 1) {
return { pos: pos, node: node, dom: dom1, depth: depth };
}
}

// For atom/draggable blocks at any depth, allow dragging
if(node.type.spec.atom || node.type.spec.draggable) {
const domA = view.nodeDOM(pos);
if(domA && domA.nodeType === 1) {
return { pos: pos, node: node, dom: domA, depth: depth };
}
}
}

// Fallback: depth-1 parent
if($pos.depth >= 1) {
const blockPos = $pos.before(1);
const blockNode = view.state.doc.nodeAt(blockPos);
if(blockNode && blockNode.isBlock) {
const domF = view.nodeDOM(blockPos);
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

function resolveCurrentBlock(view, origPos, origNode) {
try {
const doc = view.state.doc;
if(origPos < 0 || origPos >= doc.content.size) return null;
const node = doc.nodeAt(origPos);
if(node && node.type === origNode.type) {
return { pos: origPos, node: node };
}
} catch(e) {
// ignore
}
return null;
}

function createDragHandlePlugin() {
let handle = null;
let currentBlockPos = null;
let currentBlockNode = null;
let currentView = null;
let menuEl = null;
let menuVisible = false;
let destroyed = false;
const pendingTimers = [];
let dragWrapper = null;

function safeTimeout(fn, delay) {
const id = setTimeout(() => {
const idx = pendingTimers.indexOf(id);
if(idx >= 0) pendingTimers.splice(idx, 1);
if(!destroyed) fn();
}, delay);
pendingTimers.push(id);
return id;
}

function createHandle() {
const el = document.createElement("div");
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

el.addEventListener("click", (e) => {
e.preventDefault();
e.stopPropagation();
if(menuVisible) {
hideMenu();
} else {
showMenu();
}
});

el.addEventListener("keydown", (e) => {
if(e.key === "Enter" || e.key === " ") {
e.preventDefault();
if(menuVisible) { hideMenu(); } else { showMenu(); }
} else if(e.key === "Escape" && menuVisible) {
e.preventDefault();
hideMenu();
}
});

el.addEventListener("mousedown", (e) => {
e.preventDefault();
if(currentView && currentBlockPos !== null) {
try {
const sel = NodeSelection.create(currentView.state.doc, currentBlockPos);
currentView.dispatch(currentView.state.tr.setSelection(sel));
} catch(ex) {
// ignore invalid positions
}
}
});

el.addEventListener("dragstart", (e) => {
if(!currentView || currentBlockPos === null) {
e.preventDefault();
return;
}
hideMenu();
try {
const slice = currentView.state.selection.content();
const serializer = DOMSerializer.fromSchema(currentView.state.schema);
const fragment = slice.content;
const dragDom = serializer.serializeFragment(fragment);
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

el.addEventListener("dragend", () => {
if(dragWrapper && dragWrapper.parentNode) {
dragWrapper.parentNode.removeChild(dragWrapper);
}
dragWrapper = null;
});

el.addEventListener("mouseleave", (e) => {
const related = e.relatedTarget;
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

const box = info.dom.getBoundingClientRect();
if(box.width === 0 && box.height === 0) {
hideHandle();
return;
}

// Position the handle inside the editor's left padding area,
// aligned with the top of the block node.
const editorBox = view.dom.getBoundingClientRect();
const rtl = isRTL();

if(rtl) {
// For RTL, position inside the editor's right padding area
const handleRight = editorBox.right - 24 + window.scrollX;
handle.style.left = "";
handle.style.right = (window.innerWidth - handleRight) + "px";
} else {
// Position at the left edge of the editor content area
const handleLeft = editorBox.left + 2 + window.scrollX;
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

function showMenu() {
if(!currentView || currentBlockPos === null) return;
if(!handle) return;
if(!menuEl) menuEl = createMenu();
menuVisible = true;
handle.setAttribute("aria-expanded", "true");

while(menuEl.firstChild) menuEl.removeChild(menuEl.firstChild);

const view = currentView;
const schema = view.state.schema;
const origPos = currentBlockPos;
const origNode = currentBlockNode;

const searchInput = document.createElement("input");
searchInput.type = "text";
searchInput.className = "tc-prosemirror-block-menu-search";
searchInput.setAttribute("aria-label", lang("FilterAriaLabel", "Filter actions"));
searchInput.placeholder = lang("FilterPlaceholder", "Filter actions...");
menuEl.appendChild(searchInput);

const itemsContainer = document.createElement("div");
itemsContainer.className = "tc-prosemirror-block-menu-items";
menuEl.appendChild(itemsContainer);

const actions = getBlockActions(view, schema, origPos, origNode);
renderActions(itemsContainer, actions);

searchInput.addEventListener("input", () => {
const filter = searchInput.value.toLowerCase().trim();
filterActions(itemsContainer, filter);
});

searchInput.addEventListener("keydown", (e) => {
if(e.key === "Escape") {
e.preventDefault();
hideMenu();
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
navigateMenuItems(itemsContainer, e.key === "ArrowDown" ? 1 : -1);
}
});

const handleRect = handle.getBoundingClientRect();
menuEl.style.display = "block";
menuEl.style.position = "absolute";
menuEl.style.zIndex = "101";

const rtl = isRTL();
if(rtl) {
menuEl.style.left = "";
menuEl.style.right = (window.innerWidth - handleRect.right + window.scrollX) + "px";
} else {
menuEl.style.right = "";
menuEl.style.left = (handleRect.left + window.scrollX) + "px";
}
menuEl.style.top = (handleRect.bottom + 4 + window.scrollY) + "px";

requestAnimationFrame(() => {
if(!menuEl || destroyed) return;
const menuRect = menuEl.getBoundingClientRect();
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

safeTimeout(() => { searchInput.focus(); }, 0);

document.removeEventListener("mousedown", closeOnOutsideClick);
safeTimeout(() => {
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
const items = container.querySelectorAll(".tc-prosemirror-block-menu-item:not(.tc-prosemirror-hidden)");
if(items.length === 0) return;
let focusedIdx = -1;
for(let i = 0; i < items.length; i++) {
if(items[i].classList.contains("tc-prosemirror-block-menu-item-focused")) {
focusedIdx = i;
items[i].classList.remove("tc-prosemirror-block-menu-item-focused");
break;
}
}
let nextIdx = focusedIdx + direction;
if(nextIdx < 0) nextIdx = items.length - 1;
if(nextIdx >= items.length) nextIdx = 0;
items[nextIdx].classList.add("tc-prosemirror-block-menu-item-focused");
items[nextIdx].scrollIntoView({ block: "nearest" });
}

function getBlockActions(view, schema, origPos, origNode) {
const actions = [];

function safeAction(fn) {
return () => {
const resolved = resolveCurrentBlock(view, origPos, origNode);
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
action: safeAction(() => {
pmCommands.setBlockType(schema.nodes.paragraph)(view.state, view.dispatch);
})
});
}

for(let level = 1; level <= 6; level++) {
((lvl) => {
if(schema.nodes.heading && !(origNode.type === schema.nodes.heading && origNode.attrs.level === lvl)) {
actions.push({
label: lang("Heading", "Heading") + " " + lvl,
icon: "H" + lvl,
action: safeAction(() => {
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
action: safeAction(() => {
pmCommands.setBlockType(schema.nodes.code_block)(view.state, view.dispatch);
})
});
}

if(schema.nodes.blockquote) {
actions.push({
label: lang("Blockquote", "Blockquote"),
icon: "\u00AB",
iconTiddler: "$:/core/images/quote",
action: safeAction(() => {
const $from = view.state.selection.$from;
for(let d = $from.depth; d > 0; d--) {
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
action: safeAction((pos, node) => {
const tr = view.state.tr.setNodeMarkup(pos, null, { ...node.attrs, ...{ kind: "bullet" } });
view.dispatch(tr);
})
});
}

if(origNode.attrs.kind !== "ordered") {
actions.push({
label: lang("NumberedList", "Numbered list"),
icon: "1.",
action: safeAction((pos, node) => {
const tr = view.state.tr.setNodeMarkup(pos, null, { ...node.attrs, ...{ kind: "ordered" } });
view.dispatch(tr);
})
});
}

if(origNode.attrs.kind !== "task") {
actions.push({
label: lang("TaskList", "Task list"),
icon: "\u2610",
iconTiddler: "$:/core/images/done-button",
action: safeAction((pos, node) => {
const tr = view.state.tr.setNodeMarkup(pos, null, { ...node.attrs, ...{ kind: "task", checked: false } });
view.dispatch(tr);
})
});
}

if(flatListCommands.indentListCommand) {
actions.push({
label: lang("Indent", "Indent"),
icon: "→",
action: safeAction(() => {
flatListCommands.indentListCommand(view.state, view.dispatch);
})
});
}
if(flatListCommands.dedentListCommand) {
actions.push({
label: lang("Dedent", "Dedent"),
icon: "←",
action: safeAction(() => {
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
action: safeAction((pos, node) => {
const tr = view.state.tr;
const insertPos = pos + node.nodeSize;
tr.insert(insertPos, node.type.create(node.attrs, node.content, node.marks));
view.dispatch(tr);
})
});

actions.push({
label: lang("Delete", "Delete"),
icon: "\u00D7",
iconTiddler: "$:/core/images/delete-button",
action: safeAction((pos, node) => {
const tr = view.state.tr.delete(pos, pos + node.nodeSize);
view.dispatch(tr);
})
});

return actions;
}

function renderActions(container, actions) {
while(container.firstChild) container.removeChild(container.firstChild);

for(let i = 0; i < actions.length; i++) {
const act = actions[i];
if(act.type === "group") {
const groupEl = document.createElement("div");
groupEl.className = "tc-prosemirror-block-menu-group";
groupEl.textContent = act.label;
groupEl.setAttribute("data-group", "true");
container.appendChild(groupEl);
} else {
const item = document.createElement("div");
item.className = "tc-prosemirror-block-menu-item";
item.setAttribute("role", "menuitem");
item.setAttribute("data-label", act.label.toLowerCase());

const iconSpan = document.createElement("span");
iconSpan.className = "tc-prosemirror-block-menu-item-icon";
if(act.iconTiddler) {
const svgEl = getSvgIcon(act.iconTiddler, "1em");
if(svgEl) {
	iconSpan.appendChild(document.importNode(svgEl, true));
} else {
	iconSpan.textContent = act.icon || "\u2022";
}
} else {
iconSpan.textContent = act.icon || "\u2022";
}
item.appendChild(iconSpan);

const labelSpan = document.createElement("span");
labelSpan.className = "tc-prosemirror-block-menu-item-label";
labelSpan.textContent = act.label;
item.appendChild(labelSpan);

((actionFn) => {
item.addEventListener("click", (e) => {
e.preventDefault();
e.stopPropagation();
actionFn();
});
})(act.action);

item.addEventListener("mouseenter", () => {
const siblings = container.querySelectorAll(".tc-prosemirror-block-menu-item-focused");
for(let s = 0; s < siblings.length; s++) {
siblings[s].classList.remove("tc-prosemirror-block-menu-item-focused");
}
this.classList.add("tc-prosemirror-block-menu-item-focused");
});

container.appendChild(item);
}
}
}

function filterActions(container, filter) {
const items = container.querySelectorAll(".tc-prosemirror-block-menu-item");
const groups = container.querySelectorAll("[data-group]");

for(let i = 0; i < items.length; i++) {
const label = items[i].getAttribute("data-label") || "";
if(!filter || label.indexOf(filter) >= 0) {
items[i].classList.remove("tc-prosemirror-hidden");
} else {
items[i].classList.add("tc-prosemirror-hidden");
}
}

for(let g = 0; g < groups.length; g++) {
const groupEl = groups[g];
let hasVisibleChild = false;
let next = groupEl.nextElementSibling;
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
mousemove: (view, event) => {
if(menuVisible) return false;
const info = findBlockAtCoords(view, { left: event.clientX, top: event.clientY });
if(info) {
showHandle(view, info);
} else {
hideHandle();
}
return false;
},
mouseleave: (view, event) => {
const related = event.relatedTarget;
if(handle && handle.contains(related)) return false;
if(menuEl && menuEl.contains(related)) return false;
hideHandle();
return false;
},
scroll: () => {
if(!menuVisible) hideHandle();
return false;
}
}
},
view: function() {
return {
update: (view) => {
if(menuVisible && currentBlockPos !== null && currentBlockNode !== null) {
const resolved = resolveCurrentBlock(view, currentBlockPos, currentBlockNode);
if(!resolved) {
hideMenu();
}
}
},
destroy: () => {
destroyed = true;
hideMenu();
for(let i = 0; i < pendingTimers.length; i++) {
clearTimeout(pendingTimers[i]);
}
pendingTimers.length = 0;
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
