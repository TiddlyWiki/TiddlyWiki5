// Cook a TiddlyWiki recipe and send it to STDOUT
//
// Usage: node cook.js <recipefile>

/*global require: false, exports: false */
"use strict";

var WikiStore = require("./js/WikiStore.js").WikiStore,
	Recipe = require("./js/Recipe.js").Recipe,
	util = require("util");

var filename = process.argv[2];

var store = new WikiStore();

var theRecipe = new Recipe(store,filename,function() {
	process.stdout.write(theRecipe.cook());
});
