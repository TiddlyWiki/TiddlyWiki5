/*\
title: $:/plugins/tiddlywiki/sqlite3store/sql-wiki-store.js
type: application/javascript

A sqlite3 implementation of a wiki store object

This file is spliced into the HTML file to be executed before the boot kernel has been loaded.

\*/

(function() {

$tw.Wiki = function(options) {
	// Create a test database and store and retrieve some data
	var db = new $tw.sqlite3.oo1.DB("/tiddlywiki.sqlite3","c");
	db.exec({
		sql:"CREATE TABLE IF NOT EXISTS t(a,b)"
	});
	db.exec({
		sql: "insert into t(a,b) values (?,?)",
		bind: [3, 1415926]
	});
	db.exec({
		sql: "insert into t(a,b) values (?,?)",
		bind: [1, 4142136]
	});
	let resultRows = [];
	db.exec({
		sql: "select a, b from t order by a limit 3",
		rowMode: "object",
		resultRows: resultRows
	});
	console.log("Result rows:",JSON.stringify(resultRows,undefined,2));
	// Basic tiddler operations
	db.exec({
		sql: [
			"CREATE TABLE IF NOT EXISTS tiddlers (title TEXT PRIMARY KEY,meta TEXT,text TEXT);",
			"CREATE INDEX tiddlers_title_index ON tiddlers(title);"
	]
	});
	function sqlSaveTiddler(tiddlerFields) {
		db.exec({
			sql: "replace into tiddlers(title,meta,text) values ($title,$meta,$text)",
			bind: {
				$title: tiddlerFields.title,
				$meta: JSON.stringify(Object.assign({},tiddlerFields,{title: undefined, text: undefined})),
				$text: tiddlerFields.text || ""
			}
		});
	}
	function sqlDeleteTiddler(title) {
		db.exec({
			sql: "delete from tiddlers where title = $title",
			bind: {
				$title: title
			}
		});
	}
	function sqlGetTiddler(title) {
		let resultRows = [];
		db.exec({
			sql: "select title, meta, text from tiddlers where title = $title",
			bind: {
				$title: title
			},
			rowMode: "object",
			resultRows: resultRows
		});
		if(resultRows.length > 0) {
			return Object.assign({},JSON.parse(resultRows[0].meta),{title: resultRows[0].title, text: resultRows[0].text});
		} else {
			return undefined;
		}
	}
	function sqlAllTitles() {
		let resultRows = [];
		db.exec({
			sql: "select title from tiddlers order by title",
			rowMode: "object",
			resultRows: resultRows
		});
		return resultRows.map(row => {
			return row.title;
		});
	}
	sqlSaveTiddler({title: "HelloThere", text: "One"});
	console.log(sqlGetTiddler("HelloThere"));
	sqlSaveTiddler({title: "HelloThere", text: "Two", custom: "A custom field"});
	console.log(sqlGetTiddler("HelloThere"));
	sqlSaveTiddler({title: "AnotherTiddler", text: "Three"});
	console.log(sqlAllTitles());
	// Plain JS wiki store implementation follows
	options = options || {};
	var self = this,
	getTiddlerTitles = function() {
		return sqlAllTitles();
	},
	pluginTiddlers = [], // Array of tiddlers containing registered plugins, ordered by priority
	pluginInfo = Object.create(null), // Hashmap of parsed plugin content
	shadowTiddlers = Object.create(null), // Hashmap by title of {source:, tiddler:}
	getShadowTiddlerTitles = function() {
		return Object.keys(shadowTiddlers);
	};
	//$tw.utils replacements
	var eachObj = function(object,callback) {
		var next,f,length;
		if(object) {
			if(Object.prototype.toString.call(object) == "[object Array]") {
				for (f=0, length=object.length; f<length; f++) {
					next = callback(object[f],f,object);
					if(next === false) {
						break;
					}
				}
			} else {
				var keys = Object.keys(object);
				for (f=0, length=keys.length; f<length; f++) {
					var key = keys[f];
					next = callback(object[key],key,object);
					if(next === false) {
						break;
					}
				}
			}
		}
	},
	hop = function(object,property) {
		return object ? Object.prototype.hasOwnProperty.call(object,property) : false;
	},
	insertSortedArray = function(array,value) {
		var low = 0, high = array.length - 1, mid, cmp;
		while(low <= high) {
			mid = (low + high) >> 1;
			cmp = value.localeCompare(array[mid]);
			if(cmp > 0) {
				low = mid + 1;
			} else if(cmp < 0) {
				high = mid - 1;
			} else {
				return array;
			}
		}
		array.splice(low,0,value);
		return array;
	},
	parseJSONSafe = function(text,defaultJSON) {
		try {
			return JSON.parse(text);
		} catch(e) {
			if(typeof defaultJSON === "function") {
				return defaultJSON(e);
			} else {
				return defaultJSON || {};
			}
		}
	};

	this.addIndexer = function(indexer,name) {
		return;
	};

	this.getIndexer = function(name) {
		return null;
	};

	// Add a tiddler to the store
	this.addTiddler = function(tiddler) {
		if(!(tiddler instanceof $tw.Tiddler)) {
			tiddler = new $tw.Tiddler(tiddler);
		}
		// Save the tiddler
		if(tiddler) {
			var title = tiddler.fields.title;
			if(title) {
				// Save the new tiddler
				sqlSaveTiddler(tiddler.fields);
				// Update caches
				this.clearCache(title);
				this.clearGlobalCache();
				// Queue a change event
				this.enqueueTiddlerEvent(title);
			}
		}
	};

	// Delete a tiddler
	this.deleteTiddler = function(title) {
		// Uncomment the following line for detailed logs of all tiddler deletions
		// console.log("Deleting",title)
		if(self.tiddlerExists(title)) {
			// Delete the tiddler
			sqlDeleteTiddler(title);
			// Update caches
			this.clearCache(title);
			this.clearGlobalCache();
			// Queue a change event
			this.enqueueTiddlerEvent(title,true);
		}
	};

	// Get a tiddler from the store
	this.getTiddler = function(title) {
		if(title) {
			var t = sqlGetTiddler(title);
			if(t !== undefined) {
				return new $tw.Tiddler(t);
			} else {
				var s = shadowTiddlers[title];
				if(s !== undefined) {
					return s.tiddler;
				}
			}
		}
		return undefined;
	};

	// Get an array of all tiddler titles
	this.allTitles = function() {
		return getTiddlerTitles();
	};

	// Iterate through all tiddler titles
	this.each = function(callback) {
		var titles = getTiddlerTitles(),
			index,titlesLength,title;
		for(index = 0, titlesLength = titles.length; index < titlesLength; index++) {
			title = titles[index];
			callback(self.getTiddler(title),title);
		}
	};

	// Get an array of all shadow tiddler titles
	this.allShadowTitles = function() {
		return getShadowTiddlerTitles();
	};

	// Iterate through all shadow tiddler titles
	this.eachShadow = function(callback) {
		var titles = getShadowTiddlerTitles(),
			index,titlesLength,title;
		for(index = 0, titlesLength = titles.length; index < titlesLength; index++) {
			title = titles[index];
			if(self.tiddlerExists(title)) {
				callback(self.getTiddler(title),title);
			} else {
				var shadowInfo = shadowTiddlers[title];
				callback(shadowInfo.tiddler,title);
			}
		}
	};

	// Iterate through all tiddlers and then the shadows
	this.eachTiddlerPlusShadows = function(callback) {
		var index,titlesLength,title,
			titles = getTiddlerTitles();
		for(index = 0, titlesLength = titles.length; index < titlesLength; index++) {
			title = titles[index];
			callback(self.getTiddler(title),title);
		}
		titles = getShadowTiddlerTitles();
		for(index = 0, titlesLength = titles.length; index < titlesLength; index++) {
			title = titles[index];
			if(!self.tiddlerExists(title)) {
				var shadowInfo = shadowTiddlers[title];
				callback(shadowInfo.tiddler,title);
			}
		}
	};

	// Iterate through all the shadows and then the tiddlers
	this.eachShadowPlusTiddlers = function(callback) {
		var index,titlesLength,title,
			titles = getShadowTiddlerTitles();
		for(index = 0, titlesLength = titles.length; index < titlesLength; index++) {
			title = titles[index];
			if(self.tiddlerExists(title)) {
				callback(self.getTiddler(title),title);
			} else {
				var shadowInfo = shadowTiddlers[title];
				callback(shadowInfo.tiddler,title);
			}
		}
		titles = getTiddlerTitles();
		for(index = 0, titlesLength = titles.length; index < titlesLength; index++) {
			title = titles[index];
			if(!shadowTiddlers[title]) {
				callback(self.getTiddler(title),title);
			}
		}
	};

	this.tiddlerExists = function(title) {
		return !!sqlGetTiddler(title);
	};

	this.isShadowTiddler = function(title) {
		return hop(shadowTiddlers,title);
	};

	this.getShadowSource = function(title) {
		if(hop(shadowTiddlers,title)) {
			return shadowTiddlers[title].source;
		}
		return null;
	};

	// Get an array of all the currently recognised plugin types
	this.getPluginTypes = function() {
		var types = [];
		eachObj(pluginTiddlers,function(pluginTiddler) {
			var pluginType = pluginTiddler.fields["plugin-type"];
			if(pluginType && types.indexOf(pluginType) === -1) {
				types.push(pluginType);
			}
		});
		return types;
	};

	// Read plugin info for all plugins, or just an array of titles. Returns the number of plugins updated or deleted
	this.readPluginInfo = function(titles) {
		var results = {
			modifiedPlugins: [],
			deletedPlugins: []
		};
		eachObj(titles || getTiddlerTitles(),function(title) {
			var tiddler = self.getTiddler(title);
			if(tiddler) {
				if(tiddler.fields.type === "application/json" && tiddler.hasField("plugin-type") && tiddler.fields.text) {
					pluginInfo[tiddler.fields.title] = parseJSONSafe(tiddler.fields.text);
					results.modifiedPlugins.push(tiddler.fields.title);
				}
			} else {
				if(pluginInfo[title]) {
					delete pluginInfo[title];
					results.deletedPlugins.push(title);
				}
			}
		});
		return results;
	};

	// Get plugin info for a plugin
	this.getPluginInfo = function(title) {
		return pluginInfo[title];
	};

	// Register the plugin tiddlers of a particular type, or null/undefined for any type, optionally restricting registration to an array of tiddler titles. Return the array of titles affected
	this.registerPluginTiddlers = function(pluginType,titles) {
		var self = this,
			registeredTitles = [],
			checkTiddler = function(tiddler,title) {
				if(tiddler && tiddler.fields.type === "application/json" && tiddler.fields["plugin-type"] && (!pluginType || tiddler.fields["plugin-type"] === pluginType)) {
					var disablingTiddler = self.getTiddler("$:/config/Plugins/Disabled/" + title);
					if(title === "$:/core" || !disablingTiddler || (disablingTiddler.fields.text || "").trim() !== "yes") {
						self.unregisterPluginTiddlers(null,[title]); // Unregister the plugin if it's already registered
						pluginTiddlers.push(tiddler);
						registeredTitles.push(tiddler.fields.title);
					}
				}
			};
		if(titles) {
			eachObj(titles,function(title) {
				checkTiddler(self.getTiddler(title),title);
			});
		} else {
			this.each(function(tiddler,title) {
				checkTiddler(tiddler,title);
			});
		}
		return registeredTitles;
	};

	// Unregister the plugin tiddlers of a particular type, or null/undefined for any type, optionally restricting unregistering to an array of tiddler titles. Returns an array of the titles affected
	this.unregisterPluginTiddlers = function(pluginType,titles) {
		var self = this,
			unregisteredTitles = [];
		// Remove any previous registered plugins of this type
		for(var t=pluginTiddlers.length-1; t>=0; t--) {
			var tiddler = pluginTiddlers[t];
			if(tiddler.fields["plugin-type"] && (!pluginType || tiddler.fields["plugin-type"] === pluginType) && (!titles || titles.indexOf(tiddler.fields.title) !== -1)) {
				unregisteredTitles.push(tiddler.fields.title);
				pluginTiddlers.splice(t,1);
			}
		}
		return unregisteredTitles;
	};

	// Unpack the currently registered plugins, creating shadow tiddlers for their constituent tiddlers
	this.unpackPluginTiddlers = function() {
		var self = this;
		// Sort the plugin titles by the `plugin-priority` field
		pluginTiddlers.sort(function(a,b) {
			if("plugin-priority" in a.fields && "plugin-priority" in b.fields) {
				return a.fields["plugin-priority"] - b.fields["plugin-priority"];
			} else if("plugin-priority" in a.fields) {
				return -1;
			} else if("plugin-priority" in b.fields) {
				return +1;
			} else if(a.fields.title < b.fields.title) {
				return -1;
			} else if(a.fields.title === b.fields.title) {
				return 0;
			} else {
				return +1;
			}
		});
		// Now go through the plugins in ascending order and assign the shadows
		shadowTiddlers = Object.create(null);
		eachObj(pluginTiddlers,function(tiddler) {
			// Extract the constituent tiddlers
			if(hop(pluginInfo,tiddler.fields.title)) {
				eachObj(pluginInfo[tiddler.fields.title].tiddlers,function(constituentTiddler,constituentTitle) {
					// Save the tiddler object
					if(constituentTitle) {
						shadowTiddlers[constituentTitle] = {
							source: tiddler.fields.title,
							tiddler: new $tw.Tiddler(constituentTiddler,{title: constituentTitle})
						};
					}
				});
			}
		});
		shadowTiddlerTitles = null;
		this.clearCache(null);
		this.clearGlobalCache();
	};
};

})();
//# sourceURL=$:/plugins/tiddlywiki/sqlite3store/sql-wiki-store.js