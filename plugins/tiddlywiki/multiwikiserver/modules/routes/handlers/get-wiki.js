/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/get-wiki.js
type: application/javascript
module-type: mws-route

GET /wiki/:recipe_name

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/wiki\/([^\/]+)$/;

exports.handler = function(request,response,state) {
	// Get the recipe name from the parameters
	var recipe_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		recipeTiddlers = recipe_name && $tw.mws.store.getRecipeTiddlers(recipe_name);
	// Check request is valid
	if(recipe_name && recipeTiddlers) {
		// Start the response
		response.writeHead(200, "OK",{
			"Content-Type": "text/html"
		});
		// Get the tiddlers in the recipe
		// Render the template
		var template = $tw.mws.store.adminWiki.renderTiddler("text/plain","$:/core/templates/tiddlywiki5.html",{
			variables: {
				saveTiddlerFilter: `
					$:/boot/boot.css
					$:/boot/boot.js
					$:/boot/bootprefix.js
					$:/core
					$:/library/sjcl.js
					$:/plugins/tiddlywiki/multiwikiclient
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
		function writeTiddler(tiddlerFields) {
			response.write(JSON.stringify(tiddlerFields).replace(/</g,"\\u003c"));
			response.write(",\n");
		}
		response.write(template.substring(0,markerPos + marker.length));
		const bagInfo = {},
			revisionInfo = {};
		$tw.utils.each(recipeTiddlers,function(recipeTiddlerInfo) {
			var result = $tw.mws.store.getRecipeTiddler(recipeTiddlerInfo.title,recipe_name);
			if(result) {
				bagInfo[result.tiddler.title] = result.bag_name;
				revisionInfo[result.tiddler.title] = result.tiddler_id.toString();
				writeTiddler(result.tiddler);
			}
		});
		writeTiddler({
			title: "$:/state/multiwikiclient/tiddlers/bag",
			text: JSON.stringify(bagInfo),
			type: "application/json"
		});
		writeTiddler({
			title: "$:/state/multiwikiclient/tiddlers/revision",
			text: JSON.stringify(revisionInfo),
			type: "application/json"
		});
		writeTiddler({
			title: "$:/config/multiwikiclient/recipe",
			text: recipe_name
		});
		writeTiddler({
			title: "$:/state/multiwikiclient/recipe/last_tiddler_id",
			text: $tw.mws.store.getRecipeLastTiddlerId(recipe_name).toString()
		});
		response.write(template.substring(markerPos + marker.length))
		// Finish response
		response.end();
	} else {
		response.writeHead(404);
		response.end();
	}
};

}());
