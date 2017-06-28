"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs = require("rxjs");
var path = require("path");
var fs = require("fs");
var maxConcurrent = 20;
function obs_stat(tag) {
	return rxjs.Observable.bindCallback(fs.stat, function (err, stat) { return [err, stat, tag]; });
}
function obs_readdir(tag) {
	return rxjs.Observable.bindCallback(fs.readdir, function (err, files) { return [err, files, tag]; });
}
function obs_readFile(tag) {
	return rxjs.Observable.bindCallback(fs.readFile, function (err, data) { return [err, data, tag]; });
}
function bootNode($tw) {
	/**
	Load the tiddlers contained in a particular file (and optionally extract fields from the
	accompanying .meta file) returned as { filepath, type, tiddlers[], hasMetaFile }. Returns
	exactly one item.
	*/
	function loadTiddlersFromFile(filepath, fields) {
		//return Observable.of(filepath).switchMap(() => {
		var ext = path.extname(filepath), extensionInfo = $tw.utils.getFileExtensionInfo(ext), type = extensionInfo ? extensionInfo.type : null, typeInfo = type ? $tw.config.contentTypeInfo[type] : null;
		return obs_readFile({ type: type, filepath: filepath })(filepath, typeInfo ? typeInfo.encoding : "utf8").switchMap(function (_a) {
			var err = _a[0], data = _a[1], _b = _a[2], type = _b.type, filepath = _b.filepath;
			var tag = {
				type: type, filepath: filepath,
				tiddlers: $tw.wiki.deserializeTiddlers(ext, data, fields)
			};
			//const tag1 = extend(tag, { tiddlers })
			if (ext !== ".json" && tag.tiddlers.length === 1) {
				return loadMetadataForFile(filepath).map(function (metadata) { return [metadata || {}, tag]; });
			}
			else {
				return rxjs.Observable.of([false, tag]);
			}
		}).map(function (_a) {
			var metadata = _a[0], tag = _a[1];
			if (metadata)
				tag.tiddlers = [$tw.utils.extend({}, tag.tiddlers[0], metadata)];
			return { filepath: tag.filepath, type: tag.type, tiddlers: tag.tiddlers, hasMetaFile: !!metadata };
		});
	}
	;
	/**
	Load the metadata fields in the .meta file corresponding to a particular file. Returns null
	if none is found.
	*/
	function loadMetadataForFile(filepath) {
		var metafilename = filepath + ".meta";
		return obs_readFile()(metafilename, "utf8").map(function (_a) {
			var err = _a[0], data = _a[1];
			if (err) {
				return null;
			}
			else {
				return $tw.utils.parseFields(data || "");
			}
		});
	}
	;
	/**
	A default set of files for TiddlyWiki to ignore during load.
	This matches what NPM ignores, and adds "*.meta" to ignore tiddler
	metadata files.
	*/
	$tw.boot.excludeRegExp = /^\.DS_Store$|^.*\.meta$|^\..*\.swp$|^\._.*$|^\.git$|^\.hg$|^\.lock-wscript$|^\.svn$|^\.wafpickle-.*$|^CVS$|^npm-debug\.log$/;
	/**
	Load all the tiddlers recursively from a directory, including honouring `tiddlywiki.files` files for drawing in external files. Returns an array of {filepath:,type:,tiddlers: [{..fields...}],hasMetaFile:}. Note that no file information is returned for externally loaded tiddlers, just the `tiddlers` property.
	*/
	function loadTiddlersFromPath(filepath, excludeRegExp) {
		excludeRegExp = excludeRegExp || $tw.boot.excludeRegExp;
		var tiddlers = [];
		return obs_stat()(filepath).switchMap(function (_a) {
			var err = _a[0], stat = _a[1];
			if (err) {
				return rxjs.Observable.empty();
			}
			else {
				if (stat.isDirectory()) {
					return obs_readdir()(filepath).switchMap(function (_a) {
						var err = _a[0], files = _a[1];
						if (files.indexOf("tiddlywiki.files") !== -1) {
							return loadTiddlersFromSpecification(filepath, excludeRegExp);
						}
						else {
							// If not, read all the files in the directory
							return rxjs.Observable.from(files.filter(function (file) {
								return (!excludeRegExp.test(file) && file !== "plugin.info");
							})).mergeMap(function (file) {
								return loadTiddlersFromPath(filepath + path.sep + file, excludeRegExp);
							}, maxConcurrent);
						}
					});
				}
				else if (stat.isFile()) {
					return loadTiddlersFromFile(filepath);
				}
				else {
					return rxjs.Observable.empty();
				}
			}
		});
	}
	;
	/**
	Load all the tiddlers defined by a `tiddlywiki.files` specification file
	filepath: pathname of the directory containing the specification file
	*/
	function loadTiddlersFromSpecification(filepath, excludeRegExp) {
		var tiddlers = [];
		// Read the specification
		return obs_readFile()(filepath + path.sep + "tiddlywiki.files", "utf8").switchMap(function (res) {
			var err = res[0];
			var filesInfo = JSON.parse(res[1]);
			return rxjs.Observable.from(filesInfo.tiddlers || []).concatMap(function (tidInfo) {
				if (tidInfo.prefix && tidInfo.suffix) {
					tidInfo.fields.text = { prefix: tidInfo.prefix, suffix: tidInfo.suffix };
				}
				else if (tidInfo.prefix) {
					tidInfo.fields.text = { prefix: tidInfo.prefix };
				}
				else if (tidInfo.suffix) {
					tidInfo.fields.text = { suffix: tidInfo.suffix };
				}
				return processFile(tidInfo.file, tidInfo.isTiddlerFile, tidInfo.fields);
			}).concat(rxjs.Observable.from(filesInfo.directories || []).concatMap(function (dirInfo) {
				if (typeof dirInfo === "string") {
					var pathname = path.resolve(filepath, dirInfo);
					return obs_stat()(pathname).switchMap(function (_a) {
						var err = _a[0], stat = _a[1];
						if (err || !stat.isDirectory())
							return rxjs.Observable.empty();
						else
							return loadTiddlersFromPath(pathname, excludeRegExp);
					});
				}
				else {
					// Process directory specifier
					var dirPath = path.resolve(filepath, dirInfo.path);
					return obs_readdir()(dirPath).switchMap(function (_a) {
						var err = _a[0], files = _a[1];
						var fileRegExp = new RegExp(dirInfo.filesRegExp || "^.*$"), metaRegExp = /^.*\.meta$/;
						return rxjs.Observable.from(files.filter(function (filename) {
							return filename !== "tiddlywiki.files" && !metaRegExp.test(filename) && fileRegExp.test(filename);
						})).mergeMap(function (filename) {
							return processFile(dirPath + path.sep + filename, dirInfo.isTiddlerFile, dirInfo.fields);
						}, maxConcurrent);
					});
				}
			}));
		});
		// Helper to process a file
		function processFile(filename, isTiddlerFile, fields) {
			var extInfo = $tw.config.fileExtensionInfo[path.extname(filename)], type = (extInfo || {}).type || fields.type || "text/plain", typeInfo = $tw.config.contentTypeInfo[type] || {}, pathname = path.resolve(filepath, filename);
			return obs_readFile()(pathname, typeInfo.encoding || "utf8").switchMap(function (_a) {
				var err = _a[0], text = _a[1];
				return loadMetadataForFile(pathname).map(function (metadata) { return [metadata || {}, text]; });
			}).map(function (_a) {
				var metadata = _a[0], text = _a[1];
				var fileTiddlers;
				if (isTiddlerFile) {
					fileTiddlers = $tw.wiki.deserializeTiddlers(path.extname(pathname), text, metadata) || [];
				}
				else {
					fileTiddlers = [$tw.utils.extend({ text: text }, metadata)];
				}
				var combinedFields = $tw.utils.extend({}, fields, metadata);
				$tw.utils.each(fileTiddlers, function (tiddler) {
					$tw.utils.each(combinedFields, function (fieldInfo, name) {
						if (typeof fieldInfo === "string" || $tw.utils.isArray(fieldInfo)) {
							tiddler[name] = fieldInfo;
						}
						else {
							var value = tiddler[name];
							switch (fieldInfo.source) {
								case "filename":
									value = path.basename(filename);
									break;
								case "filename-uri-decoded":
									value = decodeURIComponent(path.basename(filename));
									break;
								case "basename":
									value = path.basename(filename, path.extname(filename));
									break;
								case "basename-uri-decoded":
									value = decodeURIComponent(path.basename(filename, path.extname(filename)));
									break;
								case "extname":
									value = path.extname(filename);
									break;
								case "created":
									value = new Date(fs.statSync(pathname).birthtime);
									break;
								case "modified":
									value = new Date(fs.statSync(pathname).mtime);
									break;
							}
							if (fieldInfo.prefix) {
								value = fieldInfo.prefix + value;
							}
							if (fieldInfo.suffix) {
								value = value + fieldInfo.suffix;
							}
							tiddler[name] = value;
						}
					});
				});
				return { tiddlers: fileTiddlers };
			});
		} //End processFile()
	}
	;
	/**
	Load the tiddlers from a plugin folder, and package them up into a proper JSON plugin tiddler
	*/
	function loadPluginFolder(filepath, excludeRegExp) {
		excludeRegExp = excludeRegExp || $tw.boot.excludeRegExp;
		//return an observable chain starting with stat'ing the folder
		return obs_stat()(filepath).switchMap(function (_a) {
			var err = _a[0], stat = _a[1];
			//skip down to the catch handler if we can't load this path, but tell the handler
			//to just return null instead of rethrowing the error.
			if (err || !stat.isDirectory()) {
				if (err)
					err.forward = false;
				else
					err = { message: "Directory required", forward: false };
				return rxjs.Observable.throw(err);
			}
			//read the plugin info file
			return obs_readFile()(filepath + path.sep + "plugin.info", "utf8");
		}).switchMap(function (_a) {
			var err = _a[0], data = _a[1];
			if (err)
				throw err;
			var pluginInfo = JSON.parse(data);
			return loadTiddlersFromPath(filepath, excludeRegExp)
				.reduce(function (n, e) { n.push(e); return n; }, [])
				.map(function (tiddlers) { return [tiddlers, pluginInfo]; });
		}).map(function (_a) {
			var pluginFiles = _a[0], pluginInfo = _a[1];
			pluginInfo.tiddlers = pluginInfo.tiddlers || Object.create(null);
			for (var f = 0; f < pluginFiles.length; f++) {
				var tiddlers = pluginFiles[f].tiddlers;
				for (var t = 0; t < tiddlers.length; t++) {
					var tiddler = tiddlers[t];
					if (tiddler.title) {
						pluginInfo.tiddlers[tiddler.title] = tiddler;
					}
				}
			}
			// Give the plugin the same version number as the core if it doesn't have one
			if (!("version" in pluginInfo)) {
				pluginInfo.version = $tw.packageInfo.version;
			}
			// Use "plugin" as the plugin-type if we don't have one
			if (!("plugin-type" in pluginInfo)) {
				pluginInfo["plugin-type"] = "plugin";
			}
			pluginInfo.dependents = pluginInfo.dependents || [];
			pluginInfo.type = "application/json";
			// Set plugin text
			pluginInfo.text = JSON.stringify({ tiddlers: pluginInfo.tiddlers }, null, 4);
			delete pluginInfo.tiddlers;
			// Deserialise array fields (currently required for the dependents field)
			for (var field in pluginInfo) {
				if ($tw.utils.isArray(pluginInfo[field])) {
					pluginInfo[field] = $tw.utils.stringifyList(pluginInfo[field]);
				}
			}
			return pluginInfo;
		}).catch(function (err) {
			if (err.forward === false)
				return rxjs.Observable.of(null);
			else
				return rxjs.Observable.throw(err);
		});
	}
	;
	/**
	name: Name of the plugin to find
	paths: array of file paths to search for it
	Returns the path of the plugin folder or null
	*/
	function findLibraryItem(name, paths) {
		//emits the first path that exists and is a directory
		//otherwise emits null
		return rxjs.Observable.from(paths).concatMap(function (itemPath) {
			var pluginPath = path.resolve(itemPath, "./" + name);
			return obs_stat(pluginPath)(pluginPath);
		}).first(function (_a) {
			var err = _a[0], stat = _a[1], pluginPath = _a[2];
			return (!err && stat.isDirectory());
		}, function (_a) {
			var err = _a[0], stat = _a[1], pluginPath = _a[2];
			return pluginPath;
		}, null);
	}
	;
	/**
	name: Name of the plugin to load
	paths: array of file paths to search for it
	*/
	function loadPlugin(name, paths) {
		return findLibraryItem(name, paths).switchMap(function (pluginPath) {
			if (pluginPath)
				return loadPluginFolder(pluginPath);
			else
				return rxjs.Observable.empty();
		}).map(function (pluginFields) {
			if (pluginFields)
				return $tw.wiki.addTiddler(pluginFields);
		}).ignoreElements();
	}
	;
	/**
	libraryPath: Path of library folder for these plugins (relative to core path)
	envVar: Environment variable name for these plugins
	Returns an array of search paths
	*/
	function getLibraryItemSearchPaths(libraryPath, envVar) {
		var pluginPaths = [path.resolve($tw.boot.corePath, libraryPath)], env = process.env[envVar];
		if (env) {
			env.split(path.delimiter).map(function (item) {
				if (item) {
					pluginPaths.push(item);
				}
			});
		}
		return pluginPaths;
	}
	;
	/**
	plugins: Array of names of plugins (eg, "tiddlywiki/filesystemadaptor")
	libraryPath: Path of library folder for these plugins (relative to core path)
	envVar: Environment variable name for these plugins
	*/
	function loadPlugins(plugins, libraryPath, envVar) {
		if (plugins) {
			var pluginPaths = getLibraryItemSearchPaths(libraryPath, envVar);
			return rxjs.Observable.from(plugins).mergeMap(function (plugin) {
				return loadPlugin(plugin, pluginPaths);
			}, maxConcurrent);
		}
		else {
			return rxjs.Observable.empty();
		}
	}
	;
	/*
	 * Loads the tiddlers from a wiki directory
	 * @param wikiPath - path of wiki directory
	 * @param options
	 * @param options.parentPaths - array of parent paths that we mustn't recurse into
	 * @param options.readOnly - true if the tiddler file paths should not be retained
	 */
	/**
	 *
	 *
	 * @param {any} wikiPath path of wiki directory
	 * @param {any} [options]
	 * @returns
	 */
	function loadWikiTiddlers(wikiPath, options) {
		options = options || {};
		var parentPaths = options.parentPaths || [], wikiInfoPath = path.resolve(wikiPath, $tw.config.wikiInfo), 
		//wikiInfo,
		pluginFields;
		// Bail if we don't have a wiki info file
		return obs_readFile()(wikiInfoPath, "utf8").concatMap(function (_a) {
			var err = _a[0], wikiInfoFile = _a[1];
			if (err)
				return rxjs.Observable.empty();
			var wikiInfo = JSON.parse(wikiInfoFile);
			// Load any parent wikis
			if (wikiInfo.includeWikis) {
				parentPaths = parentPaths.slice(0);
				parentPaths.push(wikiPath);
				return rxjs.Observable.from(wikiInfo.includeWikis).concatMap(function (info) {
					if (typeof info === "string") {
						info = { path: info };
					}
					var resolvedIncludedWikiPath = path.resolve(wikiPath, info.path);
					if (parentPaths.indexOf(resolvedIncludedWikiPath) === -1) {
						return loadWikiTiddlers(resolvedIncludedWikiPath, {
							parentPaths: parentPaths,
							readOnly: info["read-only"]
						}).map(function (subWikiInfo) {
							wikiInfo.build = $tw.utils.extend([], subWikiInfo.build, wikiInfo.build);
						});
					}
					else {
						$tw.utils.error("Cannot recursively include wiki " + resolvedIncludedWikiPath);
					}
				}).count().mapTo(wikiInfo); //drop any output and just forward the wikiInfo.
			}
			return rxjs.Observable.of(wikiInfo);
		}).concatMap(function (wikiInfo) {
			return rxjs.Observable.concat(loadPlugins(wikiInfo.plugins, $tw.config.pluginsPath, $tw.config.pluginsEnvVar), loadPlugins(wikiInfo.themes, $tw.config.themesPath, $tw.config.themesEnvVar), loadPlugins(wikiInfo.languages, $tw.config.languagesPath, $tw.config.languagesEnvVar)).count().mapTo(wikiInfo);
		}).concatMap(function (wikiInfo) {
			// Load the wiki files, registering them as writable
			var resolvedWikiPath = path.resolve(wikiPath, $tw.config.wikiTiddlersSubDir);
			return loadTiddlersFromPath(resolvedWikiPath).do(function (tiddlerFile) {
				if (!options.readOnly && tiddlerFile.filepath) {
					$tw.utils.each(tiddlerFile.tiddlers, function (tiddler) {
						$tw.boot.files[tiddler.title] = {
							filepath: tiddlerFile.filepath,
							type: tiddlerFile.type,
							hasMetaFile: tiddlerFile.hasMetaFile
						};
					});
				}
				$tw.wiki.addTiddlers(tiddlerFile.tiddlers);
			}).count().mapTo([wikiInfo, resolvedWikiPath]);
		}).concatMap(function (_a) {
			var wikiInfo = _a[0], resolvedWikiPath = _a[1];
			// Save the original tiddler file locations if requested
			var config = wikiInfo.config || {};
			if (config["retain-original-tiddler-path"]) {
				var output = {};
				for (var title in $tw.boot.files) {
					output[title] = path.relative(resolvedWikiPath, $tw.boot.files[title].filepath);
				}
				$tw.wiki.addTiddler({ title: "$:/config/OriginalTiddlerPaths", type: "application/json", text: JSON.stringify(output) });
			}
			// Save the path to the tiddlers folder for the filesystemadaptor
			$tw.boot.wikiTiddlersPath = path.resolve($tw.boot.wikiPath, config["default-tiddler-location"] || $tw.config.wikiTiddlersSubDir);
			// Load any plugins, themes and languages listed in the wiki info file
			return rxjs.Observable.from([
				path.resolve(wikiPath, $tw.config.wikiPluginsSubDir),
				path.resolve(wikiPath, $tw.config.wikiThemesSubDir),
				path.resolve(wikiPath, $tw.config.wikiLanguagesSubDir)
			]).mergeMap(function (pluginPath) {
				return obs_readdir(pluginPath)(pluginPath);
			}).mergeMap(function (_a) {
				var err = _a[0], pluginFolders = _a[1], pluginPath = _a[2];
				if (err)
					return rxjs.Observable.empty();
				else
					return rxjs.Observable.from(pluginFolders.map(function (a) { return [a, pluginPath]; }));
			}).mergeMap(function (_a) {
				var pluginFolder = _a[0], pluginPath = _a[1];
				return loadPluginFolder(path.resolve(pluginPath, "./" + pluginFolder));
			}).map(function (pluginFields) {
				$tw.wiki.addTiddler(pluginFields);
			}).count().mapTo(wikiInfo);
		}).defaultIfEmpty(null); //emit null if we don't emit anything else
	}
	;
	function loadTiddlersNode() {
		// Load the boot tiddlers
		return rxjs.Observable.merge(
		//load the boot tiddlers
		loadTiddlersFromPath($tw.boot.bootPath).do(function (tiddlerFile) {
			$tw.wiki.addTiddlers(tiddlerFile.tiddlers);
		}).ignoreElements(), 
		//load the core plugin
		loadPluginFolder($tw.boot.corePath).do(function (coreTiddlers) {
			$tw.wiki.addTiddler(coreTiddlers);
		}).ignoreElements(), 
		//load the data folder, if we have one
		($tw.boot.wikiPath ? loadWikiTiddlers($tw.boot.wikiPath).do(function (wikiInfo) {
			$tw.boot.wikiInfo = wikiInfo;
		}) : rxjs.Observable.empty())).ignoreElements();
	}
	;
	$tw.utils.extend($tw, {
		loadTiddlersFromFile: loadTiddlersFromFile,
		loadMetadataForFile: loadMetadataForFile,
		loadTiddlersFromPath: loadTiddlersFromPath,
		loadTiddlersFromSpecification: loadTiddlersFromSpecification,
		loadPluginFolder: loadPluginFolder,
		findLibraryItem: findLibraryItem,
		loadPlugin: loadPlugin,
		getLibraryItemSearchPaths: getLibraryItemSearchPaths,
		loadPlugins: loadPlugins,
		loadWikiTiddlers: loadWikiTiddlers,
		loadTiddlersNode: loadTiddlersNode
	});
}
exports.bootNode = bootNode;
