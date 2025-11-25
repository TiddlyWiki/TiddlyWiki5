/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/markdown/handlers/image.js
type: application/javascript
module-type: markdown-to-wikiast-handler

Handler for markdown image tokens

\*/

"use strict";

exports.type = "image";

exports.handler = function(token, context) {
	// Get src from attributes
	var src = "";
	if(token.attrs) {
		for(var j = 0; j < token.attrs.length; j++) {
			if(token.attrs[j][0] === "src") {
				src = token.attrs[j][1];
				break;
			}
		}
	}
	
	// Alt text is in token.content - use as tooltip in WikiText
	var alt = token.content || "";
	
	var attributes = {
		source: {
			type: "string",
			value: src
		}
	};
	
	// Use tooltip attribute (not alt) as that's what the serializer expects
	if(alt) {
		attributes.tooltip = {
			type: "string",
			value: alt
		};
	}
	
	return {
		type: "image",
		attributes: attributes,
		rule: "image"
	};
};
