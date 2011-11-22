// Cook a TiddlyWiki recipe and serve the result over HTTP
//
// Usage: node server.js <recipefile>

var tiddlywiki = require("./js/TiddlyWiki.js"),
	recipe = require("./js/Recipe.js"),
	sys = require("sys"),
	http = require("http"),
	fs = require("fs"),
	url = require("url"),
	path = require("path");

var filename = process.argv[2];

http.createServer(function (request, response) {
	response.writeHead(200, {"Content-Type": "text/html"});
	var store = new tiddlywiki.TiddlyWiki();
	var theRecipe = new recipe.Recipe(store,filename);
	response.end(theRecipe.cook(), "utf-8");
}).listen(8000);

sys.puts("Server running at http://127.0.0.1:8000/");
