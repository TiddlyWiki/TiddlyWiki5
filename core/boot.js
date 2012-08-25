/*\
title: $:/core/boot.js
type: application/javascript

The main boot kernel for TiddlyWiki. This single file creates a barebones TW environment that is just
sufficient to bootstrap the modules containing the main logic of the application.

On the server this file is executed directly to boot TiddlyWiki. In the browser, this file is packed
into a single HTML file along with other elements:

# bootprefix.js
# <module definitions>
# boot.js

The module definitions on the browser look like this:

	$tw.defineModule("MyModule","moduletype",function(module,exports,require) {
	// Module code inserted here
	return exports;
	});

In practice, each module is wrapped in a separate script block.

\*/
(function() {

/*jslint node: true, browser: true */
/*global modules: false, $tw: false */
"use strict";

/////////////////////////// Setting up $tw

// Set up $tw global for the server
if(typeof(window) === "undefined" && !global.$tw) {
	global.$tw = {}; // No `browser` member for the server
	exports.$tw = $tw;
}

// Boot information
$tw.boot = {};

// Server initialisation
var fs, path, vm;
if(!$tw.browser) {
	// Standard node libraries
	fs = require("fs");
	path = require("path");
	vm = require("vm");
	// System paths and filenames
	$tw.boot.bootFile = path.basename(module.filename);
	$tw.boot.bootPath = path.dirname(module.filename);
	$tw.boot.wikiPath = process.cwd();
	// Read package info
	$tw.packageInfo = JSON.parse(fs.readFileSync($tw.boot.bootPath + "/../package.json"));
	// Check node version number
	var targetVersion = $tw.packageInfo.engine.node.substr(2).split("."),
		currVersion = process.version.substr(1).split(".");
	//remove -pre, -alpha, -beta etc from patch
	currVersion[2] = currVersion[2].split("-", 1);
	if((targetVersion[0]*10000 + targetVersion[0]*100 + targetVersion[0]) > (currVersion[0]*10000 + currVersion[0]*100 + currVersion[0])) {
		throw "TiddlyWiki5 requires node.js version " + $tw.packageInfo.engine.node + " have " + currVersion[0] + ";" + currVersion[1] + ";" + currVersion[2];
	}
}

// Modules store registers all the modules the system has seen
$tw.modules = $tw.modules || {};
$tw.modules.titles = $tw.modules.titles || {}; // hashmap by module title of {fn:, exports:, moduleType:}
$tw.modules.types = $tw.modules.types || {}; // hashmap by module type of array of exports

// Config object
$tw.config = $tw.config || {};

// Constants
$tw.config.root = $tw.config.root || "$:"; // Root for module titles (eg, "$:/core/boot.js")
$tw.config.bootModuleSubDir = $tw.config.bootModuleSubDir || "./modules";
$tw.config.wikiPluginsSubDir = $tw.config.wikiPluginsSubDir || "./plugins";
$tw.config.wikiShadowsSubDir = $tw.config.wikiShadowsSubDir || "./wiki";
$tw.config.wikiTiddlersSubDir = $tw.config.wikiTiddlersSubDir || "./tiddlers";

$tw.config.jsModuleHeaderRegExpString = "^\\/\\*\\\\\\n((?:^[^\\n]*\\n)+?)(^\\\\\\*\\/$\\n?)"

// File extension mappings
$tw.config.fileExtensionInfo = {
	".tid": {type: "application/x-tiddler"},
	".tiddler": {type: "application/x-tiddler-html-div"},
	".recipe": {type: "application/x-tiddlywiki-recipe"},
	".txt": {type: "text/plain"},
	".css": {type: "text/css"},
	".html": {type: "text/html"},
	".js": {type: "application/javascript"},
	".json": {type: "application/json"},
	".jpg": {type: "image/jpeg"},
	".jpeg": {type: "image/jpeg"},
	".png": {type: "image/png"},
	".gif": {type: "image/gif"},
	".svg": {type: "image/svg+xml"}
};

// Content type mappings
$tw.config.contentTypeInfo = {
	"application/x-tiddler": {encoding: "utf8"},
	"application/x-tiddler-html-div": {encoding: "utf8"},
	"application/x-tiddlywiki-recipe": {encoding: "utf8"},
	"text/plain": {encoding: "utf8"},
	"text/css": {encoding: "utf8"},
	"text/html": {encoding: "utf8"},
	"application/javascript": {encoding: "utf8"},
	"application/json": {encoding: "utf8"},
	"image/jpeg": {encoding: "base64"},
	"image/png": {encoding: "base64"},
	"image/gif": {encoding: "base64"},
	"image/svg+xml": {encoding: "utf8"}
};

/////////////////////////// Utility functions

$tw.utils = $tw.utils || {};

/*
Determine if a value is an array
*/
$tw.utils.isArray = function(value) {
	return Object.prototype.toString.call(value) == "[object Array]";
};

// Convert "&amp;" to &, "&lt;" to <, "&gt;" to > and "&quot;" to "
$tw.utils.htmlDecode = function(s) {
	return s.toString().replace(/&lt;/mg,"<").replace(/&gt;/mg,">").replace(/&quot;/mg,"\"").replace(/&amp;/mg,"&");
};

/*
Pad a string to a given length with "0"s. Length defaults to 2
*/
$tw.utils.pad = function(value,length) {
	length = length || 2;
	var s = value.toString();
	if(s.length < length) {
		s = "000000000000000000000000000".substr(0,length - s.length) + s;
	}
	return s;
};

// Convert a date into YYYYMMDDHHMM format
$tw.utils.stringifyDate = function(value) {
	return value.getUTCFullYear() +
			$tw.utils.pad(value.getUTCMonth() + 1) +
			$tw.utils.pad(value.getUTCDate()) + 
			$tw.utils.pad(value.getUTCHours()) + 
			$tw.utils.pad(value.getUTCMinutes());
};

// Parse a date from a YYYYMMDDHHMMSSMMM format string
$tw.utils.parseDate = function(value) {
	if(typeof value === "string") {
		return new Date(Date.UTC(parseInt(value.substr(0,4),10),
				parseInt(value.substr(4,2),10)-1,
				parseInt(value.substr(6,2),10),
				parseInt(value.substr(8,2)||"00",10),
				parseInt(value.substr(10,2)||"00",10),
				parseInt(value.substr(12,2)||"00",10),
				parseInt(value.substr(14,3)||"000",10)));
	} else if (value instanceof Date) {
		return value;
	} else {
		return null;
	}
};

// Parse a string array from a bracketted list
$tw.utils.parseStringArray = function(value) {
	if(typeof value === "string") {
		var memberRegExp = /(?:\[\[([^\]]+)\]\])|([^\s]+)/mg,
			results = [],
			match;
		do {
			match = memberRegExp.exec(value);
			if(match) {
				results.push(match[1] || match[2]);
			}
		} while(match);
		return results;
	} else if ($tw.utils.isArray(value)) {
		return value;
	} else {
		return null;
	}
};

// Parse a block of name:value fields. The `fields` object is used as the basis for the return value
$tw.utils.parseFields = function(text,fields) {
	text.split(/\r?\n/mg).forEach(function(line) {
		var p = line.indexOf(":");
		if(p !== -1) {
			var field = line.substr(0, p).trim(),
				value = line.substr(p+1).trim();
			fields[field] = value;
		}
	});
	return fields;
};

/*
Resolves a source filepath delimited with `/` relative to a specified absolute root filepath.
In relative paths, the special folder name `..` refers to immediate parent directory, and the
name `.` refers to the current directory
*/
$tw.utils.resolvePath = function(sourcepath,rootpath) {
	// If the source path starts with ./ or ../ then it is relative to the root
	if(sourcepath.substr(0,2) === "./" || sourcepath.substr(0,3) === "../" ) {
		var src = sourcepath.split("/"),
			root = rootpath.split("/");
		// Remove the filename part of the root
		root.splice(root.length-1,1);
		// Process the source path bit by bit onto the end of the root path
		while(src.length > 0) {
			var c = src.shift();
			if(c === "..") { // Slice off the last root entry for a double dot
				if(root.length > 0) {
					root.splice(root.length-1,1);
				}
			} else if(c !== ".") { // Ignore dots
				root.push(c); // Copy other elements across
			}
		}
		return root.join("/");
	} else {
		// If it isn't relative, just return the path
		return sourcepath;
	}
};

/////////////////////////// Module mechanism

/*
Register a single module in the $tw.modules.types hashmap
*/
$tw.modules.registerTypedModule = function(name,moduleType,moduleExports) {
	if(!(moduleType in $tw.modules.types)) {
		$tw.modules.types[moduleType] = [];
	}
	$tw.modules.types[moduleType].push(moduleExports);
};

/*
Register all the module tiddlers that have a module type
*/
$tw.modules.registerTypedModules = function() {
	var title, tiddler;
	// Execute and register any modules from plugins
	for(title in $tw.wiki.pluginTiddlers) {
		tiddler = $tw.wiki.getTiddler(title);
		if(!(title in $tw.wiki.tiddlers)) {
			if(tiddler.fields.type === "application/javascript" && tiddler.fields["module-type"] !== undefined) {
				// Execute the module
				var source = [
					"(function(module,exports,require) {",
					tiddler.fields.text,
					"})"
				];
				$tw.modules.define(tiddler.fields.text,tiddler.fields["module-type"],window.eval(source.join("")));
				// Register the module
				$tw.modules.registerTypedModule(title,tiddler.fields["module-type"],$tw.modules.execute(title));
			}
		}
	}
	// Register any modules in ordinary tiddlers
	for(title in $tw.wiki.tiddlers) {
		tiddler = $tw.wiki.getTiddler(title);
		if(tiddler.fields.type === "application/javascript" && tiddler.fields["module-type"] !== undefined) {
			$tw.modules.registerTypedModule(title,tiddler.fields["module-type"],$tw.modules.execute(title));
		}
	}
};

/*
Get all the modules of a particular type in a hashmap by their `name` field
*/
$tw.modules.getModulesByTypeAsHashmap = function(moduleType,nameField) {
	nameField = nameField || "name";
	var modules = $tw.modules.types[moduleType],
		results = {};
	if(modules) {
		for(var t=0; t<modules.length; t++) {
			results[modules[t][nameField]] =  modules[t];
		}
	}
	return results;
};

/*
Apply the exports of the modules of a particular type to a target object
*/
$tw.modules.applyMethods = function(moduleType,object) {
	var modules = $tw.modules.types[moduleType],
		n,m,f;
	if(modules) {
		for(n=0; n<modules.length; n++) {
			m = modules[n];
			for(f in m) {
				object[f] = m[f];
			}
		}
	}
};

/////////////////////////// Barebones tiddler object

/*
Construct a tiddler object from a hashmap of tiddler fields. If multiple hasmaps are provided they are merged,
taking precedence to the right
*/
$tw.Tiddler = function(/* [fields,] fields */) {
	this.fields = {};
	for(var c=0; c<arguments.length; c++) {
		var arg = arguments[c],
			src = (arg instanceof $tw.Tiddler) ? arg.fields : arg;
		for(var t in src) {
			if(src[t] === undefined) {
				if(t in this.fields) {
					delete this.fields[t]; // If we get a field that's undefined, delete any previous field value
				}
			} else {
				// Parse the field with the associated field module (if any)
				var fieldModule = $tw.Tiddler.fieldModules[t];
				if(fieldModule) {
					this.fields[t] = fieldModule.parse.call(this,src[t]);
				} else {
					this.fields[t] = src[t];
				}
			}
		}
	}
};

/*
Hashmap of field modules by field name
*/
$tw.Tiddler.fieldModules = {};

/*
Register and install the built in tiddler field modules
*/
$tw.modules.registerTypedModule($tw.config.root + "/kernel/tiddlerfields/modified","tiddlerfield",{
	name: "modified",
	parse: $tw.utils.parseDate,
	stringify: $tw.utils.stringifyDate
});
$tw.modules.registerTypedModule($tw.config.root + "/kernel/tiddlerfields/created","tiddlerfield",{
	name: "created",
	parse: $tw.utils.parseDate,
	stringify: $tw.utils.stringifyDate
});
$tw.modules.registerTypedModule($tw.config.root + "/kernel/tiddlerfields/tags","tiddlerfield",{
	name: "tags",
	parse: $tw.utils.parseStringArray,
	stringify: function(value) {
		var result = [];
		for(var t=0; t<value.length; t++) {
			if(value[t].indexOf(" ") !== -1) {
				result.push("[[" + value[t] + "]]");
			} else {
				result.push(value[t]);
			}
		}
		return result.join(" ");
	}
});
// Install built in tiddler fields module so that they are available immediately
$tw.Tiddler.fieldModules = $tw.modules.getModulesByTypeAsHashmap("tiddlerfield");

/////////////////////////// Barebones wiki store

/*
Construct a wiki store object
*/
$tw.Wiki = function() {
	this.tiddlers = {};
};

$tw.Wiki.prototype.addTiddler = function(tiddler,isShadow) {
	if(!(tiddler instanceof $tw.Tiddler)) {
		tiddler = new $tw.Tiddler(tiddler);
	}
	if(isShadow) {
		tiddler.isShadow = true;
	}
	this.tiddlers[tiddler.fields.title] = tiddler;
};

$tw.Wiki.prototype.addTiddlers = function(tiddlers,isShadow) {
	for(var t=0; t<tiddlers.length; t++) {
		this.addTiddler(tiddlers[t],isShadow);
	}	
};

/*
Install tiddlers contained in plugin tiddlers
*/
$tw.Wiki.prototype.installPlugins = function() {
	this.plugins = {}; // Hashmap of plugin information by title
	this.pluginTiddlers = {}; // Hashmap of constituent tiddlers from plugins by title
	// Collect up all the plugin tiddlers
	for(var title in this.tiddlers) {
		var tiddler = this.tiddlers[title];
		if(tiddler.fields.type === "application/x-tiddlywiki-plugin") {
			// Save the plugin information
			var pluginInfo = this.plugins[title] = JSON.parse(tiddler.fields.text);
			// Extract the constituent tiddlers
			for(var t=0; t<pluginInfo.tiddlers.length; t++) {
				var constituentTiddler = pluginInfo.tiddlers[t];
				// Don't overwrite tiddlers that already exist
				if(!(constituentTiddler.title in this.pluginTiddlers)) {
					// Save the tiddler object
					this.pluginTiddlers[constituentTiddler.title] = new $tw.Tiddler(constituentTiddler);
				}
			}
		}
	}
};

$tw.Wiki.prototype.getTiddler = function(title) {
	var t = this.tiddlers[title];
	if(t instanceof $tw.Tiddler) {
		return t;
	} else if(title in this.pluginTiddlers) {
		return this.pluginTiddlers[title];
	} else {
		return null;
	}
};

/*
Hashmap of field modules by serializer name
*/
$tw.Wiki.tiddlerDeserializerModules = {};

/*
Extracts tiddlers from a typed block of text, specifying default field values
*/
$tw.Wiki.prototype.deserializeTiddlers = function(type,text,srcFields) {
	srcFields = srcFields || {};
	var deserializer = $tw.Wiki.tiddlerDeserializerModules[type],
		fields = {};
	if(!deserializer && $tw.config.fileExtensionInfo[type]) {
		// If we didn't find the serializer, try converting it from an extension to a content type
		type = $tw.config.fileExtensionInfo[type].type;
		deserializer = $tw.Wiki.tiddlerDeserializerModules[type];
	}
	if(!deserializer) {
		// If we still don't have a deserializer, treat it as plain text
		deserializer = $tw.Wiki.tiddlerDeserializerModules["text/plain"];
	}
	for(var f in srcFields) {
		fields[f] = srcFields[f];
	}
	if(deserializer) {
		return deserializer.call(this,text,fields);
	} else {
		// Return a raw tiddler for unknown types
		fields.text = text;
		return [fields];
	}
};

/*
Register the built in tiddler deserializer modules
*/
$tw.modules.registerTypedModule($tw.config.root + "/kernel/tiddlerdeserializer/js","tiddlerdeserializer",{
	"application/javascript": function(text,fields) {
		var headerCommentRegExp = new RegExp($tw.config.jsModuleHeaderRegExpString,"mg"),
			match = headerCommentRegExp.exec(text);
		fields.text = text;
		if(match) {
			fields = $tw.utils.parseFields(match[1].split(/\r?\n\r?\n/mg)[0],fields);
		}
		return [fields];
	}
});
$tw.modules.registerTypedModule($tw.config.root + "/kernel/tiddlerdeserializer/tid","tiddlerdeserializer",{
	"application/x-tiddler": function(text,fields) {
		var split = text.split(/\r?\n\r?\n/mg);
		if(split.length > 1) {
			fields = $tw.utils.parseFields(split[0],fields);
			fields.text = split.slice(1).join("\n\n");
		} else {
			fields.text = text;
		}
		return [fields];
	}
});
$tw.modules.registerTypedModule($tw.config.root + "/kernel/tiddlerdeserializer/txt","tiddlerdeserializer",{
	"text/plain": function(text,fields) {
		fields.text = text;
		fields.type = "text/plain";
		return [fields];
	}
});
$tw.modules.registerTypedModule($tw.config.root + "/kernel/tiddlerdeserializer/html","tiddlerdeserializer",{
	"text/html": function(text,fields) {
		fields.text = text;
		fields.type = "text/html";
		return [fields];
	}
});

// Install the tiddler deserializer modules so they are immediately available
$tw.modules.applyMethods("tiddlerdeserializer",$tw.Wiki.tiddlerDeserializerModules);

/////////////////////////// Intermediate initialisation

/*
Create the wiki store for the app
*/
$tw.wiki = new $tw.Wiki();

/////////////////////////// Browser definitions

if($tw.browser) {

/*
Execute the module named 'moduleName'. The name can optionally be relative to the module named 'moduleRoot'
*/
$tw.modules.execute = function(moduleName,moduleRoot) {
	var name = moduleRoot ? $tw.utils.resolvePath(moduleName,moduleRoot) : moduleName,
		require = function(modRequire) {
			return $tw.modules.execute(modRequire,name);
		},
		exports = {},
		module = $tw.modules.titles[name];
	if(!module) {
		throw new Error("Cannot find module named '" + moduleName + "' required by module '" + moduleRoot + "', resolved to " + name);
	}
	if(module.exports) {
		return module.exports;
	} else {
		module.exports = {};
		module.fn(module,module.exports,require);
		return module.exports;
	}
};

/*
Register a deserializer that can extract tiddlers from the DOM
*/
$tw.modules.registerTypedModule($tw.config.root + "/kernel/tiddlerdeserializer/dom","tiddlerdeserializer",{
	"(DOM)": function(node) {
		var extractTextTiddler = function(node) {
				var e = node.firstChild;
				while(e && e.nodeName.toLowerCase() !== "pre") {
					e = e.nextSibling;
				}
				var title = node.getAttribute ? node.getAttribute("title") : null;
				if(e && title) {
					var attrs = node.attributes,
						tiddler = {
							text: $tw.utils.htmlDecode(e.innerHTML)
						};
					for(var i=attrs.length-1; i >= 0; i--) {
						if(attrs[i].specified) {
							tiddler[attrs[i].name] = attrs[i].value;
						}
					}
					return tiddler;
				} else {
					return null;
				}
			},
			extractModuleTiddler = function(node) {
				if(node.hasAttribute && node.hasAttribute("data-tiddler-title")) {
					var text = node.innerHTML,
						s = text.indexOf("{"),
						e = text.lastIndexOf("}");
					if(node.hasAttribute("data-module") && s !== -1 && e !== -1) {
						text = text.substring(s+1,e);
					}
					var fields = {text: text},
						attributes = node.attributes;
					for(var a=0; a<attributes.length; a++) {
						if(attributes[a].nodeName.substr(0,13) === "data-tiddler-") {
							fields[attributes[a].nodeName.substr(13)] = attributes[a].nodeValue;
						}
					}
					return fields;
				} else {
					return null;
				}
			},
			t,tiddlers = [];
		for(t = 0; t < node.childNodes.length; t++) {
				var tiddler = extractTextTiddler(node.childNodes[t]);
				tiddler = tiddler || extractModuleTiddler(node.childNodes[t]);
				if(tiddler) {
					tiddlers.push(tiddler);
				}
		}
		return tiddlers;
	}
});
// Install the tiddler deserializer modules
$tw.modules.applyMethods("tiddlerdeserializer",$tw.Wiki.tiddlerDeserializerModules);

// Load the JavaScript system tiddlers from the DOM
$tw.wiki.addTiddlers($tw.wiki.deserializeTiddlers("(DOM)",document.getElementById("libraryModules")),true);
$tw.wiki.addTiddlers($tw.wiki.deserializeTiddlers("(DOM)",document.getElementById("modules")),true);
$tw.wiki.addTiddlers($tw.wiki.deserializeTiddlers("(DOM)",document.getElementById("bootKernelPrefix")),true);
$tw.wiki.addTiddlers($tw.wiki.deserializeTiddlers("(DOM)",document.getElementById("bootKernel")),true);
// Load the stylesheet tiddlers from the DOM
$tw.wiki.addTiddlers($tw.wiki.deserializeTiddlers("(DOM)",document.getElementById("styleArea")),true);
// Load the main store tiddlers from the DOM
$tw.wiki.addTiddlers($tw.wiki.deserializeTiddlers("(DOM)",document.getElementById("storeArea")));
// Load the shadow tiddlers from the DOM
$tw.wiki.addTiddlers($tw.wiki.deserializeTiddlers("(DOM)",document.getElementById("shadowArea")),true);

// End of if($tw.browser)
}

/////////////////////////// Server definitions

if(!$tw.browser) {

/*
Load the tiddlers contained in a particular file (and optionally the accompanying .meta file)
*/
$tw.loadTiddlersFromFile = function(file,fields,isShadow) {
	var ext = path.extname(file),
		extensionInfo = $tw.config.fileExtensionInfo[ext],
		typeInfo = extensionInfo ? $tw.config.contentTypeInfo[extensionInfo.type] : null,
		data = fs.readFileSync(file).toString(typeInfo ? typeInfo.encoding : "utf8"),
		tiddlers = $tw.wiki.deserializeTiddlers(ext,data,fields),
		metafile = file + ".meta";
	if(ext !== ".json" && tiddlers.length === 1 && fs.existsSync(metafile)) {
		var metadata = fs.readFileSync(metafile).toString("utf8");
		if(metadata) {
			tiddlers = [$tw.utils.parseFields(metadata,tiddlers[0])];
		}
	}
	$tw.wiki.addTiddlers(tiddlers,isShadow);
};

/*
Load all the tiddlers from a directory
*/
$tw.loadTiddlersFromFolder = function(filepath,basetitle,excludeRegExp,isShadow) {
	basetitle = basetitle || "$:/plugins";
	excludeRegExp = excludeRegExp || /^\.DS_Store$|.meta$/;
	if(fs.existsSync(filepath)) {
		var stat = fs.statSync(filepath);
		if(stat.isDirectory()) {
			var files = fs.readdirSync(filepath);
			// Look for a tiddlywiki.plugin file
			if(files.indexOf("tiddlywiki.plugin") !== -1) {
				// If so, process the files it describes
				var pluginInfo = JSON.parse(fs.readFileSync(filepath + "/tiddlywiki.plugin").toString("utf8"));
				for(var p=0; p<pluginInfo.tiddlers.length; p++) {
					var tidInfo = pluginInfo.tiddlers[p],
						typeInfo = $tw.config.contentTypeInfo[tidInfo.fields.type || "text/plain"],
						text = fs.readFileSync(path.resolve(filepath,tidInfo.file)).toString(typeInfo ? typeInfo.encoding : "utf8");
					$tw.wiki.addTiddler(new $tw.Tiddler({text: text},tidInfo.fields),isShadow);
				}
			} else {
				// If not, read all the files in the directory
				for(var f=0; f<files.length; f++) {
					var file = files[f];
					if(!excludeRegExp.test(file)) {
						$tw.loadTiddlersFromFolder(filepath + "/" + file,basetitle + "/" + file,excludeRegExp,isShadow);
					}
				}
			}
		} else if(stat.isFile()) {
			$tw.loadTiddlersFromFile(filepath,{title: basetitle},isShadow);
		}
	}
};

/*
Execute the module named 'moduleName'. The name can optionally be relative to the module named 'moduleRoot'
*/
$tw.modules.execute = function(moduleName,moduleRoot) {
	var name = moduleRoot ? $tw.utils.resolvePath(moduleName,moduleRoot) : moduleName,
		module = $tw.modules.titles[name],
		tiddler = $tw.wiki.getTiddler(name),
		sandbox = {
			module: module,
			exports: {},
			console: console,
			process: process,
			$tw: $tw,
			require: function(title) {
				return $tw.modules.execute(title,name);
			}
		};
	if(!tiddler || tiddler.fields.type !== "application/javascript") {
		// If there is no tiddler with that name, let node try to find it
		return require(moduleName);
	}
	// Define the module if it is not defined
	module = module || {
		moduleType: tiddler.fields["module-type"]
	};
	$tw.modules.titles[name] = module;
	// Execute it to get its exports if we haven't already done so
	if(!module.exports) {
		try {
			vm.runInNewContext(tiddler.fields.text,sandbox,tiddler.fields.title);
		} catch(e) {
			throw "Error executing boot module " + tiddler.fields.title + ":\n" + e;
		}
		module.exports = sandbox.exports;
	}
	// Return the exports of the module
	return module.exports;
};

// Load modules from the modules directory
$tw.loadTiddlersFromFolder(path.resolve($tw.boot.bootPath,$tw.config.bootModuleSubDir),null,null,true);

// Load up the shadow tiddlers in the root of the core directory
$tw.loadTiddlersFromFolder($tw.boot.bootPath,"$:/core",/^\.DS_Store$|.meta$|^modules$/,true);

// Load any plugins in the wiki plugins directory
$tw.loadTiddlersFromFolder(path.resolve($tw.boot.wikiPath,$tw.config.wikiPluginsSubDir),null,null,true);

// HACK: to be replaced when we re-establish sync plugins
// Load shadow tiddlers from wiki shadows directory
$tw.loadTiddlersFromFolder(path.resolve($tw.boot.wikiPath,$tw.config.wikiShadowsSubDir),null,null,true);
// Load tiddlers from wiki tiddlers directory
$tw.loadTiddlersFromFolder(path.resolve($tw.boot.wikiPath,$tw.config.wikiTiddlersSubDir));

// End of if(!$tw.browser)	
}

/////////////////////////// Final initialisation

// Install plugins
$tw.wiki.installPlugins();

// Register typed modules from the tiddlers we've just loaded
$tw.modules.registerTypedModules();

// Run any startup modules
var mainModules = $tw.modules.types.startup;
for(var m=0; m<mainModules.length; m++) {
	mainModules[m].startup.call($tw);
}

})();
