/*\
title: $:/core/boot.js
type: application/javascript

The main boot kernel for TiddlyWiki. This single file creates a barebones TW environment that is just
sufficient to bootstrap the plugins containing the main logic of the applicaiton.

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
	global.$tw = {}; // No ``browser`` member for the server
}

// Boot information
$tw.boot = {};

// Modules store registers all the modules the system has seen
$tw.modules = $tw.modules || {};
$tw.modules.titles = $tw.modules.titles || {}; // hashmap by module title of {fn:, exports:, moduleType:}

// Plugins store organises module exports by module type
$tw.plugins = $tw.plugins || {};
$tw.plugins.moduleTypes = $tw.plugins.moduleTypes || {}; // hashmap by module type of array of exports

// Config object
$tw.config = $tw.config || {};

// Constants
$tw.config.root = $tw.config.root || "$:"; // Root for module titles (eg, "$:/kernel/boot.js")
$tw.config.bootModuleSubDir = $tw.config.bootModuleSubDir || "./modules";
$tw.config.wikiPluginsSubDir = $tw.config.wikiPluginsSubDir || "./plugins";

// File extensions
$tw.config.fileExtensions = {
	".tid": {type: "application/x-tiddler", encoding: "utf8"},
	".txt": {type: "text/plain", encoding: "utf8"},
	".css": {type: "text/css", encoding: "utf8"},
	".html": {type: "text/html", encoding: "utf8"},
	".js": {type: "application/javascript", encoding: "utf8"},
	".jpg": {type: "image/jpeg", encoding: "base64"},
	".jpeg": {type: "image/jpeg", encoding: "base64"},
	".png": {type: "image/png", encoding: "base64"},
	".gif": {type: "image/gif", encoding: "base64"},
	".svg": {type: "image/svg+xml", encoding: "utf8"}
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

/////////////////////////// Plugin mechanism

/*
Register a single plugin module in the $tw.plugins.moduleTypes hashmap
*/
$tw.plugins.registerPlugin = function(name,moduleType,moduleExports) {
	if(!(moduleType in $tw.plugins.moduleTypes)) {
		$tw.plugins.moduleTypes[moduleType] = [];
	}
	$tw.plugins.moduleTypes[moduleType].push(moduleExports);
};

/*
Register all plugin module tiddlers
*/
$tw.plugins.registerPluginModules = function() {
	for(var title in $tw.wiki.shadows.tiddlers) {
		var tiddler = $tw.wiki.shadows.getTiddler(title);
		if(tiddler.fields.type === "application/javascript" && tiddler.fields["module-type"] !== undefined) {
			$tw.plugins.registerPlugin(title,tiddler.fields["module-type"],$tw.modules.execute(title));
		}
	}
};

/*
Get all the plugins of a particular type in a hashmap by their `name` field
*/
$tw.plugins.getPluginsByTypeAsHashmap = function(moduleType,nameField) {
	nameField = nameField || "name";
	var plugins = $tw.plugins.moduleTypes[moduleType],
		results = {};
	if(plugins) {
		for(var t=0; t<plugins.length; t++) {
			results[plugins[t][nameField]] =  plugins[t];
		}
	}
	return results;
};

/*
Apply the exports of the plugin modules of a particular type to a target object
*/
$tw.plugins.applyMethods = function(moduleType,object) {
	var modules = $tw.plugins.moduleTypes[moduleType],
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
			src = (arg instanceof $tw.Tiddler) ? arg.getFields() : arg;
		for(var t in src) {
			if(src[t] === undefined) {
				if(t in this.fields) {
					delete this.fields[t]; // If we get a field that's undefined, delete any previous field value
				}
			} else {
				// Parse the field with the associated plugin (if any)
				var fieldPlugin = $tw.Tiddler.fieldPlugins[t];
				if(fieldPlugin) {
					this.fields[t] = fieldPlugin.parse.call(this,src[t]);
				} else {
					this.fields[t] = src[t];
				}
			}
		}
	}
};

$tw.Tiddler.prototype.getFields = function() {
	return this.fields;
};

/*
Hashmap of field plugins by plugin name
*/
$tw.Tiddler.fieldPlugins = {};

/*
Register and install the built in tiddler field plugins
*/
$tw.plugins.registerPlugin($tw.config.root + "/kernel/tiddlerfields/modified","tiddlerfield",{
	name: "modified",
	parse: $tw.utils.parseDate,
	stringify: $tw.utils.stringifyDate
});
$tw.plugins.registerPlugin($tw.config.root + "/kernel/tiddlerfields/created","tiddlerfield",{
	name: "created",
	parse: $tw.utils.parseDate,
	stringify: $tw.utils.stringifyDate
});
$tw.plugins.registerPlugin($tw.config.root + "/kernel/tiddlerfields/tags","tiddlerfield",{
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
// Install built in tiddler fields plugins so that they are available immediately
$tw.Tiddler.fieldPlugins = $tw.plugins.getPluginsByTypeAsHashmap("tiddlerfield");

/////////////////////////// Barebones wiki store

/*
Construct a wiki store object. Options are:
	shadows: optional value to use as the wiki store for shadow tiddlers
*/
$tw.Wiki = function(options) {
	options = options || {};
	this.shadows = options.shadows !== undefined ? options.shadows : new $tw.Wiki({shadows: null});
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

$tw.Wiki.prototype.getTiddler = function(title) {
	var t = this.tiddlers[title];
	if(t instanceof $tw.Tiddler) {
		return t;
	} else if(this.shadows) {
		return this.shadows.getTiddler(title);
	} else {
		return null;
	}
};

/*
Hashmap of field plugins by plugin name
*/
$tw.Wiki.tiddlerDeserializerPlugins = {};

/*
Extracts tiddlers from a typed block of text, specifying default field values
*/
$tw.Wiki.prototype.deserializeTiddlers = function(type,text,srcFields) {
	srcFields = srcFields || {};
	var deserializer = $tw.Wiki.tiddlerDeserializerPlugins[type],
		fields = {};
	if(!deserializer && $tw.config.fileExtensions[type]) {
		// If we didn't find the serializer, try converting it from an extension to a content type
		type = $tw.config.fileExtensions[type].type;
		deserializer = $tw.Wiki.tiddlerDeserializerPlugins[type];
	}
	if(!deserializer) {
		// If we still don't have a deserializer, treat it as plain text
		deserializer = $tw.Wiki.tiddlerDeserializerPlugins["text/plain"];
	}
	for(var f in srcFields) {
		fields[f] = srcFields[f];
	}
	if(!fields.type) {
		fields.type = type;
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
Register the built in tiddler deserializer plugins
*/
$tw.plugins.registerPlugin($tw.config.root + "/kernel/tiddlerdeserializer/js","tiddlerdeserializer",{
	"application/javascript": function(text,fields) {
		var headerCommentRegExp = /^\/\*\\\n((?:^[^\n]*\n)+?)(^\\\*\/$\n?)/mg,
			match = headerCommentRegExp.exec(text);
		fields.text = text;
		if(match) {
			fields = $tw.utils.parseFields(match[1].split(/\r?\n\r?\n/mg)[0],fields);
		}
		return [fields];
	}
});
$tw.plugins.registerPlugin($tw.config.root + "/kernel/tiddlerdeserializer/tid","tiddlerdeserializer",{
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
// Install the tiddler deserializer plugins so they are immediately available
$tw.plugins.applyMethods("tiddlerdeserializer",$tw.Wiki.tiddlerDeserializerPlugins);

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
$tw.plugins.registerPlugin($tw.config.root + "/kernel/tiddlerdeserializer/dom","tiddlerdeserializer",{
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
						text = text.substring(s+1,e-1);
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
// Install the tiddler deserializer plugin
$tw.plugins.applyMethods("tiddlerdeserializer",$tw.Wiki.tiddlerDeserializerPlugins);

// Load the JavaScript system tiddlers from the DOM
$tw.wiki.shadows.addTiddlers(
	$tw.wiki.deserializeTiddlers("(DOM)",document.getElementById("pluginModules"))
);
$tw.wiki.shadows.addTiddlers(
	$tw.wiki.deserializeTiddlers("(DOM)",document.getElementById("bootKernelPrefix"))
);
$tw.wiki.shadows.addTiddlers(
	$tw.wiki.deserializeTiddlers("(DOM)",document.getElementById("bootKernel"))
);
// Load the stylesheet tiddlers from the DOM
$tw.wiki.shadows.addTiddlers(
	$tw.wiki.deserializeTiddlers("(DOM)",document.getElementById("styleArea"))
);
// Load the main store tiddlers from the DOM
$tw.wiki.addTiddlers(
	$tw.wiki.deserializeTiddlers("(DOM)",document.getElementById("storeArea"))
);
// Load the shadow tiddlers from the DOM
$tw.wiki.shadows.addTiddlers(
	$tw.wiki.deserializeTiddlers("(DOM)",document.getElementById("shadowArea"))
);

// End of if($tw.browser)
}

/////////////////////////// Server definitions

if(!$tw.browser) {

var fs = require("fs"),
	path = require("path"),
	vm = require("vm");

$tw.boot.bootFile = path.basename(module.filename);
$tw.boot.bootPath = path.dirname(module.filename);
$tw.boot.wikiPath = process.cwd();

/*
Load the tiddlers contained in a particular file (and optionally the accompanying .meta file)
*/
$tw.plugins.loadTiddlersFromFile = function(file,fields,wiki) {
	wiki = wiki || $tw.wiki;
	var ext = path.extname(file),
		extensionInfo = $tw.config.fileExtensions[ext],
		data = fs.readFileSync(file).toString(extensionInfo ? extensionInfo.encoding : "utf8"),
		tiddlers = $tw.wiki.deserializeTiddlers(ext,data,fields),
		metafile = file + ".meta";
	if(ext !== ".json" && tiddlers.length === 1 && path.existsSync(metafile)) {
		var metadata = fs.readFileSync(metafile).toString("utf8");
		if(metadata) {
			tiddlers = [$tw.utils.parseFields(metadata,tiddlers[0])];
		}
	}
	wiki.addTiddlers(tiddlers);
};

/*
Load all the plugins from the plugins directory
*/
$tw.plugins.loadPluginsFromFolder = function(filepath,basetitle,excludeRegExp,wiki) {
	basetitle = basetitle || "$:/plugins";
	excludeRegExp = excludeRegExp || /^\.DS_Store$|.meta$/;
	wiki = wiki || $tw.wiki.shadows;
	if(path.existsSync(filepath)) {
		var stat = fs.statSync(filepath);
		if(stat.isDirectory()) {
			var files = fs.readdirSync(filepath);
			// Look for a tiddlywiki.plugin file
			if(files.indexOf("tiddlywiki.plugin") !== -1) {
				// If so, process the files it describes
				var pluginInfo = JSON.parse(fs.readFileSync(filepath + "/tiddlywiki.plugin").toString("utf8"));
				for(var p=0; p<pluginInfo.tiddlers.length; p++) {
					$tw.plugins.loadTiddlersFromFile(path.resolve(filepath,pluginInfo.tiddlers[p].file),pluginInfo.tiddlers[p].fields,wiki);
				}
			} else {
				// If not, read all the files in the directory
				for(var f=0; f<files.length; f++) {
					var file = files[f];
					if(!excludeRegExp.test(file)) {
						$tw.plugins.loadPluginsFromFolder(filepath + "/" + file,basetitle + "/" + file,excludeRegExp,wiki);
					}
				}
			}
		} else if(stat.isFile()) {
			$tw.plugins.loadTiddlersFromFile(filepath,{title: basetitle},wiki);
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
		vm.runInNewContext(tiddler.fields.text,sandbox,tiddler.fields.title);
		module.exports = sandbox.exports;
	}
	// Return the exports of the module
	return module.exports;
};

// Load plugins from the plugins directory
$tw.plugins.loadPluginsFromFolder(path.resolve($tw.boot.bootPath,$tw.config.bootModuleSubDir));

// Load any plugins in the wiki plugins directory
$tw.plugins.loadPluginsFromFolder(path.resolve($tw.boot.wikiPath,$tw.config.wikiPluginsSubDir));

// HACK: to be replaced when we re-establish sync plugins
// Load shadow tiddlers from wiki shadows directory
$tw.plugins.loadPluginsFromFolder(path.resolve($tw.boot.wikiPath,"./shadows"));
// Load tiddlers from wiki tiddlers directory
$tw.plugins.loadPluginsFromFolder(path.resolve($tw.boot.wikiPath,"./tiddlers"),null,null,$tw.wiki);

// End of if(!$tw.browser)	
}

/////////////////////////// Final initialisation

// Register plugins from the tiddlers we've just loaded
$tw.plugins.registerPluginModules();

// Run any startup plugin modules
var mainModules = $tw.plugins.moduleTypes.startup;
for(var m=0; m<mainModules.length; m++) {
	mainModules[m].startup.call($tw);
}

})();
