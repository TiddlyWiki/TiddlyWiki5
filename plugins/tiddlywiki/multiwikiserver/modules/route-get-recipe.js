/*\
title: $:/plugins/tiddlywiki/multiwikiserver/route-get-recipe.js
type: application/javascript
module-type: route

GET /wikis/:recipe_name

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/wiki\/([^\/]+)$/;

exports.handler = function(request,response,state) {
	// Get the recipe name from the parameters
	var recipe_name = $tw.utils.decodeURIComponentSafe(state.params[0]);
	// Check request is valid
	if(recipe_name) {
		// Start the response
		response.writeHead(200, "OK",{
			"Content-Type": "text/html"
		});
		// Get the tiddlers in the recipe
		var recipeTiddlers = $tw.sqlTiddlerStore.getRecipeTiddlers(recipe_name);
		// Render the template
		var template = $tw.sqlTiddlerStore.adminWiki.renderTiddler("text/plain","$:/core/templates/tiddlywiki5.html",{
			variables: {
				saveTiddlerFilter: `
					$:/boot/boot.css
					$:/boot/boot.js
					$:/boot/bootprefix.js
					$:/core
					$:/library/sjcl.js
					$:/plugins/tiddlywiki/tiddlyweb
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
		response.write(template.substring(0,markerPos + marker.length));
		$tw.utils.each(recipeTiddlers,function(recipeTiddlerInfo) {
			var tiddlerInfo = $tw.sqlTiddlerStore.getRecipeTiddler(recipeTiddlerInfo.title,recipe_name);
			if((tiddlerInfo.tiddler.text || "").length > 10 * 1024 * 1024) {
				response.write(JSON.stringify(Object.assign({},tiddlerInfo.tiddler,{
					revision: "0",
					bag: recipeTiddlerInfo.bag_name,
					text: undefined,
					_canonical_uri: `/wiki/${recipe_name}/recipes/${recipe_name}/tiddlers/${title}`
				})));
			} else {
				response.write(JSON.stringify(Object.assign({},tiddlerInfo.tiddler,{
					revision: "0",
					bag: recipeTiddlerInfo.bag_name
				})));
			}
			response.write(",")
		});
		response.write(JSON.stringify({title: "$:/config/tiddlyweb/host",text: "$protocol$//$host$$pathname$/"}));
		response.write(",")
		response.write(template.substring(markerPos + marker.length))
		// Finish response
		response.end();
	} else {
		response.writeHead(404);
		response.end();
	}
};

}());
