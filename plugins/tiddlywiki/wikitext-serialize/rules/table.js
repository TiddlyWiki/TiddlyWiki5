/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/table.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "table";

exports.serialize = function(tree,serialize) {
	var serialized = "";
	// Iterate over the table rows
	for(var i = 0; i < tree.children.length; i++) {
		var rowContainer = tree.children[i];
		// Iterate over the rows in the row container
		for(var j = 0; j < rowContainer.children.length; j++) {
			var row = rowContainer.children[j];
			// Start the row
			serialized += "|";
			// Iterate over the cells in the row
			for(var k = 0; k < row.children.length; k++) {
				var cell = row.children[k];
				// if is th, append additional `!`
				if(cell.tag === "th") {
					serialized += "!";
				}
				// Cell content
				serialized += serialize(cell.children);
				// End the cell
				serialized += "|";
			}
			// End the row
			serialized += "\n";
		}
	}
	// Return the completed block
	return serialized + "\n";
};
