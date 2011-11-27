// Break apart a TiddlyWiki HTML file into separate .tid files
//
// Usage: node ginsu.js <tiddlywikifile> <outputdir>
//
// The .html extension is optional
//
// Ginsu creates the specified places the .tid files in the specified directory (which must already exist)
var sys = require("sys"),
	fs = require("fs"),
	path = require("path"),
	Tiddler = require("./js/Tiddler.js").Tiddler,
	tiddlyWikiInput = require("./js/TiddlyWikiInput.js"),
	tiddlerOutput = require("./js/TiddlerOutput.js");

var tiddlywikifilename = process.argv[2];
var outputdir = process.argv[3];

var tiddlywikidoc = fs.readFileSync(tiddlywikifilename,"utf8");
var tiddlers = tiddlyWikiInput.parseTiddlyWiki(tiddlywikidoc);

var recipe = [];
for(var t=0; t<tiddlers.length; t++) {
	var tid = new Tiddler(tiddlers[t]);
	var filename = encodeURIComponent(tid.fields.title.replace(/ /g,"_")) + ".tid";
	fs.writeFileSync(path.join(outputdir,filename),tiddlerOutput.outputTiddler(tid));
	recipe.push("tiddler: " + filename + "\n");
}

fs.writeFileSync(path.join(outputdir,"split.recipe"),recipe.join(""));

