/*\
title: $:/core/modules/commands/savewikifolder.js
type: application/javascript
module-type: command

Command to save the current wiki as a wiki folder

--savewikifolder <wikifolderpath> [ [<name>=<value>] ]*

The following options are supported:

* ''filter'': a filter expression defining the tiddlers to be included in the output
* ''explodePlugins'': set to "no" to suppress exploding plugins into their constituent shadow tiddlers (defaults to "yes")

Supports backward compatibility with --savewikifolder <wikifolderpath> [<filter>] [ [<name>=<value>] ]*

\*/

"use strict";

exports.info = {
	name: "savewikifolder",
	synchronous: true
};

let fs; let path;
if($tw.node) {
	fs = require("fs");
	path = require("path");
}

const Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 1) {
		return "Missing wiki folder path";
	}
	const regFilter = /^[a-zA-Z0-9\.\-_]+=/g;  // dynamic parameters
	let namedParames;
	let tiddlerFilter;
	const options = {};
	if(regFilter.test(this.params[1])) {
		namedParames = this.commander.extractNamedParameters(this.params.slice(1));
		tiddlerFilter = namedParames.filter || "[all[tiddlers]]";
	} else {
		namedParames = this.commander.extractNamedParameters(this.params.slice(2));
		tiddlerFilter = this.params[1];
	}
	tiddlerFilter = tiddlerFilter || "[all[tiddlers]]";
	options.explodePlugins = namedParames.explodePlugins || "yes";
	const wikifoldermaker = new WikiFolderMaker(this.params[0],tiddlerFilter,this.commander,options);
	return wikifoldermaker.save();
};

function WikiFolderMaker(wikiFolderPath,wikiFilter,commander,options) {
	this.wikiFolderPath = wikiFolderPath;
	this.wikiFilter = wikiFilter;
	this.commander = commander;
	this.explodePlugins = options.explodePlugins;
	this.wiki = commander.wiki;
	this.savedPaths = []; // So that we can detect filename clashes
}

WikiFolderMaker.prototype.log = function(str) {
	if(this.commander.verbose) {
		console.log(str);
	}
};

WikiFolderMaker.prototype.tiddlersToIgnore = [
	"$:/boot/boot.css",
	"$:/boot/boot.js",
	"$:/boot/bootprefix.js",
	"$:/core",
	"$:/library/sjcl.js",
	"$:/temp/info-plugin"
];

/*
Returns null if successful, or an error string if there was an error
*/
WikiFolderMaker.prototype.save = function() {
	const self = this;
	// Check that the output directory doesn't exist
	if(fs.existsSync(this.wikiFolderPath) && !$tw.utils.isDirectoryEmpty(this.wikiFolderPath)) {
		return "The unpackwiki command requires that the output wiki folder be empty";
	}
	// Get the tiddlers from the source wiki
	const tiddlerTitles = this.wiki.filterTiddlers(this.wikiFilter);
	// Initialise a new tiddlwiki.info file
	const newWikiInfo = {};
	// Process each incoming tiddler in turn
	$tw.utils.each(tiddlerTitles,(title) => {
		const tiddler = self.wiki.getTiddler(title);
		if(tiddler) {
			if(self.tiddlersToIgnore.includes(title)) {
				// Ignore the core plugin and the ephemeral info plugin
				self.log(`Ignoring tiddler: ${title}`);
			} else {
				const {type} = tiddler.fields;
				const pluginType = tiddler.fields["plugin-type"];
				if(type === "application/json" && pluginType) {
					// Plugin tiddler
					const libraryDetails = self.findPluginInLibrary(title);
					if(libraryDetails) {
						// A plugin from the core library
						self.log(`Adding built-in plugin: ${libraryDetails.name}`);
						newWikiInfo[libraryDetails.type] = newWikiInfo[libraryDetails.type] || [];
						$tw.utils.pushTop(newWikiInfo[libraryDetails.type],libraryDetails.name);
					} else if(self.explodePlugins !== "no") {
						// A custom plugin
						self.log(`Processing custom plugin: ${title}`);
						self.saveCustomPlugin(tiddler);
					} else if(self.explodePlugins === "no") {
						self.log(`Processing custom plugin to tiddlders folder: ${title}`);
						self.saveTiddler("tiddlers",tiddler);
					}
				} else {
					// Ordinary tiddler
					self.saveTiddler("tiddlers",tiddler);
				}
			}
		}
	});
	// Save the tiddlywiki.info file
	this.saveJSONFile("tiddlywiki.info",newWikiInfo);
	self.log(`Writing tiddlywiki.info: ${JSON.stringify(newWikiInfo,null,$tw.config.preferences.jsonSpaces)}`);
	return null;
};

/*
Test whether the specified tiddler is a plugin in the plugin library
*/
WikiFolderMaker.prototype.findPluginInLibrary = function(title) {
	const parts = title.split("/");
	let pluginPath; let type; let name;
	if(parts[0] === "$:") {
		if(parts[1] === "languages" && parts.length === 3) {
			pluginPath = `languages${path.sep}${parts[2]}`;
			type = parts[1];
			name = parts[2];
		} else if(parts[1] === "plugins" || parts[1] === "themes" && parts.length === 4) {
			pluginPath = parts[1] + path.sep + parts[2] + path.sep + parts[3];
			type = parts[1];
			name = `${parts[2]}/${parts[3]}`;
		}
	}
	if(pluginPath && type && name) {
		pluginPath = path.resolve($tw.boot.bootPath,"..",pluginPath);
		if(fs.existsSync(pluginPath)) {
			return {
				pluginPath,
				type,
				name
			};
		}
	}
	return false;
};

WikiFolderMaker.prototype.saveCustomPlugin = function(pluginTiddler) {
	const self = this;
	const pluginTitle = pluginTiddler.fields.title;
	const titleParts = pluginTitle.split("/");
	const directory = $tw.utils.generateTiddlerFilepath(titleParts[titleParts.length - 1],{
		directory: path.resolve(this.wikiFolderPath,`${pluginTiddler.fields["plugin-type"]}s`)
	});
	const pluginInfo = pluginTiddler.getFieldStrings({exclude: ["text","type"]});
	this.saveJSONFile(`${directory + path.sep}plugin.info`,pluginInfo);
	self.log(`Writing ${directory}${path.sep}plugin.info: ${JSON.stringify(pluginInfo,null,$tw.config.preferences.jsonSpaces)}`);
	const pluginTiddlers = $tw.utils.parseJSONSafe(pluginTiddler.fields.text).tiddlers; // A hashmap of tiddlers in the plugin
	$tw.utils.each(pluginTiddlers,(tiddler,title) => {
		if(!tiddler.title) {
			tiddler.title = title;
		}
		self.saveTiddler(directory,new $tw.Tiddler(tiddler));
	});
};

WikiFolderMaker.prototype.saveTiddler = function(directory,tiddler) {
	const {title} = tiddler.fields; var fileInfo; let pathFilters; let extFilters;
	if(this.wiki.tiddlerExists("$:/config/FileSystemPaths")) {
		pathFilters = this.wiki.getTiddlerText("$:/config/FileSystemPaths","").split("\n");
	}
	if(this.wiki.tiddlerExists("$:/config/FileSystemExtensions")) {
		extFilters = this.wiki.getTiddlerText("$:/config/FileSystemExtensions","").split("\n");
	}
	var fileInfo = $tw.utils.generateTiddlerFileInfo(tiddler,{
		directory: path.resolve(this.wikiFolderPath,directory),
		pathFilters,
		extFilters,
		wiki: this.wiki,
		fileInfo: {}
	});
	try {
		$tw.utils.saveTiddlerToFileSync(tiddler,fileInfo);
	} catch(err) {
		console.log(`SaveWikiFolder: Error saving file '${fileInfo.filepath}', tiddler: '${tiddler.fields.title}`);
	}
};

WikiFolderMaker.prototype.saveJSONFile = function(filename,json) {
	this.saveTextFile(filename,JSON.stringify(json,null,$tw.config.preferences.jsonSpaces));
};

WikiFolderMaker.prototype.saveTextFile = function(filename,data) {
	this.saveFile(filename,"utf8",data);
};

WikiFolderMaker.prototype.saveFile = function(filename,encoding,data) {
	const filepath = path.resolve(this.wikiFolderPath,filename);
	$tw.utils.createFileDirectories(filepath);
	fs.writeFileSync(filepath,data,encoding);
};

exports.Command = Command;
