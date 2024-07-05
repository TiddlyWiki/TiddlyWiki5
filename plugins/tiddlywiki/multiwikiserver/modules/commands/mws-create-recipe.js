/*\
title: $:/plugins/tiddlywiki/multiwikiserver/commands/mws-create-recipe.js
type: application/javascript
module-type: command

Command to load archive of recipes, bags and tiddlers from a directory

--mws-create-recipe <name> <bag-list> <description>

The parameter "bag-list" should be a space delimited list of bags

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "mws-create-recipe",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this;
	// Check parameters
	if(this.params.length < 1) {
		return "Missing recipe name";
	}
	var recipeName = this.params[0],
		bagList = (this.params[1] || "").split(" "),
		recipeDescription = this.params[2] || recipeNameName;
	// Create recipe
	var result = $tw.mws.store.createRecipe(recipeName,bagList,recipeDescription);
	if(result) {
		return result.message;
	} else {
		return null;
	}
};

exports.Command = Command;

})();
