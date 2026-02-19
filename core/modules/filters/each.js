/*\
title: $:/core/modules/filters/each.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.each = function(source,operator,options) {
	var results =[] ,
	value,values = {},
	field = operator.operand || "title";
	if(operator.suffix === "value" && field === "title") {
		source(function(tiddler,title) {
			if(!$tw.utils.hop(values,title)) {
				values[title] = true;
				results.push(title);
			}
		});
	} else if(operator.suffix !== "list-item") {
		if(field === "title") {
			source(function(tiddler,title) {
				if(tiddler && !$tw.utils.hop(values,title)) {
					values[title] = true;
					results.push(title);
				}
			});
		} else {
			source(function(tiddler,title) {
				if(tiddler) {
					value = tiddler.getFieldString(field);
					if(!$tw.utils.hop(values,value)) {
						values[value] = true;
						results.push(title);
					}
				}
			});
		}
	} else {
		source(function(tiddler,title) {
			if(tiddler) {
				$tw.utils.each(
					options.wiki.getTiddlerList(title,field),
					function(value) {
						if(!$tw.utils.hop(values,value)) {
							values[value] = true;
							results.push(value);
						}
					}
				);
			}
		});
	}
	return results;
};
