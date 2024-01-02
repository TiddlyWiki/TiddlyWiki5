/*\
title: $:/plugins/tiddlywiki/multiwikiserver/route-wiki.js
type: application/javascript
module-type: route

GET /wikis/:recipe_name

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/wiki\/(.+)$/;

exports.handler = function(request,response,state) {
	// Get the recipe name from the parameters
	var recipe_name = $tw.utils.decodeURIComponentSafe(state.params[0]);
	// Get the tiddlers in the recipe
	var titles = $tw.sqlTiddlerStore.getRecipeTiddlers(recipe_name);
	// Render the template
	var template = $tw.wiki.renderTiddler("text/plain","$:/core/templates/tiddlywiki5.html",{
		variables: {
			saveTiddlerFilter: `
				$:/boot/boot.css
				$:/boot/boot.js
				$:/boot/bootprefix.js
				$:/core
				$:/library/sjcl.js
				$:/themes/tiddlywiki/snowwhite
				$:/themes/tiddlywiki/vanilla
			`
		}
	});
	// Splice in our tiddlers
	var marker = `<` + `script class="tiddlywiki-tiddler-store" type="application/json">[`,
		markerPos = template.indexOf(marker);
	if(markerPos === -1) {
		throw new Error("Cannot find tiddler store in template");
	}
	var htmlParts = [];
	htmlParts.push(template.substring(0,markerPos + marker.length));
	$tw.utils.each(titles,function(title) {
		htmlParts.push(JSON.stringify($tw.sqlTiddlerStore.getTiddler(title,recipe_name)));
		htmlParts.push(",")
	});
	htmlParts.push(template.substring(markerPos + marker.length))
	// Send response
	if(htmlParts) {
		state.sendResponse(200,{"Content-Type": "text/html"},htmlParts.join("\n"),"utf8");
	} else {
		response.writeHead(404);
		response.end();
	}
};

}());
