/*\
title: $:/plugins/tiddlywiki/sqlite3store/sql-wiki-store.js
type: application/javascript

A sqlite3 implementation of a wiki store object

This file is spliced into the HTML file to be executed before the boot kernel has been loaded.

\*/

(function() {

$tw.Wiki = function(options) {
	options = options || {};
	this.sqlFunctions = new $tw.SqlFunctions();
	// Adapted version of the boot.js wiki store implementation follows
	var self = this,
	getTiddlerTitles = function() {
		return self.sqlFunctions.sqlAllTitles();
	},
	pluginTiddlers = [], // Array of tiddlers containing registered plugins, ordered by priority
	pluginInfo = Object.create(null), // Hashmap of parsed plugin content
	getShadowTiddlerTitles = function() {
		return self.sqlFunctions.sqlAllShadowTitles();
	};
	// $tw.utils replacements
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

	this.logTables = function() {
		self.sqlFunctions.sqlLogTables();
	}

	var tagIndexer;

	this.addIndexer = function(indexer,name) {
		switch(indexer.constructor.name) {
			case "TagIndexer":
				tagIndexer = new TagIndexer(this);
				break;
		}
	};

	function TagSubIndexer(indexer,iteratorMethod) {
		this.indexer = indexer;
		this.iteratorMethod = iteratorMethod;
	}

	TagSubIndexer.prototype.addIndexMethod = function() {
		var self = this;
		this.indexer.wiki[this.iteratorMethod].byTag = function(tag) {
			return self.lookup(tag).slice(0);
		};
	};

	TagSubIndexer.prototype.lookup = function(tag) {
		return self.sqlFunctions.sqlGetTiddlersWithTag(tag,this.iteratorMethod);
	};

	function TagIndexer(wiki) {
		this.wiki = wiki;
		this.subIndexers = [
			new TagSubIndexer(this,"each"),
			new TagSubIndexer(this,"eachShadow"),
			new TagSubIndexer(this,"eachTiddlerPlusShadows"),
			new TagSubIndexer(this,"eachShadowPlusTiddlers")
		];
		$tw.utils.each(this.subIndexers,function(subIndexer) {
			subIndexer.addIndexMethod();
		});
	}

	this.getIndexer = function(name) {
		switch(name) {
			case "TagIndexer":
				return tagIndexer;
		}
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
				self.sqlFunctions.sqlSaveTiddler(tiddler.getFieldStrings());
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
			self.sqlFunctions.sqlDeleteTiddler(title);
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
			var t = self.sqlFunctions.sqlGetTiddler(title);
			if(t !== undefined) {
				return new $tw.Tiddler(t);
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
		self.sqlFunctions.sqlEachTiddler(function(tiddlerFields,title) {
			callback(new $tw.Tiddler(tiddlerFields),title);
		});
	};

	// Get an array of all shadow tiddler titles
	this.allShadowTitles = function() {
		return getShadowTiddlerTitles();
	};

	// Iterate through all shadow tiddler titles
	this.eachShadow = function(callback) {
		self.sqlFunctions.sqlEachShadowTiddler(function(tiddlerFields,title) {
			callback(new $tw.Tiddler(tiddlerFields),title);
		});
	};

	// Iterate through all tiddlers and then the shadows
	this.eachTiddlerPlusShadows = function(callback) {
		self.sqlFunctions.sqlEachTiddlerPlusShadows(function(tiddlerFields,title) {
			callback(new $tw.Tiddler(tiddlerFields),title);
		});
	};

	// Iterate through all the shadows and then the tiddlers
	this.eachShadowPlusTiddlers = function(callback) {
		self.sqlFunctions.sqlEachShadowPlusTiddlers(function(tiddlerFields,title) {
			callback(new $tw.Tiddler(tiddlerFields),title);
		});
	};

	this.tiddlerExists = function(title) {
		return self.sqlFunctions.sqlTiddlerExists(title);
	};

	this.isShadowTiddler = function(title) {
		return !!self.sqlFunctions.sqlGetShadowSource(title);
	};

	this.getShadowSource = function(title) {
		return self.sqlFunctions.sqlGetShadowSource(title);
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
		self.sqlFunctions.sqlClearShadows();
		eachObj(pluginTiddlers,function(tiddler) {
			// Extract the constituent tiddlers
			if(hop(pluginInfo,tiddler.fields.title)) {
				eachObj(pluginInfo[tiddler.fields.title].tiddlers,function(constituentTiddler,constituentTitle) {
					// Save the tiddler object
					if(constituentTitle) {
						var shadowTiddler = Object.assign({},constituentTiddler,{title: constituentTitle})
						self.sqlFunctions.sqlSaveTiddler(shadowTiddler,tiddler.fields.title);
					}
				});
			}
		});
		this.clearCache(null);
		this.clearGlobalCache();
	};

	if(this.addIndexersToWiki) {
		this.addIndexersToWiki();
	}
};

})();
//# sourceURL=$:/plugins/tiddlywiki/sqlite3store/sql-wiki-store.js