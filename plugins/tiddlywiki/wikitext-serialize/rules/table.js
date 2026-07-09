/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/table.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "table";

var containerSuffixes = {caption: "c", thead: "h", tbody: "", tfoot: "f"};

function isBoundary(text) {
	return /^\s*$/.test(text) || text.indexOf("|") !== -1;
}

/*
Collect the inline leaf nodes of every cell and of the caption in document
order. Everything else (pipes, ! markers, merge markers, alignment spaces,
class rows) lives between the leaves and only exists in the source.
*/
function collectInlineLeaves(table) {
	// The parser moves the caption container to the front, so restore
	// document order by position
	var containers = (table.children || []).slice().sort(function(a,b) {
		return (a.start || 0) - (b.start || 0);
	});
	var leaves = [];
	$tw.utils.each(containers,function(container) {
		if(container.tag === "caption") {
			leaves.push.apply(leaves,container.children || []);
		} else {
			$tw.utils.each(container.children || [],function(row) {
				$tw.utils.each(row.children || [],function(cell) {
					leaves.push.apply(leaves,cell.children || []);
				});
			});
		}
	});
	return leaves;
}

function serializeStitched(tree,serialize,options) {
	var source = options.source;
	if(!source || typeof tree.start !== "number" || typeof tree.end !== "number") {
		return null;
	}
	var pos = tree.start,
		result = "",
		valid = true;
	var appendBoundary = function(boundary) {
		if(!isBoundary(boundary)) {
			valid = false;
			return;
		}
		result += boundary;
	};
	$tw.utils.each(collectInlineLeaves(tree),function(leaf) {
		if(typeof leaf.start !== "number" || typeof leaf.end !== "number" || leaf.start < pos) {
			valid = false;
		}
		if(valid) {
			appendBoundary(source.substring(pos,leaf.start));
		}
		if(valid) {
			result += serialize(leaf);
			pos = leaf.end;
		}
		return valid;
	});
	if(valid) {
		appendBoundary(source.substring(pos,tree.end));
	}
	return valid ? result : null;
}

function serializeFromTree(tree,serialize) {
	var lines = [];
	if(tree.attributes && tree.attributes.class) {
		lines.push("|" + tree.attributes.class.value + "|k");
	}
	// Cells covered by a rowspan or colspan have no node of their own, so
	// the merge markers are reconstructed from the span attributes
	var rowSpans = [];
	$tw.utils.each(tree.children || [],function(container) {
		if(container.tag === "caption") {
			lines.push("|" + serialize(container.children) + "|c");
			return;
		}
		var suffix = containerSuffixes[container.tag] || "";
		$tw.utils.each(container.children || [],function(row) {
			var parts = [],
				col = 0;
			var fillRowSpans = function() {
				while(rowSpans[col] > 0) {
					rowSpans[col]--;
					parts.push("~");
					col++;
				}
			};
			$tw.utils.each(row.children || [],function(cell) {
				fillRowSpans();
				var attributes = cell.attributes || {},
					align = attributes.align && attributes.align.value,
					valign = attributes.valign && attributes.valign.value,
					colspan = attributes.colspan ? parseInt(attributes.colspan.value,10) || 1 : 1,
					rowspan = attributes.rowspan ? parseInt(attributes.rowspan.value,10) || 1 : 1,
					text = "";
				if(valign === "top") {
					text += "^";
				} else if(valign === "bottom") {
					text += ",";
				}
				if(align === "right" || align === "center") {
					text += " ";
				}
				if(cell.tag === "th") {
					text += "!";
				}
				text += serialize(cell.children);
				if(align === "left" || align === "center") {
					text += " ";
				}
				parts.push(text);
				for(var extra = 1; extra < colspan; extra++) {
					parts.push("<");
				}
				for(var covered = 0; covered < colspan; covered++) {
					rowSpans[col + covered] = rowspan - 1;
				}
				col += colspan;
			});
			fillRowSpans();
			lines.push("|" + parts.join("|") + "|" + suffix);
		});
	});
	return lines.join("\n");
}

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	var result = serializeStitched(tree,serialize,options);
	if(result === null) {
		result = serializeFromTree(tree,serialize);
	}
	return result.replace(/\n+$/,"") + "\n\n";
};
