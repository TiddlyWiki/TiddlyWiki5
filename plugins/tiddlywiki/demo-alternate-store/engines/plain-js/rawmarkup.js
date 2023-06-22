/*\
title: $:/plugins/tiddlywiki/demo-alternate-store/engines/plain-js/rawmarkup.js
type: text/plain
tags: $:/tags/AlternateStoreArea

Startup code injected as raw markup

\*/

(function() {

// Need to initialise these because we run before bootprefix.js and boot.js
$tw = window.$tw || Object.create(null);
$tw.hooks = $tw.hooks || { names: {}};
$tw.boot = $tw.boot || {};
$tw.boot.preloadDirty = $tw.boot.preloadDirty || [];

$tw.Wiki = function(options) {
	options = options || {};
	var self = this,
	tiddlers = Object.create(null), // Hashmap of tiddlers
	tiddlerTitles = null, // Array of tiddler titles
	getTiddlerTitles = function() {
		if(!tiddlerTitles) {
			tiddlerTitles = Object.keys(tiddlers).sort(function(a,b) {return a.localeCompare(b);});
		}
		return tiddlerTitles;
	},
	pluginTiddlers = [], // Array of tiddlers containing registered plugins, ordered by priority
	pluginInfo = Object.create(null), // Hashmap of parsed plugin content
	shadowTiddlers = Object.create(null), // Hashmap by title of {source:, tiddler:}
	shadowTiddlerTitles = null,
	getShadowTiddlerTitles = function() {
		if(!shadowTiddlerTitles) {
			shadowTiddlerTitles = Object.keys(shadowTiddlers);
		}
		return shadowTiddlerTitles;
	},
	enableIndexers = options.enableIndexers || null,
	indexers = [],
	indexersByName = Object.create(null);
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
		// Bail if this indexer is not enabled
		if(enableIndexers && enableIndexers.indexOf(name) === -1) {
			return;
		}
		indexers.push(indexer);
		indexersByName[name] = indexer;
		indexer.init();
	};

	this.getIndexer = function(name) {
		return indexersByName[name] || null;
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
				// Uncomment the following line for detailed logs of all tiddler writes
				// console.log("Adding",title,tiddler)
				// Record the old tiddler state
				var updateDescriptor = {
					old: {
						tiddler: this.getTiddler(title),
						shadow: this.isShadowTiddler(title),
						exists: this.tiddlerExists(title)
					}
				}
				// Save the new tiddler
				tiddlers[title] = tiddler;
				// Check we've got the title
				tiddlerTitles = insertSortedArray(tiddlerTitles || [],title);
				// Record the new tiddler state
				updateDescriptor["new"] = {
					tiddler: tiddler,
					shadow: this.isShadowTiddler(title),
					exists: this.tiddlerExists(title)
				}
				// Update indexes
				this.clearCache(title);
				this.clearGlobalCache();
				eachObj(indexers,function(indexer) {
					indexer.update(updateDescriptor);
				});
				// Queue a change event
				this.enqueueTiddlerEvent(title);
			}
		}
	};

	// Delete a tiddler
	this.deleteTiddler = function(title) {
		// Uncomment the following line for detailed logs of all tiddler deletions
		// console.log("Deleting",title)
		if(hop(tiddlers,title)) {
			// Record the old tiddler state
			var updateDescriptor = {
				old: {
					tiddler: this.getTiddler(title),
					shadow: this.isShadowTiddler(title),
					exists: this.tiddlerExists(title)
				}
			}
			// Delete the tiddler
			delete tiddlers[title];
			// Delete it from the list of titles
			if(tiddlerTitles) {
				var index = tiddlerTitles.indexOf(title);
				if(index !== -1) {
					tiddlerTitles.splice(index,1);
				}
			}
			// Record the new tiddler state
			updateDescriptor["new"] = {
				tiddler: this.getTiddler(title),
				shadow: this.isShadowTiddler(title),
				exists: this.tiddlerExists(title)
			}
			// Update indexes
			this.clearCache(title);
			this.clearGlobalCache();
			eachObj(indexers,function(indexer) {
				indexer.update(updateDescriptor);
			});
			// Queue a change event
			this.enqueueTiddlerEvent(title,true);
		}
	};

	// Get a tiddler from the store
	this.getTiddler = function(title) {
		if(title) {
			var t = tiddlers[title];
			if(t !== undefined) {
				return t;
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
		return getTiddlerTitles().slice(0);
	};

	// Iterate through all tiddler titles
	this.each = function(callback) {
		var titles = getTiddlerTitles(),
			index,titlesLength,title;
		for(index = 0, titlesLength = titles.length; index < titlesLength; index++) {
			title = titles[index];
			callback(tiddlers[title],title);
		}
	};

	// Get an array of all shadow tiddler titles
	this.allShadowTitles = function() {
		return getShadowTiddlerTitles().slice(0);
	};

	// Iterate through all shadow tiddler titles
	this.eachShadow = function(callback) {
		var titles = getShadowTiddlerTitles(),
			index,titlesLength,title;
		for(index = 0, titlesLength = titles.length; index < titlesLength; index++) {
			title = titles[index];
			if(tiddlers[title]) {
				callback(tiddlers[title],title);
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
			callback(tiddlers[title],title);
		}
		titles = getShadowTiddlerTitles();
		for(index = 0, titlesLength = titles.length; index < titlesLength; index++) {
			title = titles[index];
			if(!tiddlers[title]) {
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
			if(tiddlers[title]) {
				callback(tiddlers[title],title);
			} else {
				var shadowInfo = shadowTiddlers[title];
				callback(shadowInfo.tiddler,title);
			}
		}
		titles = getTiddlerTitles();
		for(index = 0, titlesLength = titles.length; index < titlesLength; index++) {
			title = titles[index];
			if(!shadowTiddlers[title]) {
				callback(tiddlers[title],title);
			}
		}
	};

	this.tiddlerExists = function(title) {
		return !!hop(tiddlers,title);
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
			var tiddler = tiddlers[title];
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
		eachObj(indexers,function(indexer) {
			indexer.rebuild();
		});
	};

	if(this.addIndexersToWiki) {
		this.addIndexersToWiki();
	}
};

})();
//# sourceURL=$:/plugins/tiddlywiki/demo-alternate-store/engines/plain-js/rawmarkup.js