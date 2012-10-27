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
$tw.crypto = new function() {
	var password = null,
		callSjcl = function(method,inputText) {
			var outputText;
			if(!password) {
				getPassword();
			}
			try {
				outputText = $tw.crypto.sjcl[method](password,inputText);
			} catch(ex) {
				console.log("Crypto error:" + ex)
				outputText = null;	
			}
			return outputText;
		},
		getPassword = function() {
			if($tw.browser) {
				password = prompt("Enter password to decrypt TiddlyWiki");
			}
		};

	this.setPassword = function(newPassword) {
		password = newPassword;
	}
	this.encrypt = function(text) {
		return callSjcl("encrypt",text);
	};
	this.decrypt = function(text) {
		return callSjcl("decrypt",text);
	};
};

$tw.crypto.sjcl = $tw.browser ? window.sjcl : require("./sjcl.js");

// Boot information
$tw.boot = {};

// Modules store registers all the modules the system has seen
$tw.modules = $tw.modules || {};
$tw.modules.titles = $tw.modules.titles || {}; // hashmap by module title of {fn:, exports:, moduleType:}
$tw.modules.types = $tw.modules.types || {}; // hashmap by module type of array of exports

// Plugin information
$tw.plugins = $tw.plugins || {};

// Config object
$tw.config = $tw.config || {};

// Constants
$tw.config.bootModuleSubDir = $tw.config.bootModuleSubDir || "./modules";
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
	"application/x-tiddler": {encoding: "utf8"},
	"application/x-tiddler-html-div": {encoding: "utf8"},
	"application/x-tiddlywiki-recipe": {encoding: "utf8"},
	"text/plain": {encoding: "utf8"},
	"text/css": {encoding: "utf8"},
	"text/html": {encoding: "utf8"},
	"application/javascript": {encoding: "utf8"},
	"application/json": {encoding: "utf8"},
	"application/pdf": {encoding: "base64"},
	"image/jpeg": {encoding: "base64"},
	"image/png": {encoding: "base64"},
	"image/gif": {encoding: "base64"},
	"image/svg+xml": {encoding: "utf8"}
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
Returns true if the `actual` version is greater than or equal to the `required` version. Both are in `x.y.` format.
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
	if(!(moduleType in $tw.modules.types)) {
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
Extract tiddlers stored in plugins so that we can easily access them in getTiddler()
*/
$tw.Wiki.prototype.installPlugins = function() {
	this.plugins = {}; // Hashmap of plugin information by title
	this.pluginTiddlers = {}; // Hashmap of constituent tiddlers from plugins by title
	// Collect up all the plugin tiddlers
	for(var title in this.tiddlers) {
		var tiddler = this.tiddlers[title];
		if(tiddler.fields.type === "application/json" && "plugin" in tiddler.fields) {
			// Save the plugin information
			var pluginInfo = this.plugins[title] = JSON.parse(tiddler.fields.text);
			// Extract the constituent tiddlers
			for(var t in pluginInfo.tiddlers) {
				var constituentTiddler = pluginInfo.tiddlers[t],
					constituentTitle = pluginInfo.title + "/" + t;
				// Don't overwrite tiddlers that already exist
				if(!(constituentTitle in this.pluginTiddlers)) {
					// Save the tiddler object
					this.pluginTiddlers[constituentTitle] = new $tw.Tiddler(constituentTiddler,{title: constituentTitle});
				}
			}
		}
	}
};

/*
Register all the module tiddlers that have a module type
*/
$tw.Wiki.prototype.registerModuleTiddlers = function() {
	var title, tiddler;
	// If in the browser, define any modules from plugins
	if($tw.browser) {
		for(title in $tw.wiki.pluginTiddlers) {
			tiddler = $tw.wiki.getTiddler(title);
			if(!(title in $tw.wiki.tiddlers)) {
				if(tiddler.fields.type === "application/javascript" && "module-type" in tiddler.fields) {
					// Define the module
					var source = [
						"(function(module,exports,require) {",
						tiddler.fields.text,
						"})"
					];
					$tw.modules.define(tiddler.fields.title,tiddler.fields["module-type"],window.eval(source.join("")));
				}
			}
		}
	}
	// Register and execute any modules from plugins
	for(title in $tw.wiki.pluginTiddlers) {
		tiddler = $tw.wiki.getTiddler(title);
		if(!(title in $tw.wiki.tiddlers)) {
			if(tiddler.fields.type === "application/javascript" && "module-type" in tiddler.fields) {
				// Execute and register the module
				$tw.modules.registerModuleExports(title,tiddler.fields["module-type"],$tw.modules.execute(title));
			}
		}
	}
	// Register and execute any modules in ordinary tiddlers
	if($tw.browser) {
		for(title in $tw.modules.titles) {
			$tw.modules.registerModuleExports(title,$tw.modules.titles[title].moduleType,$tw.modules.execute(title));
		}
	} else {
		for(title in $tw.wiki.tiddlers) {
			tiddler = $tw.wiki.getTiddler(title);
			if(tiddler.fields.type === "application/javascript" && tiddler.fields["module-type"] !== undefined) {
				$tw.modules.registerModuleExports(title,tiddler.fields["module-type"],$tw.modules.execute(title));
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
// Load any preloaded tiddlers
if($tw.preloadTiddlers) {
	$tw.wiki.addTiddlers($tw.preloadTiddlers,true);
}

// End of if($tw.browser)
}

/////////////////////////// Server definitions

if(!$tw.browser) {

/*
Load the tiddlers contained in a particular file (and optionally extract fields from the accompanying .meta file)
*/
$tw.extractTiddlersFromFile = function(filepath,fields) {
	var ext = path.extname(filepath),
		extensionInfo = $tw.config.fileExtensionInfo[ext],
		typeInfo = extensionInfo ? $tw.config.contentTypeInfo[extensionInfo.type] : null,
		data = fs.readFileSync(filepath).toString(typeInfo ? typeInfo.encoding : "utf8"),
		tiddlers = $tw.wiki.deserializeTiddlers(ext,data,fields),
		metafile = filepath + ".meta";
	if(ext !== ".json" && tiddlers.length === 1 && fs.existsSync(metafile)) {
		var metadata = fs.readFileSync(metafile).toString("utf8");
		if(metadata) {
			tiddlers = [$tw.utils.parseFields(metadata,tiddlers[0])];
		}
	}
	return tiddlers;
};

/*
Load all the tiddlers from a directory
*/
$tw.extractTiddlersFromPath = function(filepath,basetitle,excludeRegExp) {
	basetitle = basetitle || "$:/plugins";
	excludeRegExp = excludeRegExp || /^\.DS_Store$|.meta$/;
	var tiddlers = [];
	if(fs.existsSync(filepath)) {
		var stat = fs.statSync(filepath);
		if(stat.isDirectory()) {
			var files = fs.readdirSync(filepath);
			// Look for a tiddlywiki.plugin file
			if(files.indexOf("tiddlywiki.plugin") !== -1) {
				// Read the plugin information
				var pluginInfo = JSON.parse(fs.readFileSync(filepath + "/tiddlywiki.plugin").toString("utf8"));
				// Read the plugin files
				var pluginTiddlers = [];
				for(var f=0; f<files.length; f++) {
					var file = files[f];
					if(!excludeRegExp.test(file) && file !== "tiddlywiki.plugin" && file !== "tiddlywiki.files") {
						pluginTiddlers.push.apply(pluginTiddlers,$tw.extractTiddlersFromPath(filepath + "/" + file,basetitle + "/" + file,excludeRegExp));
					}
				}
				// Save the plugin tiddlers into the plugin
				pluginInfo.tiddlers = pluginInfo.tiddlers || {};
				var titlePrefix = pluginInfo.title + "/";
				for(var t=0; t<pluginTiddlers.length; t++) {
					// Check that the constituent tiddler has the plugin title as a prefix
					if(pluginTiddlers[t].title.indexOf(titlePrefix) === 0 && pluginTiddlers[t].title.length > titlePrefix.length) {
						pluginInfo.tiddlers[pluginTiddlers[t].title.substr(titlePrefix.length)] = pluginTiddlers[t];
					} else {
						throw "The plugin '" + pluginInfo.title + "' cannot contain a tiddler titled '" + pluginTiddlers[t].title + "'";
					}
				}
				// Save the plugin tiddler
				tiddlers.push({title: pluginInfo.title, type: "application/json", plugin: "yes", text: JSON.stringify(pluginInfo)});
			// Look for a tiddlywiki.files file
			} else if(files.indexOf("tiddlywiki.files") !== -1) {
				// If so, process the files it describes
				var filesInfo = JSON.parse(fs.readFileSync(filepath + "/tiddlywiki.files").toString("utf8"));
				for(var p=0; p<filesInfo.tiddlers.length; p++) {
					var tidInfo = filesInfo.tiddlers[p],
						typeInfo = $tw.config.contentTypeInfo[tidInfo.fields.type || "text/plain"],
						text = fs.readFileSync(path.resolve(filepath,tidInfo.file)).toString(typeInfo ? typeInfo.encoding : "utf8");
					tidInfo.fields.text = text;
					tiddlers.push(tidInfo.fields);
				}
			} else {
				// If not, read all the files in the directory
				for(var f=0; f<files.length; f++) {
					var file = files[f];
					if(!excludeRegExp.test(file)) {
						tiddlers.push.apply(tiddlers,$tw.extractTiddlersFromPath(filepath + "/" + file,basetitle + "/" + file,excludeRegExp));
					}
				}
			}
		} else if(stat.isFile()) {
			tiddlers.push.apply(tiddlers,$tw.extractTiddlersFromFile(filepath,{title: basetitle}));
		}
	}
	return tiddlers;
};

/*
Load all the tiddlers from a directory
*/
$tw.loadTiddlersFromFolder = function(filepath,basetitle,excludeRegExp,isShadow) {
	$tw.wiki.addTiddlers($tw.extractTiddlersFromPath(filepath,basetitle,excludeRegExp),isShadow);
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
$tw.wiki.registerModuleTiddlers();

// Run any startup modules
var mainModules = $tw.modules.types.startup;
for(var m=0; m<mainModules.length; m++) {
	mainModules[m].startup();
}

})();
