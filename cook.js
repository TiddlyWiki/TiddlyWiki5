// Cook a TiddlyWiki recipe and send it to STDOUT
//
// Usage: node cook.js <recipefile>

var sys = require("sys"),
	tiddlywiki = require("./js/TiddlyWiki.js"),
	recipe = require("./js/Recipe.js");

var filename = process.argv[2];

var store = new tiddlywiki.TiddlyWiki();

var theRecipe = new recipe.Recipe(store,filename);

console.log(theRecipe.cook());
