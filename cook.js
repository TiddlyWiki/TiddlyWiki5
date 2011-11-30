// Cook a TiddlyWiki recipe and send it to STDOUT
//
// Usage: node cook.js <recipefile>

"use strict";

var TiddlyWiki = require("./js/TiddlyWiki.js").TiddlyWiki,
	Recipe = require("./js/Recipe.js").Recipe,
	util = require("util");

var filename = process.argv[2];

var store = new TiddlyWiki();

var theRecipe = new Recipe(store,filename,function() {
	process.stdout.write(theRecipe.cook());
});
