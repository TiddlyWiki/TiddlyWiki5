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
	// Basic tiddler operations
	db.exec({
		sql: `
		DROP TABLE IF EXISTS tiddlers;
		CREATE TABLE tiddlers (
			title TEXT NOT NULL,
			shadow INTEGER NOT NULL CHECK (shadow = 0 OR shadow = 1), -- 0=real tiddler, 1=shadow tiddler
			shadowsource TEXT,
			meta TEXT NOT NULL,
			text TEXT NOT NULL,
			PRIMARY KEY(title,shadow)
		);
		CREATE INDEX tiddlers_title_index ON tiddlers(title);
		`
	});
	/*
	Save a tiddler. shadowSource should be falsy for ordinary tiddlers, or the source plugin title for shadow tiddlers
	*/
	var statementSaveTiddler = db.prepare("replace into tiddlers(title,shadow,shadowsource,meta,text) values ($title,$shadow,$shadowsource,$meta,$text);");
	function sqlSaveTiddler(tiddlerFields,shadowSource) {
		statementSaveTiddler.bind({
			$title: tiddlerFields.title,
			$shadow: shadowSource ? 1 : 0,
			$shadowsource: shadowSource ? shadowSource : null,
			$meta: JSON.stringify(Object.assign({},tiddlerFields,{title: undefined, text: undefined})),
			$text: tiddlerFields.text || ""
		});
		statementSaveTiddler.step();
		statementSaveTiddler.reset();
	}
	function sqlDeleteTiddler(title) {
		db.exec({
			sql: "delete from tiddlers where title = $title and shadow = 0",
			bind: {
				$title: title
			}
		});
	}
	function sqlClearShadows() {
		db.exec({
			sql: "delete from tiddlers where shadow = 1"
		});
	}
	var statementTiddlerExists = db.prepare("select title from tiddlers where title = $title and shadow = 0;")
	function sqlTiddlerExists(title) {
		statementTiddlerExists.bind({
			$title: title
		});
		if(statementTiddlerExists.step()) {
			statementTiddlerExists.reset();
			return true;
		} else {
			statementTiddlerExists.reset();
			return false;
		}
	}
	var statementGetTiddler = db.prepare("select title, shadow, meta, text from tiddlers where title = $title order by shadow");
	function sqlGetTiddler(title) {
		statementGetTiddler.bind({
			$title: title
		});
		if(statementGetTiddler.step()) {
			var row = statementGetTiddler.get({});
			statementGetTiddler.reset();
			return Object.assign({},JSON.parse(row.meta),{title: row.title, text: row.text});
		} else {
			statementGetTiddler.reset();
			return undefined;
		}
	}
	var statementGetShadowSource = db.prepare("select title, shadowsource from tiddlers where title = $title and shadow = 1");
	function sqlGetShadowSource(title) {
		statementGetShadowSource.bind({
			$title: title
		});
		if(statementGetShadowSource.step()) {
			var row = statementGetShadowSource.get({});
			statementGetShadowSource.reset();
			return row.shadowsource;
		} else {
			statementGetShadowSource.reset();
			return undefined;
		}

	}
	var statementAllTitles = db.prepare("select title from tiddlers where shadow = 0 order by title");
	function sqlAllTitles() {
		let resultRows = [];
		while(statementAllTitles.step()) {
			var row = statementAllTitles.get({});
			resultRows.push(row.title);
		}
		statementAllTitles.reset();
		return resultRows;
	}
	var statementAllShadowTitles = db.prepare("select title from tiddlers where shadow = 1 order by title");
	function sqlAllShadowTitles() {
		let resultRows = [];
		while(statementAllShadowTitles.step()) {
			var row = statementAllShadowTitles.get({});
			resultRows.push(row.title);
		}
		statementAllShadowTitles.reset();
		return resultRows;
	}
	var statementEachTiddler = db.prepare("select title, meta, text from tiddlers where shadow = 0 order by title");
	function sqlEachTiddler(callback) {
		while(statementEachTiddler.step()) {
			var row = statementEachTiddler.get({}),
				tiddlerFields = Object.assign({},JSON.parse(row.meta),{title: row.title, text: row.text});
			callback(tiddlerFields,row.title);
		}
		statementEachTiddler.reset();
	}
	/*
	We get all the rows where either the shadow field is 1 and there is no row with the same title and
	a shadow field value of zero, or the shadow field is zero and there also exists a row with the same
	title and a shadow field value of 1
	*/
	var statementEachShadowTiddler = db.prepare(`
			select title, meta, text
			from tiddlers t1
			where t1.shadow = 1
				and not exists (
					select 1
					from tiddlers t2
					where t2.title = t1.title
						and t2.shadow = 0
				)
		union
			select title, meta, text
			from tiddlers t3
			where t3.shadow = 0
				and exists (
					select 1
					from tiddlers t4
					where t4.title = t3.title
						and t4.shadow = 1
				);
		order by title;
	`);
	function sqlEachShadowTiddler(callback) {
		while(statementEachShadowTiddler.step()) {
			var row = statementEachShadowTiddler.get({});
			var tiddlerFields = Object.assign({},JSON.parse(row.meta),{title: row.title, text: row.text});
			callback(tiddlerFields,row.title);	
		}
		statementEachShadowTiddler.reset();
	}
	/*
	Return all the tiddler rows that have the "shadow" field set to 1, but only where the "title"
	field doesn't appear in a row with the "shadow" field set to 0
	*/
	var statementEachTiddlerPlusShadows = db.prepare(`
			select title,meta,text from tiddlers t1
			where t1.shadow = 1
				and not exists (
					select 1
					from tiddlers t2
					where t2.title = t1.title
						and t2.shadow = 0
					)
			order by t1.title;
		`);
	function sqlEachTiddlerPlusShadows(callback) {
		sqlEachTiddler(callback);
		while(statementEachTiddlerPlusShadows.step()) {
			var row = statementEachTiddlerPlusShadows.get({});
			var tiddlerFields = Object.assign({},JSON.parse(row.meta),{title: row.title, text: row.text});
			callback(tiddlerFields,row.title);	
		}
		statementEachTiddlerPlusShadows.reset();
	}
	/*
	Return all rows where the shadow field is zero, and there is no row with the same title and a shadow field of 1
	*/
	var statementEachShadowPlusTiddlers = db.prepare(`
			select title,meta,text from tiddlers t1
			where t1.shadow = 0
				and not exists (
					select 1
					from tiddlers t2
					where t2.title = t1.title
						and t2.shadow = 1
					)
			order by t1.title;
		`);
	function sqlEachShadowPlusTiddlers(callback) {
		sqlEachShadowTiddler(callback);
		while(statementEachShadowPlusTiddlers.step()) {
			var row = statementEachShadowPlusTiddlers.get({});
			var tiddlerFields = Object.assign({},JSON.parse(row.meta),{title: row.title, text: row.text});
			callback(tiddlerFields,row.title);	
		}
		statementEachShadowPlusTiddlers.reset();
	}
	// Plain JS wiki store implementation follows
	options = options || {};
	var self = this,
	getTiddlerTitles = function() {
		return sqlAllTitles();
	},
	pluginTiddlers = [], // Array of tiddlers containing registered plugins, ordered by priority
	pluginInfo = Object.create(null), // Hashmap of parsed plugin content
	getShadowTiddlerTitles = function() {
		return sqlAllShadowTitles();
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
console.log("Saving",title,tiddler.fields);
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
		sqlEachTiddler(function(tiddlerFields,title) {
			callback(new $tw.Tiddler(tiddlerFields),title);
		});
	};

	// Get an array of all shadow tiddler titles
	this.allShadowTitles = function() {
		return getShadowTiddlerTitles();
	};

	// Iterate through all shadow tiddler titles
	this.eachShadow = function(callback) {
		sqlEachShadowTiddler(function(tiddlerFields,title) {
			callback(new $tw.Tiddler(tiddlerFields),title);
		});
	};

	// Iterate through all tiddlers and then the shadows
	this.eachTiddlerPlusShadows = function(callback) {
		sqlEachTiddlerPlusShadows(function(tiddlerFields,title) {
			callback(new $tw.Tiddler(tiddlerFields),title);
		});
	};

	// Iterate through all the shadows and then the tiddlers
	this.eachShadowPlusTiddlers = function(callback) {
		sqlEachShadowPlusTiddlers(function(tiddlerFields,title) {
			callback(new $tw.Tiddler(tiddlerFields),title);
		});
	};

	this.tiddlerExists = function(title) {
		return sqlTiddlerExists(title);
	};

	this.isShadowTiddler = function(title) {
		return !!sqlGetShadowSource(title);
	};

	this.getShadowSource = function(title) {
		return sqlGetShadowSource(title);
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
		sqlClearShadows();
		eachObj(pluginTiddlers,function(tiddler) {
			// Extract the constituent tiddlers
			if(hop(pluginInfo,tiddler.fields.title)) {
				eachObj(pluginInfo[tiddler.fields.title].tiddlers,function(constituentTiddler,constituentTitle) {
					// Save the tiddler object
					if(constituentTitle) {
						var shadowTiddler = Object.assign({},constituentTiddler,{title: constituentTitle})
						sqlSaveTiddler(shadowTiddler,tiddler.fields.title);
					}
				});
			}
		});
		this.clearCache(null);
		this.clearGlobalCache();
	};
};

})();
//# sourceURL=$:/plugins/tiddlywiki/sqlite3store/sql-wiki-store.js