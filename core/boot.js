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
	exports.$tw = $tw; // Export $tw for when boot.js is required directly in node.js
}

// Crypto helper object

// Setup crypto
var Crypto = function() {
	var password = null,
		callSjcl = function(method,inputText) {
			var outputText;
			if(!password) {
				getPassword();
			}
			try {
				outputText = $tw.crypto.sjcl[method](password,inputText);
			} catch(ex) {
				console.log("Crypto error:" + ex);
				outputText = null;	
			}
			return outputText;
		},
		getPassword = function() {
			if($tw.browser) {
				password = window.prompt("Enter password to decrypt TiddlyWiki");
			}
		};

	this.setPassword = function(newPassword) {
		password = newPassword;
	};
	this.encrypt = function(text) {
		return callSjcl("encrypt",text);
	};
	this.decrypt = function(text) {
		return callSjcl("decrypt",text);
	};
};
$tw.crypto = new Crypto();

$tw.crypto.sjcl = $tw.browser ? window.sjcl : require("./sjcl.js");

// Boot information
$tw.boot = {};

// Plugin state
$tw.plugins = {};

// Modules store registers all the modules the system has seen
$tw.modules = $tw.modules || {};
$tw.modules.titles = $tw.modules.titles || {}; // hashmap by module title of {fn:, exports:, moduleType:}
$tw.modules.types = $tw.modules.types || {}; // hashmap by module type of array of exports

// Config object
$tw.config = $tw.config || {};

// Constants
$tw.config.pluginsPath = "../plugins/";
$tw.config.wikiInfo = $tw.config.wikiInfo || "./tiddlywiki.info";
$tw.config.wikiPluginsSubDir = $tw.config.wikiPluginsSubDir || "./plugins";
$tw.config.wikiShadowsSubDir = $tw.config.wikiShadowsSubDir || "./wiki";
$tw.config.wikiTiddlersSubDir = $tw.config.wikiTiddlersSubDir || "./tiddlers";

$tw.config.jsModuleHeaderRegExpString = "^\\/\\*\\\\\\n((?:^[^\\n]*\\n)+?)(^\\\\\\*\\/$\\n?)";

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
	".pdf": {type: "application/pdf"},
	".jpg": {type: "image/jpeg"},
	".jpeg": {type: "image/jpeg"},
	".png": {type: "image/png"},
	".gif": {type: "image/gif"},
	".svg": {type: "image/svg+xml"}
};

// Content type mappings
$tw.config.contentTypeInfo = {
	"text/x-tiddlywiki": {encoding: "utf8", extension: ".tid"},
	"application/x-tiddler": {encoding: "utf8", extension: ".tid"},
	"application/x-tiddler-html-div": {encoding: "utf8", extension: ".tiddler"},
	"application/x-tiddlywiki-recipe": {encoding: "utf8", extension: ".recipe"},
	"text/plain": {encoding: "utf8", extension: ".txt"},
	"text/css": {encoding: "utf8", extension: ".css"},
	"text/html": {encoding: "utf8", extension: ".html"},
	"application/javascript": {encoding: "utf8", extension: ".js"},
	"application/json": {encoding: "utf8", extension: ".json"},
	"application/pdf": {encoding: "base64", extension: ".pdf"},
	"image/jpeg": {encoding: "base64", extension: ".jpg"},
	"image/png": {encoding: "base64", extension: ".png"},
	"image/gif": {encoding: "base64", extension: ".gif"},
	"image/svg+xml": {encoding: "utf8", extension: ".svg"}
};

/////////////////////////// Utility functions

$tw.utils = $tw.utils || {};

/*
Check if an object has a property
*/
$tw.utils.hop = function(object,property) {
	return Object.prototype.hasOwnProperty.call(object,property);
};

/*
Determine if a value is an array
*/
$tw.utils.isArray = function(value) {
	return Object.prototype.toString.call(value) == "[object Array]";
};

/*
Convert "&amp;" to &, "&lt;" to <, "&gt;" to > and "&quot;" to "
*/
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

// Parse a string array from a bracketted list. For example "OneTiddler [[Another Tiddler]] LastOne"
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

/*
Returns true if the `actual` version is greater than or equal to the `required` version. Both are in `x.y.z` format.
*/
$tw.utils.checkVersions = function(required,actual) {
	var targetVersion = required.split("."),
		currVersion = actual.split("."),
		diff = [parseInt(targetVersion[0],10) - parseInt(currVersion[0],10),
				parseInt(targetVersion[1],10) - parseInt(currVersion[1],10),
				parseInt(targetVersion[2],10) - parseInt(currVersion[2],10)];
	return (diff[0] > 0) ||
		(diff[0] === 0 && diff[1] > 0) ||
		(diff[0] === 0 && diff[1] === 0 && diff[2] > 0);
};

/////////////////////////// Server initialisation

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
	if($tw.utils.checkVersions($tw.packageInfo.engine.node.substr(2),process.version.substr(1))) {
		throw "TiddlyWiki5 requires node.js version " + $tw.packageInfo.engine.node;
	}
}

/////////////////////////// Module mechanism

/*
Register the exports of a single module in the $tw.modules.types hashmap
*/
$tw.modules.registerModuleExports = function(name,moduleType,moduleExports) {
	if(!$tw.utils.hop($tw.modules.types,moduleType)) {
		$tw.modules.types[moduleType] = [];
	}
	$tw.modules.types[moduleType].push(moduleExports);
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

$tw.Tiddler.prototype.hasField = function(field) {
	return $tw.utils.hop(this.fields,field);
};
/*
Hashmap of field modules by field name
*/
$tw.Tiddler.fieldModules = {};

/*
Register and install the built in tiddler field modules
*/
$tw.modules.registerModuleExports("$:/boot/tiddlerfields/modified","tiddlerfield",{
	name: "modified",
	parse: $tw.utils.parseDate,
	stringify: $tw.utils.stringifyDate
});
$tw.modules.registerModuleExports("$:/boot/tiddlerfields/created","tiddlerfield",{
	name: "created",
	parse: $tw.utils.parseDate,
	stringify: $tw.utils.stringifyDate
});
$tw.modules.registerModuleExports("$:/boot/tiddlerfields/tags","tiddlerfield",{
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

$tw.Wiki.prototype.addTiddler = function(tiddler) {
	if(!(tiddler instanceof $tw.Tiddler)) {
		tiddler = new $tw.Tiddler(tiddler);
	}
	this.tiddlers[tiddler.fields.title] = tiddler;
};

$tw.Wiki.prototype.addTiddlers = function(tiddlers) {
	for(var t=0; t<tiddlers.length; t++) {
		this.addTiddler(tiddlers[t]);
	}	
};

/*
Extract constituent tiddlers from bundle tiddlers so that we can easily access them in getTiddler()
*/
$tw.Wiki.prototype.unpackBundleTiddlers = function() {
	this.bundles = {}; // Hashmap of plugin information by title
	this.bundledTiddlers = {}; // Hashmap of constituent tiddlers from plugins by title
	// Collect up all the plugin tiddlers
	for(var title in this.tiddlers) {
		var tiddler = this.tiddlers[title];
		if(tiddler.fields.type === "application/json" && tiddler.hasField("bundle")) {
			// Save the bundle information
			var bundleInfo = this.bundles[title] = JSON.parse(tiddler.fields.text);
			// Extract the constituent tiddlers
			for(var t in bundleInfo.tiddlers) {
				var constituentTiddler = bundleInfo.tiddlers[t],
					constituentTitle = bundleInfo.title + "/" + t;
				// Don't overwrite tiddlers that already exist
				if(!(constituentTitle in this.bundledTiddlers)) {
					// Save the tiddler object
					this.bundledTiddlers[constituentTitle] = new $tw.Tiddler(constituentTiddler,{title: constituentTitle});
				}
			}
		}
	}
};

/*
Register all the module tiddlers that have a module type
*/
$tw.Wiki.prototype.registerModuleTiddlers = function() {
	/*jslint evil: true */
	var title, tiddler;
	// If in the browser, define any modules from bundles
	if($tw.browser) {
		for(title in $tw.wiki.bundledTiddlers) {
			if($tw.utils.hop($tw.wiki.bundledTiddlers,title)) {
				tiddler = $tw.wiki.getTiddler(title);
				if(!$tw.utils.hop($tw.wiki.tiddlers,title)) {
					if(tiddler.fields.type === "application/javascript" && tiddler.hasField("module-type")) {
						// Define the module
						var source = [
							"(function(module,exports,require) {",
							tiddler.fields.text,
							"})"
						];
						$tw.modules.define(tiddler.fields.title,tiddler.fields["module-type"],window["eval"](source.join("")));
					}
				}
			}
		}
	}
	// Register and execute any modules from bundles
	for(title in $tw.wiki.bundledTiddlers) {
		if($tw.utils.hop($tw.wiki.bundledTiddlers,title)) {
			tiddler = $tw.wiki.getTiddler(title);
			if(!$tw.utils.hop($tw.wiki.tiddlers,title)) {
				if(tiddler.fields.type === "application/javascript" && tiddler.hasField("module-type")) {
					// Execute and register the module
					$tw.modules.registerModuleExports(title,tiddler.fields["module-type"],$tw.modules.execute(title));
				}
			}
		}
	}
	// Register and execute any modules in ordinary tiddlers
	for(title in $tw.wiki.tiddlers) {
		if($tw.utils.hop($tw.wiki.tiddlers,title)) {
			tiddler = $tw.wiki.getTiddler(title);
			if(tiddler.fields.type === "application/javascript" && tiddler.hasField("module-type")) {
				$tw.modules.registerModuleExports(title,tiddler.fields["module-type"],$tw.modules.execute(title));
			}
		}
	}
};

$tw.Wiki.prototype.getTiddler = function(title) {
	var t = this.tiddlers[title];
	if(t instanceof $tw.Tiddler) {
		return t;
	} else if($tw.utils.hop(this.bundledTiddlers,title)) {
		return this.bundledTiddlers[title];
	} else {
		return null;
	}
};

/*
Hashmap of serializer modules by serializer name
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
$tw.modules.registerModuleExports("$:/boot/tiddlerdeserializer/js","tiddlerdeserializer",{
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
$tw.modules.registerModuleExports("$:/boot/tiddlerdeserializer/tid","tiddlerdeserializer",{
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
$tw.modules.registerModuleExports("$:/boot/tiddlerdeserializer/txt","tiddlerdeserializer",{
	"text/plain": function(text,fields) {
		fields.text = text;
		fields.type = "text/plain";
		return [fields];
	}
});
$tw.modules.registerModuleExports("$:/boot/tiddlerdeserializer/html","tiddlerdeserializer",{
	"text/html": function(text,fields) {
		fields.text = text;
		fields.type = "text/html";
		return [fields];
	}
});
$tw.modules.registerModuleExports("$:/boot/tiddlerdeserializer/json","tiddlerdeserializer",{
	"application/json": function(text,fields) {
		var tiddlers = JSON.parse(text);
		return tiddlers;
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
$tw.modules.registerModuleExports("$:/boot/tiddlerdeserializer/dom","tiddlerdeserializer",{
	"(DOM)": function(node) {
		var extractTextTiddlers = function(node) {
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
						tiddler[attrs[i].name] = attrs[i].value;
					}
					return [tiddler];
				} else {
					return null;
				}
			},
			extractModuleTiddlers = function(node) {
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
							fields[attributes[a].nodeName.substr(13)] = attributes[a].value;
						}
					}
					return [fields];
				} else {
					return null;
				}
			},
			extractEncryptedTiddlers = function(node) {
				if(node.hasAttribute && node.hasAttribute("data-tw-encrypted-tiddlers")) {
					var e = node.firstChild;
					while(e && e.nodeName.toLowerCase() !== "pre") {
						e = e.nextSibling;
					}
					var jsonTiddlers = JSON.parse($tw.crypto.decrypt($tw.utils.htmlDecode(e.innerHTML))),
						title,
						result = [];
					for(title in jsonTiddlers) {
						result.push(jsonTiddlers[title]);
					}
					return result;
				} else {
					return null;
				}
			},
			t,result = [];
		if(node) {
			for(t = 0; t < node.childNodes.length; t++) {
					var tiddlers = extractTextTiddlers(node.childNodes[t]),
						childNode = node.childNodes[t];
					tiddlers = tiddlers || extractModuleTiddlers(childNode);
					tiddlers = tiddlers || extractEncryptedTiddlers(childNode);
					if(tiddlers) {
						result.push.apply(result,tiddlers);
					}
			}
		}
		return result;
	}
});
// Install the tiddler deserializer modules
$tw.modules.applyMethods("tiddlerdeserializer",$tw.Wiki.tiddlerDeserializerModules);

// End of if($tw.browser)
}

/////////////////////////// Server definitions

if(!$tw.browser) {

/*
Load the tiddlers contained in a particular file (and optionally extract fields from the accompanying .meta file)
*/
$tw.loadTiddlersFromFile = function(filepath,fields) {
	var ext = path.extname(filepath),
		extensionInfo = $tw.config.fileExtensionInfo[ext],
		typeInfo = extensionInfo ? $tw.config.contentTypeInfo[extensionInfo.type] : null,
		data = fs.readFileSync(filepath,typeInfo ? typeInfo.encoding : "utf8"),
		tiddlers = $tw.wiki.deserializeTiddlers(ext,data,fields),
		metafile = filepath + ".meta";
	if(ext !== ".json" && tiddlers.length === 1 && fs.existsSync(metafile)) {
		var metadata = fs.readFileSync(metafile,"utf8");
		if(metadata) {
			tiddlers = [$tw.utils.parseFields(metadata,tiddlers[0])];
		}
	}
	return tiddlers;
};

/*
Load all the tiddlers from a directory
*/
$tw.loadTiddlersFromPath = function(filepath,excludeRegExp) {
	excludeRegExp = excludeRegExp || /^\.DS_Store$|.meta$/;
	var tiddlers = [],
		stat, files, pluginInfo, pluginTiddlers, f, file, titlePrefix, t, filesInfo, p, tidInfo, typeInfo, text;
	if(fs.existsSync(filepath)) {
		stat = fs.statSync(filepath);
		if(stat.isDirectory()) {
			files = fs.readdirSync(filepath);
			// Look for a tiddlywiki.files file
			if(files.indexOf("tiddlywiki.files") !== -1) {
				// If so, process the files it describes
				filesInfo = JSON.parse(fs.readFileSync(filepath + "/tiddlywiki.files","utf8"));
				for(p=0; p<filesInfo.tiddlers.length; p++) {
					tidInfo = filesInfo.tiddlers[p];
					typeInfo = $tw.config.contentTypeInfo[tidInfo.fields.type || "text/plain"];
					text = fs.readFileSync(path.resolve(filepath,tidInfo.file),typeInfo ? typeInfo.encoding : "utf8");
					tidInfo.fields.text = text;
					tiddlers.push(tidInfo.fields);
				}
			} else {
				// If not, read all the files in the directory
				for(f=0; f<files.length; f++) {
					file = files[f];
					if(!excludeRegExp.test(file)) {
						tiddlers.push.apply(tiddlers,$tw.loadTiddlersFromPath(filepath + "/" + file,excludeRegExp));
					}
				}
			}
		} else if(stat.isFile()) {
			tiddlers.push.apply(tiddlers,$tw.loadTiddlersFromFile(filepath));
		}
	}
	return tiddlers;
};

/*
Load the tiddlers from a bundle folder, and package them up into a proper JSON bundle tiddler
*/
$tw.loadBundleFolder = function(filepath,excludeRegExp) {
	excludeRegExp = excludeRegExp || /^\.DS_Store$|.meta$/;
	var stat, files, bundleInfo = {tiddlers: []}, bundleTiddlers = [], f, file, titlePrefix, t;
	if(fs.existsSync(filepath)) {
		stat = fs.statSync(filepath);
		if(stat.isDirectory()) {
			files = fs.readdirSync(filepath);
			// Read the plugin information
			bundleInfo = JSON.parse(fs.readFileSync(filepath + "/plugin.bundle","utf8"));
			// Read the bundle files
			for(f=0; f<files.length; f++) {
				file = files[f];
				if(!excludeRegExp.test(file) && file !== "plugin.bundle" && file !== "tiddlywiki.files") {
					bundleTiddlers.push.apply(bundleTiddlers,$tw.loadTiddlersFromPath(filepath + "/" + file,excludeRegExp));
				}
			}
			// Save the bundle tiddlers into the bundle
			bundleInfo.tiddlers = bundleInfo.tiddlers || {};
			titlePrefix = bundleInfo.title + "/";
			for(t=0; t<bundleTiddlers.length; t++) {
				// Check that the constituent tiddler has the bundle title as a prefix
				if(bundleTiddlers[t].title.indexOf(titlePrefix) === 0 && bundleTiddlers[t].title.length > titlePrefix.length) {
					bundleInfo.tiddlers[bundleTiddlers[t].title.substr(titlePrefix.length)] = bundleTiddlers[t];
				} else {
					console.log("Error extracting plugin bundle: The bundle '" + bundleInfo.title + "' cannot contain a tiddler titled '" + bundleTiddlers[t].title + "'");
				}
			}
		}
	}
	// Save the bundle tiddler
	return {
		title: bundleInfo.title,
		type: "application/json",
		bundle: "yes",
		text: JSON.stringify(bundleInfo)
	};
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

// End of if(!$tw.browser)	
}

/////////////////////////// Final initialisation

// Load tiddlers
var t;
if($tw.browser) {
	// In the browser, we load tiddlers from certain elements
	var containerIds = [
		"libraryModules",
		"modules",
		"bootKernelPrefix",
		"bootKernel",
		"styleArea",
		"storeArea",
		"shadowArea"
	];
	for(t=0; t<containerIds.length; t++) {
		$tw.wiki.addTiddlers($tw.wiki.deserializeTiddlers("(DOM)",document.getElementById(containerIds[t])));
	}
	// Load any preloaded tiddlers
	if($tw.preloadTiddlers) {
		$tw.wiki.addTiddlers($tw.preloadTiddlers);
	}
} else {
	// On the server, we load tiddlers from specified folders
	var folders = [
		$tw.boot.bootPath,
		path.resolve($tw.boot.wikiPath,$tw.config.wikiPluginsSubDir),
		path.resolve($tw.boot.wikiPath,$tw.config.wikiShadowsSubDir),
		path.resolve($tw.boot.wikiPath,$tw.config.wikiTiddlersSubDir)
	];
	for(t=0; t<folders.length; t++) {
		$tw.wiki.addTiddlers($tw.loadTiddlersFromPath(folders[t]));
	}
	// Load any plugins specified within the wiki folder
	var wikiInfoPath = path.resolve($tw.boot.wikiPath,$tw.config.wikiInfo);
	if(fs.existsSync(wikiInfoPath)) {
		var wikiInfo = JSON.parse(fs.readFileSync(wikiInfoPath,"utf8")),
			pluginBasePath = path.resolve($tw.boot.bootPath,$tw.config.pluginsPath);
		for(t=0; t<wikiInfo.plugins.length; t++) {
			$tw.wiki.addTiddler($tw.loadBundleFolder(path.resolve(pluginBasePath,"./" + wikiInfo.plugins[t])));
		}
	}
}

// Install plugins
$tw.wiki.unpackBundleTiddlers();

// Register typed modules from the tiddlers we've just loaded
$tw.wiki.registerModuleTiddlers();

// Run any startup modules
var mainModules = $tw.modules.types.startup;
for(var m=0; m<mainModules.length; m++) {
	mainModules[m].startup();
}

})();
