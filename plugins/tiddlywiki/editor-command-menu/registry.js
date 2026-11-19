/*\
title: $:/plugins/tiddlywiki/editor-command-menu/registry.js
type: application/javascript
module-type: library

Editor-independent discovery and filtering of command descriptor tiddlers.

\*/

"use strict";

const COMMAND_TAG = "$:/tags/EditorCommand";

const RESERVED_COMMAND_FIELDS = {
	"command-id": true,
	"command-key": true,
	"command-surfaces": true,
	"command-editors": true,
	"command-content-types": true,
	"command-category": true,
	"command-keywords": true
};

function parseList(value) {
	return $tw.utils.parseStringArray(value || "") || [];
}

function includesOrUnrestricted(values, expected) {
	values = values || [];
	return values.length === 0 || values.indexOf(expected) !== -1;
}

function renderPlainText(wiki, text) {
	text = text == null ? "" : String(text);
	if(!text) {
		return "";
	}
	try {
		return wiki.renderText("text/plain", "text/vnd.tiddlywiki", text).trim();
	} catch(e) {
		return text;
	}
}

function readParameters(fields) {
	const parameters = Object.create(null);
	for(const fieldName in fields) {
		if(!Object.prototype.hasOwnProperty.call(fields, fieldName) || fieldName.indexOf("command-") !== 0 || RESERVED_COMMAND_FIELDS[fieldName]) {
			continue;
		}
		parameters[fieldName.slice("command-".length)] = fields[fieldName];
	}
	return parameters;
}

function readCommandDescriptor(wiki, title) {
	const tiddler = wiki.getTiddler(title);
	if(!tiddler || !tiddler.fields["command-id"] || tiddler.fields["draft.of"]) {
		return null;
	}
	const fields = tiddler.fields;
	const label = renderPlainText(wiki, fields.caption || title);
	const description = renderPlainText(wiki, fields.description || "");
	const keywords = parseList(fields["command-keywords"]);
	return {
		id: String(fields["command-key"] || title),
		commandId: String(fields["command-id"]),
		label: label,
		description: description,
		icon: fields.icon ? String(fields.icon) : null,
		category: String(fields["command-category"] || "other"),
		surfaces: parseList(fields["command-surfaces"]),
		editors: parseList(fields["command-editors"]),
		contentTypes: parseList(fields["command-content-types"]),
		keywords: keywords,
		parameters: readParameters(fields),
		sourceTitle: title,
		searchText: [label, description].concat(keywords).join(" ").toLocaleLowerCase()
	};
}

function matchesContext(command, context) {
	context = context || {};
	return includesOrUnrestricted(command.surfaces, context.surface || "") &&
		includesOrUnrestricted(command.editors, context.editorType || "") &&
		includesOrUnrestricted(command.contentTypes, context.contentType || "");
}

function getDescriptorCommands(wiki, context) {
	return wiki.getTiddlersWithTag(COMMAND_TAG).map(function(title) {
		return readCommandDescriptor(wiki, title);
	}).filter(function(command) {
		return command && matchesContext(command, context);
	});
}

function getRankedTitleMap(wiki) {
	const ranked = Object.create(null);
	const configured = wiki.getTiddlerList(COMMAND_TAG);
	configured.forEach(function(title, index) {
		ranked[title] = index;
	});
	return ranked;
}

function compareCommands(left, right, ranked) {
	const leftRank = Object.prototype.hasOwnProperty.call(ranked, left.sourceTitle) ? ranked[left.sourceTitle] : Number.MAX_SAFE_INTEGER;
	const rightRank = Object.prototype.hasOwnProperty.call(ranked, right.sourceTitle) ? ranked[right.sourceTitle] : Number.MAX_SAFE_INTEGER;
	if(leftRank !== rightRank) {
		return leftRank - rightRank;
	}
	return left.label.localeCompare(right.label) || String(left.sourceTitle || left.id).localeCompare(String(right.sourceTitle || right.id));
}

function getCommands(wiki, context, options) {
	options = options || {};
	const seen = Object.create(null);
	const ranked = getRankedTitleMap(wiki);
	const commands = getDescriptorCommands(wiki, context).concat(options.commands || []).filter(function(command) {
		if(!command || !command.id || !matchesContext(command, context) || seen[command.id]) {
			return false;
		}
		if(options.canExecute && !options.canExecute(command, context || {})) {
			return false;
		}
		seen[command.id] = true;
		return true;
	});
	const categoryOrder = [];
	const categoryCommands = Object.create(null);
	commands.forEach(function(command) {
		if(!categoryCommands[command.category]) {
			categoryCommands[command.category] = [];
			categoryOrder.push(command.category);
		}
		categoryCommands[command.category].push(command);
	});
	return categoryOrder.reduce(function(result, category) {
		return result.concat(categoryCommands[category].sort(function(left, right) {
			return compareCommands(left, right, ranked);
		}));
	}, []);
}

function filterCommands(commands, filter) {
	const normalized = (filter || "").trim().toLocaleLowerCase();
	if(!normalized) {
		return commands.slice(0);
	}
	const terms = normalized.split(/\s+/).filter(Boolean);
	return commands.filter(function(command) {
		const searchable = command.searchText || [command.label, command.description]
			.concat(command.keywords || []).join(" ").toLocaleLowerCase();
		return terms.every(function(term) {
			return searchable.indexOf(term) !== -1;
		});
	});
}

function getCategoryLabel(wiki, category) {
	const title = "$:/plugins/tiddlywiki/editor-command-menu/language/Category/" + category;
	return wiki.getTiddlerText(title, category);
}

exports.COMMAND_TAG = COMMAND_TAG;
exports.renderPlainText = renderPlainText;
exports.readCommandDescriptor = readCommandDescriptor;
exports.matchesContext = matchesContext;
exports.getCommands = getCommands;
exports.filterCommands = filterCommands;
exports.getCategoryLabel = getCategoryLabel;
