/*

Recipe files consist of recipe lines consisting of a marker, a colon and the pathname of an ingredient:

marker: pathname

The pathname is interpreted relative to the directory containing the recipe file.

The special marker "recipe" is used to load a sub-recipe file.

The special marker "template" is used to identify the HTML template. The HTML template contains
markers in two different forms:

<!--@@marker@@-->
&lt;!--@@marker@@--&gt;

Recipe processing is in two parts. First the recipe file is parsed and the referenced files are loaded into tiddlers.
Second, the template is processed by replacing the markers with the text of the tiddlers indicated in the recipe file.

The recipe is parsed into the 'ingredients' hashmap like this:

this.ingredients = {
	"marker1": [Tiddler1,Tiddler2,Tiddler3,...],
	"marker2": [TiddlerA,TiddlerB,TiddlerC,...],
	....
};

*/

var tiddler = require("./Tiddler.js"),
	tiddlerUtils = require("./TiddlerUtils.js"),
	tiddlywiki = require("./TiddlyWiki.js"),
	fs = require("fs"),
	path = require("path"),
	util = require("util");

// Create a new Recipe object from the specified recipe file, storing the tiddlers in a specified TiddlyWiki store
var Recipe = function(store,filepath) {
	this.store = store; // Save a reference to the store
	this.ingredients = {}; // Hashmap of array of ingredients
	this.readRecipe(filepath); // Read the recipe file
}

// Specialised configuration and handlers for particular ingredient markers
var specialMarkers = {
	shadow: {
		readIngredientPostProcess: function(fields) {
			// Add ".shadow" to the name of shadow tiddlers
			fields.title = fields.title + ".shadow";
			return fields;
		}	
	}
};

// Process the contents of a recipe file
Recipe.prototype.readRecipe = function(filepath) {
	var dirname = path.dirname(filepath),
		me = this;
	fs.readFileSync(filepath,"utf8").split("\n").forEach(function(line) {
		var p = line.indexOf(":");
		if(p !== -1) {
			var marker = line.substr(0, p).trim(),
				value = line.substr(p+1).trim();
			if(marker === "recipe") {
				me.readRecipe(path.resolve(dirname,value));
			} else {
				var fields = me.readIngredient(dirname,value),
					postProcess = me.readIngredientPostProcess[marker];
				if(postProcess)
					fields = postProcess(fields);
				me.addIngredient(marker,fields);
			}
		}
	});
}

// Special post-processing required for certain ingredient types
Recipe.prototype.readIngredientPostProcess = {
	"shadow": function(fields) {
		// Add ".shadow" to the name of shadow tiddlers
		fields.title = fields.title + ".shadow";
		return fields;
	}	
};

Recipe.prototype.addIngredient = function(marker,tiddlerFields) {
	var ingredientTiddler = new tiddler.Tiddler(tiddlerFields);
	this.store.addTiddler(ingredientTiddler);
	if(marker in this.ingredients) {
		this.ingredients[marker].push(ingredientTiddler);
	} else {
		this.ingredients[marker] = [ingredientTiddler];
	}
}

// Read an ingredient file and return it as a hashmap of tiddler fields. Also read the .meta file, if present
Recipe.prototype.readIngredient = function(dirname,filepath) {
	var fullpath = path.resolve(dirname,filepath),
		extname = path.extname(filepath),
		basename = path.basename(filepath,extname),
		fields = {
			title: basename
		};
	// Read the tiddler file
	fields = tiddlerUtils.parseTiddler(fs.readFileSync(fullpath,"utf8"),extname,fields);
	// Check for the .meta file
	var metafile = fullpath + ".meta";
	if(path.existsSync(metafile)) {
		fields = tiddlerUtils.parseMetaDataBlock(fs.readFileSync(metafile,"utf8"),fields);
	}
	return fields;
}

// Return a string of the cooked recipe
Recipe.prototype.cook = function() {
	var template = this.ingredients.template ? this.ingredients.template[0].fields.text : "";
	var out = [];
	var me = this;
	template.split("\n").forEach(function(line) {
		var templateRegExp = /^(?:<!--@@(.*)@@-->)|(?:&lt;!--@@(.*)@@--&gt;)$/gi;
		var match = templateRegExp.exec(line);
		if(match) {
			var marker = match[1] === undefined ? match[2] : match[1];
			me.outputIngredient(out,marker);
		} else {
			out.push(line);
		}
	});
//	out.push("\nRecipe:\n" + util.inspect(this.ingredients,false,4));
	return out.join("\n");
}

// Output all the tiddlers in the recipe with a particular marker
Recipe.prototype.outputIngredient = function(out,marker) {
	var ingredient = this.ingredients[marker];
	var outputType = Recipe.ingredientOutputMapper[marker] || "raw";
	var outputter = Recipe.ingredientOutputter[outputType];
	if(outputter && ingredient) {
		outputter(out,ingredient);
	}
}

// Allows for specialised processing for certain markers
Recipe.ingredientOutputMapper = {
	tiddler: "div",
	js: "javascript",
	jsdeprecated: "javascript",
	jquery: "javascript",
	shadow: "shadow"
};

Recipe.ingredientOutputter = {
	raw: function(out,ingredient) {
		// The default is just to output the raw text of the tiddler, ignoring any metadata
		for(var t=0; t<ingredient.length; t++) {
			var tid = ingredient[t];
			// For compatibility with cook.rb, remove one trailing \n from tiddler
			var text = tid.fields.text;
			text = text.charAt(text.length-1) === "\n" ? text.substr(0,text.length-1) : text;
			out.push(text);
		}
	},
	div: function(out,ingredient) {
		// Ordinary tiddlers are output as a <DIV>
		for(var t=0; t<ingredient.length; t++) {
			var tid = ingredient[t];
			tiddlerUtils.outputTiddlerDiv(out,tid);
		}
	},
	javascript: function(out,ingredient) {
		// Lines starting with //# are removed from javascript tiddlers
		for(var t=0; t<ingredient.length; t++) {
			var tid = ingredient[t];
			var text = tid.fields.text;
			// For compatibility with cook.rb, remove one trailing \n from tiddler
			text = text.charAt(text.length-1) === "\n" ? text.substr(0,text.length-1) : text;
			var lines = text.split("\n");
			for(var line=0; line<lines.length; line++) {
				var commentRegExp = /^\s*\/\/#/gi;
				if(!commentRegExp.test(lines[line])) {
					out.push(lines[line]);	
				}
			}	
		}
	},
	shadow: function(out,ingredient) {
		// Shadows are output as a <DIV> with the the ".shadow" suffix removed from the title
		for(var t=0; t<ingredient.length; t++) {
			var tid = ingredient[t];
			var title = tid.fields.title;
			var tweakedTiddler;
			if(title.indexOf(".shadow") === title.length - 7) {
				tweakedTiddler = new tiddler.Tiddler(tid,{
					title: title.substr(0, title.length-7)
				});
			} else {
				tweakedTiddler = tid;
			}
			tiddlerUtils.outputTiddlerDiv(out,tweakedTiddler,{omitPrecedingLineFeed: true});
		}
	}
};

exports.Recipe = Recipe;

