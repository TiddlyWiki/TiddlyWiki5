// Cook a TiddlyWiki recipe and serve the result over HTTP
//
// Usage: node server.js <recipefile>

var TiddlyWiki = require("./js/TiddlyWiki.js").TiddlyWiki,
	Recipe = require("./js/Recipe.js").Recipe,
	sys = require("sys"),
	http = require("http"),
	fs = require("fs"),
	url = require("url"),
	path = require("path");

var filename = process.argv[2];

http.createServer(function(request, response) {
	response.writeHead(200, {"Content-Type": "text/html"});
	var store = new TiddlyWiki(),
		theRecipe = new Recipe(store,filename,function() {
			response.end(theRecipe.cook(), "utf-8");	
		});
}).listen(8000);

sys.puts("Server running at http://127.0.0.1:8000/");
