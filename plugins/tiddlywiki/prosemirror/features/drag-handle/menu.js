/*\
title: $:/plugins/tiddlywiki/prosemirror/features/drag-handle/menu.js
type: application/javascript
module-type: library

Block action menu builders and rendering helpers for the drag handle feature.

\*/

"use strict";

const flatListCommands = require("prosemirror-flat-list");
const slashMenuElements = require("$:/plugins/tiddlywiki/prosemirror/features/slash-menu/menu-elements.js");
const helpers = require("$:/plugins/tiddlywiki/prosemirror/features/drag-handle/helpers.js");

const INLINE_SLASH_ACTION_IDS = {
	"action-bold": true,
	"action-italic": true,
	"action-underline": true,
	"action-strikethrough": true,
	"action-code-inline": true
};

function isEligibleSlashMenuItem(element) {
	if(!element || element.type !== "command" || INLINE_SLASH_ACTION_IDS[element.id]) {
		return false;
	}
	if(typeof element.available === "function" && !element.available()) {
		return false;
	}
	return true;
}

function buildSlashMenuActions(view, schema, safeAction) {
	const flattened = slashMenuElements.flattenMenuElementsWithGroup(
		slashMenuElements.getAllMenuElements($tw.wiki, schema)
	);
	const actions = [];
	const seen = Object.create(null);
	let previousWasGroup = true;
	for(let i = 0; i < flattened.length; i++) {
		const element = flattened[i];
		if(!element) continue;
		if(element.type === "group") {
			if(previousWasGroup) continue;
			actions.push({ type: "group", label: element.label });
			previousWasGroup = true;
			continue;
		}
		if(!isEligibleSlashMenuItem(element) || seen[element.id]) continue;
		seen[element.id] = true;
		actions.push({
			label: element.label,
			icon: element.icon && element.icon.indexOf("$:/") !== 0 ? element.icon : null,
			iconTiddler: element.icon && element.icon.indexOf("$:/") === 0 ? element.icon : null,
			action: safeAction(() => {
				element.command(view);
			})
		});
		previousWasGroup = false;
	}
	while(actions.length > 0 && actions[actions.length - 1].type === "group") {
		actions.pop();
	}
	return actions;
}

function buildBlockActions(options) {
	const view = options.view;
	const schema = options.schema;
	const origPos = options.origPos;
	const origNode = options.origNode;
	const onAfterAction = options.onAfterAction || function() {};
	const actions = [];

	function safeAction(fn) {
		return () => {
			const resolved = helpers.resolveCurrentBlock(view, origPos, origNode);
			if(!resolved) {
				onAfterAction();
				return;
			}
			try {
				fn(resolved.pos, resolved.node);
			} catch(ex) {
				// command failed
			}
			onAfterAction();
		};
	}

	actions.push.apply(actions, buildSlashMenuActions(view, schema, safeAction));

	if(origNode.type.name === "list") {
		actions.push({ type: "group", label: helpers.lang("List", "List") });

		if(origNode.attrs.kind !== "bullet") {
			actions.push({
				label: helpers.lang("BulletList", "Bullet list"),
				icon: "•",
				action: safeAction((pos, node) => {
					const tr = view.state.tr.setNodeMarkup(pos, null, Object.assign({}, node.attrs, { kind: "bullet" }));
					view.dispatch(tr);
				})
			});
		}

		if(origNode.attrs.kind !== "ordered") {
			actions.push({
				label: helpers.lang("NumberedList", "Numbered list"),
				icon: "1.",
				action: safeAction((pos, node) => {
					const tr = view.state.tr.setNodeMarkup(pos, null, Object.assign({}, node.attrs, { kind: "ordered" }));
					view.dispatch(tr);
				})
			});
		}

		if(origNode.attrs.kind !== "task") {
			actions.push({
				label: helpers.lang("TaskList", "Task list"),
				icon: "\u2610",
				iconTiddler: "$:/core/images/done-button",
				action: safeAction((pos, node) => {
					const tr = view.state.tr.setNodeMarkup(pos, null, Object.assign({}, node.attrs, {
						kind: "task",
						checked: false
					}));
					view.dispatch(tr);
				})
			});
		}

		if(flatListCommands.indentListCommand) {
			actions.push({
				label: helpers.lang("Indent", "Indent"),
				icon: "→",
				action: safeAction(() => {
					flatListCommands.indentListCommand(view.state, view.dispatch);
				})
			});
		}
		if(flatListCommands.dedentListCommand) {
			actions.push({
				label: helpers.lang("Dedent", "Dedent"),
				icon: "←",
				action: safeAction(() => {
					flatListCommands.dedentListCommand(view.state, view.dispatch);
				})
			});
		}
	}

	actions.push({ type: "group", label: helpers.lang("Actions", "Actions") });
	actions.push({
		label: helpers.lang("Duplicate", "Duplicate"),
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
		label: helpers.lang("Delete", "Delete"),
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
				const svgEl = helpers.getSvgIcon(act.iconTiddler, "1em");
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
				item.classList.add("tc-prosemirror-block-menu-item-focused");
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

exports.buildBlockActions = buildBlockActions;
exports.renderActions = renderActions;
exports.filterActions = filterActions;
exports.navigateMenuItems = navigateMenuItems;