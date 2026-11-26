/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/utils/parsetree-factory.js
type: application/javascript
module-type: utils

$tw.utils.wikitextParseTree: a node factory and classification helpers for
parse trees an editor builds or reads. Factory nodes carry exactly what the
rule serializers consume and no positions, so an editor never spells a rule
name or a tag itself.

\*/

"use strict";

var api = {};

var blockOnlyRules = null,
	pragmaRules = null;

function ruleNames(test) {
	var names = Object.create(null);
	$tw.modules.forEachModuleOfType("wikirule",function(title,module) {
		if(module.name && module.types && test(module.types)) {
			names[module.name] = true;
		}
	});
	return names;
}

// Rules that only ever parse at block level, e.g. heading or list; a node with such a rule name is a block by construction
function getBlockOnlyRules() {
	if(!blockOnlyRules) {
		blockOnlyRules = ruleNames(function(types) {
			return types.block && !types.inline && !types.pragma;
		});
	}
	return blockOnlyRules;
}

function getPragmaRules() {
	if(!pragmaRules) {
		pragmaRules = ruleNames(function(types) {
			return types.pragma;
		});
	}
	return pragmaRules;
}

var emphasisTags = {
	bold: "strong",
	italic: "em",
	underscore: "u",
	strikethrough: "s",
	superscript: "sup",
	subscript: "sub",
	code: "code"
};

var emphasisKinds = Object.create(null);
$tw.utils.each(emphasisTags,function(tag,kind) {
	emphasisKinds[tag] = kind;
});

var listItemTags = {li: true, dt: true, dd: true},
	listTags = {ul: true, ol: true, dl: true};

/*
One string attribute node; quoted, assignmentOperator and isPositional pass
through to serializeAttribute, which picks the quoting from them
*/
function attribute(name,value,options) {
	options = options || {};
	var node = {name: name, type: "string", value: String(value)};
	if(options.quoted !== undefined) {
		node.quoted = options.quoted;
	}
	if(options.assignmentOperator) {
		node.assignmentOperator = options.assignmentOperator;
	}
	if(options.isPositional) {
		node.isPositional = true;
	}
	return node;
}

/*
Add attributes to a node in the order given. `attributes` maps a name to a
string value or to a ready attribute node, e.g. {type: "indirect", textReference: "X"}
*/
function setAttributes(node,attributes) {
	node.attributes = node.attributes || {};
	node.orderedAttributes = node.orderedAttributes || [];
	$tw.utils.each(attributes,function(value,name) {
		var attr = (value && typeof value === "object" && value.type) ? value : attribute(name,value);
		attr.name = attr.name || name;
		node.attributes[attr.name] = attr;
		node.orderedAttributes.push(attr);
	});
	return node;
}

function element(tag,rule,children,attributes) {
	var node = {type: "element", tag: tag, attributes: {}, orderedAttributes: []};
	if(rule) {
		node.rule = rule;
	}
	if(children) {
		node.children = children;
	}
	if(attributes) {
		setAttributes(node,attributes);
	}
	return node;
}

function classAttribute(classes) {
	return classes && classes.length ? {"class": classes.join(" ")} : null;
}

function hasClass(node,className) {
	var attr = node.attributes && node.attributes["class"];
	return !!attr && typeof attr.value === "string" && attr.value.split(" ").includes(className);
}

function isQuoteCite(node) {
	return !!node && (node.isQuoteCite || (node.tag === "cite" && !node.rule));
}

// Factory, write side

api.text = function(value) {
	return {type: "text", text: String(value)};
};

api.paragraph = function(children) {
	return element("p","parseblock",children || []);
};

api.blankLine = function() {
	return element("p","blankline",[],{"class": "tc-blankline"});
};

api.heading = function(level,children,options) {
	options = options || {};
	return element("h" + level,"heading",children || [],classAttribute(options.classes));
};

// kind: "ul" or "ol"; items from listItem(), a nested list goes into an item's children
api.list = function(kind,items) {
	return element(kind === "ol" ? "ol" : "ul","list",items || []);
};

api.listItem = function(children,options) {
	options = options || {};
	return element("li",null,children || [],classAttribute(options.classes));
};

api.definitionList = function(children) {
	return element("dl","list",children || []);
};

api.definitionTerm = function(children) {
	return element("dt",null,children || []);
};

api.definitionDescription = function(children) {
	return element("dd",null,children || []);
};

api.codeBlock = function(code,language) {
	return setAttributes({type: "codeblock", rule: "codeblock"},{code: code || "", language: language || ""});
};

// options.cite: inline children of a closing citation; the tc-quote class is always first
api.quoteBlock = function(children,options) {
	options = options || {};
	var body = (children || []).slice();
	if(options.cite) {
		body.push(element("cite",null,options.cite));
	}
	return element("blockquote","quoteblock",body,{"class": ["tc-quote"].concat(options.classes || []).join(" ")});
};

// rows from tableRow(); options.caption: inline children
api.table = function(rows,options) {
	options = options || {};
	var children = [];
	if(options.caption) {
		children.push(element("caption",null,options.caption));
	}
	children.push(element("tbody",null,rows || []));
	return element("table","table",children,classAttribute(options.classes));
};

api.tableRow = function(cells) {
	return element("tr",null,cells || []);
};

// options: header, align (left, center, right), valign (top, bottom), colspan, rowspan
api.tableCell = function(children,options) {
	options = options || {};
	var attributes = {};
	$tw.utils.each(["align","valign","colspan","rowspan"],function(name) {
		if(options[name] !== undefined) {
			attributes[name] = options[name];
		}
	});
	return element(options.header ? "th" : "td",null,children || [],attributes);
};

api.horizontalRule = function() {
	return element("hr","horizrule");
};

// Two spaces and a backslash before the line end; needs the hard-line-breaks plugin
api.hardBreak = function() {
	return element("br","ssnl");
};

// A <br> element, the only break a table cell can hold
api.htmlBreak = function() {
	return element("br","html");
};

// lines: arrays of inline children; the region ends with a br for the line end before the closing fence
api.hardLineBreaksRegion = function(lines) {
	var children = [];
	$tw.utils.each(lines || [],function(line) {
		children.push.apply(children,line);
		children.push(element("br","hardlinebreaks"));
	});
	return {type: "void", rule: "hardlinebreaks", children: children};
};

// kind: bold, italic, underscore, strikethrough, superscript, subscript, code
api.emphasis = function(kind,children) {
	var tag = emphasisTags[kind];
	if(!tag) {
		throw new Error("wikitextParseTree.emphasis: unknown kind " + kind);
	}
	return element(tag,kind === "code" ? "codeinline" : kind,children || []);
};

api.link = function(target,children) {
	return setAttributes({type: "link", rule: "prettylink", children: children || [api.text(target)]},{to: target});
};

api.externalLink = function(url,children) {
	return element("a","prettyextlink",children || [api.text(url)],{
		"class": "tc-tiddlylink-external",
		href: url,
		target: "_blank",
		rel: "noopener noreferrer"
	});
};

// options: tooltip, width, height, classes
api.image = function(source,options) {
	options = options || {};
	var attributes = {source: source};
	$tw.utils.each(["tooltip","width","height"],function(name) {
		if(options[name] !== undefined) {
			attributes[name] = options[name];
		}
	});
	if(options.classes && options.classes.length) {
		attributes["class"] = options.classes.join(" ");
	}
	return setAttributes({type: "image", rule: "image"},attributes);
};

/*
params: strings for positional parameters, or {name, value, quoted,
assignmentOperator}; a numeric name is positional too; quoted: true forces
quotes on a value that would not need them
*/
api.macroCall = function(name,params,options) {
	options = options || {};
	var node = setAttributes({
		type: "transclude",
		rule: options.block ? "macrocallblock" : "macrocallinline",
		isBlock: !!options.block
	},{$variable: name});
	var position = 0;
	$tw.utils.each(params || [],function(param) {
		var isObject = param && typeof param === "object",
			named = isObject && param.name !== undefined && !(parseInt(param.name,10) >= 0),
			attr;
		if(named) {
			attr = attribute(param.name,param.value,{quoted: param.quoted, assignmentOperator: param.assignmentOperator || ":"});
		} else {
			var value = isObject ? param.value : param,
				quoted = isObject ? param.quoted : undefined;
			attr = attribute(isObject && param.name !== undefined ? param.name : String(position),value,{quoted: quoted, isPositional: true});
			position++;
		}
		node.attributes[attr.name] = attr;
		node.orderedAttributes.push(attr);
	});
	return node;
};

/*
tag: "$list" or "div"; attributes as for setAttributes; options: block (at
block position), selfClosing, blockContent (a blank line after the open tag)
*/
api.widget = function(tag,attributes,children,options) {
	options = options || {};
	var node = setAttributes({
		type: tag.charAt(0) === "$" ? tag.substr(1) : "element",
		tag: tag,
		rule: "html",
		isBlock: !!options.block
	},attributes || {});
	if(options.selfClosing) {
		node.isSelfClosing = true;
	} else {
		node.children = children || [];
	}
	if(options.blockContent) {
		node.blockContent = true;
	}
	return node;
};

// Source text the walker writes verbatim, e.g. a block the editor cannot show
api.opaque = function(sourceText,options) {
	options = options || {};
	return {type: "void", isBlock: !!options.block, children: [api.text(sourceText)]};
};

// The pragma nodes the parser makes from the text, e.g. "\\define m() x", with their bodies and positions stripped
api.pragma = function(sourceText,options) {
	options = options || {};
	var wiki = options.wiki || $tw.wiki;
	return wiki.parseText("text/vnd.tiddlywiki",sourceText).tree.map(function(node) {
		var copy = $tw.utils.extend({},node);
		copy.children = [];
		delete copy.start;
		delete copy.end;
		return copy;
	});
};

// Classification, read side

/*
The walker's own test: a block node gets the blank line towards its next
sibling. Annotated trees carry blockPosition; paragraphs say so through their
rule; editor trees fall back to isBlock, then to the rule name
*/
api.isBlock = function(node) {
	if(!node || typeof node !== "object") {
		return false;
	}
	if(node.blockPosition !== undefined) {
		return node.blockPosition;
	}
	if(node.rule === "parseblock") {
		return true;
	}
	if(node.isBlock === true) {
		return true;
	}
	if(typeof node.rule !== "string") {
		return false;
	}
	return getBlockOnlyRules()[node.rule] === true || (node.rule !== "commentblock" && node.rule.slice(-5) === "block");
};

var elementKinds = {
	h1: "heading", h2: "heading", h3: "heading", h4: "heading", h5: "heading", h6: "heading",
	ul: "list", ol: "list", li: "listItem",
	dl: "definitionList", dt: "definitionTerm", dd: "definitionDescription",
	blockquote: "quoteBlock",
	table: "table", thead: "tableSection", tbody: "tableSection", tfoot: "tableSection",
	tr: "tableRow", td: "tableCell", th: "tableCell", caption: "tableCaption",
	hr: "horizontalRule", br: "hardBreak"
};

api.kindOf = function(node) {
	if(!node || typeof node !== "object") {
		return "unknown";
	}
	// A <$text> widget has the node type "text" too, but keeps its tag
	if(node.type === "text" && !node.tag) {
		return "text";
	}
	var rule = node.rule,
		tag = node.tag;
	if(rule === "commentblock" || rule === "commentinline") {
		return "comment";
	}
	if(rule && getPragmaRules()[rule]) {
		return "pragma";
	}
	if(rule === "conditional" || node.isConditional) {
		return "conditional";
	}
	if(tag === "$link") {
		return "link";
	}
	if(typeof tag === "string" && tag.charAt(0) === "$") {
		return "widget";
	}
	switch(node.type) {
		case "void":
			return rule === "hardlinebreaks" ? "hardLineBreaksRegion" : (rule === "typedblock" ? "typedBlock" : "opaque");
		case "codeblock":
			return "codeBlock";
		case "image":
			return "image";
		case "link":
			return "link";
		case "transclude":
			return node.attributes && node.attributes.$variable ? "macroCall" : "transclusion";
		case "tiddler":
			return "transclusion";
		case "element":
			break;
		default:
			return "unknown";
	}
	if(tag === "p") {
		return rule === "blankline" || hasClass(node,"tc-blankline") ? "blankLine" : "paragraph";
	}
	if(tag === "cite" && isQuoteCite(node)) {
		return "quoteCite";
	}
	// An external pretty link and a hand-written anchor with the class are external links too
	if(tag === "a" && (rule === "prettyextlink" || rule === "extlink" || rule === "prettylink" || hasClass(node,"tc-tiddlylink-external"))) {
		return "externalLink";
	}
	if(emphasisKinds[tag] && rule !== "html") {
		return "emphasis";
	}
	return elementKinds[tag] || "element";
};

// The emphasis kind of a node, e.g. "bold" for strong, or null
api.emphasisKind = function(node) {
	return api.kindOf(node) === "emphasis" ? emphasisKinds[node.tag] : null;
};

// 1 to 6 for a heading, or null
api.headingLevel = function(node) {
	return api.kindOf(node) === "heading" ? parseInt(node.tag.substr(1),10) : null;
};

// "ul", "ol" or "dl" for a list, or null
api.listKind = function(node) {
	var kind = api.kindOf(node);
	return kind === "list" || kind === "definitionList" ? node.tag : null;
};

// The options tableCell() takes, read back from a cell: header, align, valign, colspan, rowspan
api.tableCellOptions = function(node) {
	var options = {header: node.tag === "th"},
		attributes = node.attributes || {};
	$tw.utils.each(["align","valign"],function(name) {
		if(attributes[name]) {
			options[name] = attributes[name].value;
		}
	});
	$tw.utils.each(["colspan","rowspan"],function(name) {
		if(attributes[name]) {
			options[name] = parseInt(attributes[name].value,10) || 1;
		}
	});
	return options;
};

// The inline children of a """ region as one array per line
api.regionLines = function(node) {
	var lines = [[]];
	$tw.utils.each(node.children || [],function(child) {
		if(child.type === "element" && child.tag === "br") {
			lines.push([]);
		} else {
			lines[lines.length - 1].push(child);
		}
	});
	// The last br is the line end before the closing fence, not a line
	if(lines.length > 1 && lines[lines.length - 1].length === 0) {
		lines.pop();
	}
	return lines;
};

// {body, openingCite, closingCite}: the block children and the inline children of each citation, or null
api.quoteParts = function(node) {
	var body = (node.children || []).slice(),
		openingCite = null,
		closingCite = null;
	if(isQuoteCite(body[0])) {
		openingCite = body.shift().children || [];
	}
	if(body.length && isQuoteCite(body[body.length - 1])) {
		closingCite = body.pop().children || [];
	}
	return {body: body, openingCite: openingCite, closingCite: closingCite};
};

// One entry per item: {node, children, nested, classes}, nested lists split from the item's own content
api.listItems = function(node) {
	var items = [];
	$tw.utils.each(node.children || [],function(child) {
		if(!listItemTags[child.tag]) {
			return;
		}
		var entry = {node: child, children: [], nested: [], classes: []};
		$tw.utils.each(child.children || [],function(sub) {
			(sub.type === "element" && listTags[sub.tag] ? entry.nested : entry.children).push(sub);
		});
		if(child.attributes && child.attributes["class"]) {
			entry.classes = child.attributes["class"].value.split(" ");
		}
		items.push(entry);
	});
	return items;
};

// The exact source text of a parsed node, or null for a node without positions
api.sourceSlice = function(node,source) {
	if(typeof source !== "string" || !node || typeof node.start !== "number" || typeof node.end !== "number") {
		return null;
	}
	return source.substring(node.start,node.end);
};

// Whether the end of the text closed an element, e.g. <$let a="x"> without </$let>: the parser records equal close tag positions
api.hasImplicitCloseTag = function(node) {
	return !!node && typeof node.closeTagStart === "number" && node.closeTagStart === node.closeTagEnd;
};

exports.wikitextParseTree = api;
