/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/manage-acl.js
type: application/javascript
module-type: mws-route

GET /admin/manage-acl

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/admin\/manage-acl\/(.+)$/;

exports.handler = function(request, response, state) {
	var params = state.params[0].split("/")
	var recipeName = params[0];
	var bagName = params[params.length - 1];

	var recipes = state.server.sqlTiddlerDatabase.listRecipes()
	var bags = state.server.sqlTiddlerDatabase.listBags()

	var recipe = recipes.find((entry) => entry.recipe_name === recipeName && entry.bag_names.includes(bagName))
	var bag = bags.find((entry) => entry.bag_name === bagName);

	if (!recipe || !bag) {
		response.writeHead(500, "Unable to handle request", {"Content-Type": "text/html"});
		response.end();
		return;
	}

	var roles = state.server.sqlTiddlerDatabase.listRoles();

	response.writeHead(200, "OK", {"Content-Type": "text/html"});

	var html = $tw.mws.store.adminWiki.renderTiddler("text/plain", "$:/plugins/tiddlywiki/multiwikiserver/templates/page", {
		variables: {
			"page-content": "$:/plugins/tiddlywiki/multiwikiserver/templates/manage-acl",
			"roles-list": JSON.stringify(roles),
			"bag": JSON.stringify(bag),
			"recipe": JSON.stringify(recipe),
			"username": state.authenticatedUser ? state.authenticatedUser.username : "Guest",
			"user-is-admin": state.authenticatedUser && state.authenticatedUser.isAdmin ? "yes" : "no"
		}
	});
	response.write(html);
	response.end();
};

}());