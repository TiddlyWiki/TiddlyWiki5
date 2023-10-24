/*\
title: $:/plugins/tiddlywiki/sqlite3store/sql-functions.js
type: application/javascript

Functions to perform basic tiddler operations with a sqlite3 database

This file is spliced into the HTML file to be executed before the boot kernel has been loaded.

\*/

(function() {

$tw.SqlFunctions = function(options) {
	options = options || {};
	var self = this;
	// Setting useCustomCollation to true allows the tests to pass (run `tiddlywiki editions/test/ --build index`)
	// - but it takes 6 times longer to boot the prerelease than with useCustomCollation set to false
	var useCustomCollation = false;
	var COLLATION_CLAUSE = useCustomCollation ? "COLLATE custom_collation" : "";
	// Create anonymous database
	this.db = new $tw.sqlite3.oo1.DB("","c");
	// Setup custom collation to precisely match existing sort orders
	// Create field with `title TEXT NOT NULL COLLATE custom_collation`
	// Use it like `... order by shadow collate custom_collation`
	if(useCustomCollation) {
		function customCollation(ptr,lenA,a,lenB,b) {
			// There may be a problem here: lenA and lenB are the lengths of the two UTF8 strings in bytes,
			// and yet we're using them with JS slice() method which counts in characters
			var jsA = $tw.sqlite3.wasm.cstrToJs(a).slice(0,lenA),
				jsB = $tw.sqlite3.wasm.cstrToJs(b).slice(0,lenB);
			return jsA.localeCompare(jsB);
		}
		var SQLITE_UTF8 =           1; /* IMP: R-37514-35566 */
		var SQLITE_UTF16LE =        2; /* IMP: R-03371-37637 */
		var SQLITE_UTF16BE =        3; /* IMP: R-51971-34154 */
		var SQLITE_UTF16 =          4; /* Use native byte order */
		var SQLITE_ANY =            5; /* Deprecated */
		var SQLITE_UTF16_ALIGNED =  8; /* sqlite3_create_collation only */
		var collationResult = $tw.sqlite3.capi.sqlite3_create_collation_v2(this.db.pointer,"custom_collation",SQLITE_UTF8,this,customCollation,0);	
	}
	/*
	Create tables and indexes
	*/
	self.db.exec({
		sql: `
			DROP TABLE IF EXISTS plugins;
			CREATE TABLE plugins (
				plugintitle TEXT NOT NULL, -- Empty string shoud be the highest priority
				priority INTEGER NOT NULL,
				PRIMARY KEY(plugintitle)
			);
			DROP TABLE IF EXISTS tiddlers;
			CREATE TABLE tiddlers (
				title TEXT NOT NULL ${COLLATION_CLAUSE},
				plugintitle TEXT NOT NULL, -- Empty string for tiddlers that are not part of a plugin
				meta TEXT NOT NULL,
				text TEXT NOT NULL,
				PRIMARY KEY(title,plugintitle)
			);
			CREATE INDEX tiddlers_title_index ON tiddlers(title);
			DROP TABLE IF EXISTS titles;
			CREATE TABLE titles (
				title TEXT NOT NULL ${COLLATION_CLAUSE},
				plugintitle TEXT NOT NULL, -- Empty string for tiddlers that are not part of a plugin
				PRIMARY KEY(title)
			);
		`
	});
	/*
	Debugging
	*/
	var statementLogTiddlersTable = self.db.prepare("select title, plugintitle, meta, text from tiddlers order by title, plugintitle;"),
		statementLogPluginsTable = self.db.prepare("select plugintitle, priority from plugins order by priority;"),
		statementLogTitlesTable = self.db.prepare("select title, plugintitle from titles order by title;");
	function sqlLogTable(statement) {
		let resultRows = [];
		while(statement.step()) {
			var row = statement.get({});
			resultRows.push(row);
		}
		statement.reset();
		return resultRows;
	}
	this.sqlLogTables = function() {
		console.log("tiddlers",sqlLogTable(statementLogTiddlersTable));
		console.log("plugins",sqlLogTable(statementLogPluginsTable));
		console.log("titles",sqlLogTable(statementLogTitlesTable));
	};
	/*
	Set the plugin priorities
	*/
	this.sqlSetPluginPriorities = function(prioritisedPluginTitles) {
		const plugintitles = prioritisedPluginTitles.concat([""]);
		self.db.exec({
			sql: "DELETE FROM plugins"
		});
		let priority = 1;
		for(const plugintitle of plugintitles) {
			self.db.exec({
				sql: "insert or replace into plugins (plugintitle, priority) values ($plugintitle, $priority)",
				bind: {
					$plugintitle: plugintitle,
					$priority: priority++
				}
			});	
		}
	};
	/*
	Save a tiddler
	*/
	var querySaveTiddlerTableTiddlers = self.db.prepare(`
	-- Insert the new tiddler into the tiddlers table
	INSERT OR REPLACE INTO tiddlers (title, plugintitle, meta, text)
	VALUES ($title, $plugintitle, $meta, $text);
	`);
	var querySaveTiddlerTableTitles = self.db.prepare(`
	-- Insert the new title into the titles table
	INSERT OR REPLACE INTO titles (title, plugintitle)
	SELECT
		t.title,
		(SELECT t2.plugintitle
		 FROM tiddlers AS t2
		 JOIN plugins AS p ON t2.plugintitle = p.plugintitle
		 WHERE t2.title = t.title
		 ORDER BY p.priority DESC
		 LIMIT 1
		) AS plugintitle
	FROM tiddlers AS t
	WHERE t.title = $title;	
	`);
	this.sqlSaveTiddler = function(tiddlerFields,plugintitle) {
		plugintitle = plugintitle || "";
		querySaveTiddlerTableTiddlers.bind({
			$title: tiddlerFields.title,
			$plugintitle: plugintitle,
			$meta: JSON.stringify(Object.assign({},tiddlerFields,{title: undefined, text: undefined})),
			$text: tiddlerFields.text || ""
		});
		querySaveTiddlerTableTiddlers.step();
		querySaveTiddlerTableTiddlers.reset();
		querySaveTiddlerTableTitles.bind({
			$title: tiddlerFields.title,
		});
		querySaveTiddlerTableTitles.step();
		querySaveTiddlerTableTitles.reset();
	};
	/*
	Delete a tiddler
	*/
	var statementDeleteTiddlerDeleteFromTiddlers = self.db.prepare(`
	DELETE FROM tiddlers
	WHERE title = $title AND plugintitle = $plugintitle;
	`);
	var statementDeleteTiddlerFindShadow = self.db.prepare(`
	SELECT t.title, t.plugintitle
	FROM tiddlers AS t
	JOIN plugins AS p ON t.plugintitle = p.plugintitle
	WHERE t.title = $title
	ORDER BY p.priority DESC
	LIMIT 1;
	`);
	this.sqlDeleteTiddler = function(title,plugintitle) {
		plugintitle = plugintitle || "";
		// Delete the tiddler from the tiddlers table
		statementDeleteTiddlerDeleteFromTiddlers.bind({
			$title: title,
			$plugintitle: plugintitle
		});
		statementDeleteTiddlerDeleteFromTiddlers.step();
		statementDeleteTiddlerDeleteFromTiddlers.reset();
		// Find any corresponding shadow tiddler
		statementDeleteTiddlerFindShadow.bind({
			$title: title
		});
		if(statementDeleteTiddlerFindShadow.step()) {
			var row = statementDeleteTiddlerFindShadow.get({});
			statementDeleteTiddlerFindShadow.reset();
			// Replace the tiddler with the shadow
			self.db.exec({
				sql: "insert or replace into titles (title, plugintitle) values ($title, $plugintitle)",
				bind: {
					$title: title,
					$plugintitle: row.plugintitle
				}
			});
		} else {
			statementDeleteTiddlerFindShadow.reset();
			// There is no shadow tiddler, so just delete the tiddler
			self.db.exec({
				sql: "delete from titles where title = $title",
				bind: {
					$title: title
				}
			});
		}
	};
	/*
	Remove all shadow tiddlers
	*/
	this.sqlClearShadows = function() {
		self.db.exec({
			sql: "delete from tiddlers where plugintitle != '';"
		});
		self.db.exec({
			sql: "delete from titles where plugintitle != '';"
		});
	};
	/*
	Check whether a tiddler exists
	*/
	var statementTiddlerExists = self.db.prepare(`select title from titles where title = $title and plugintitle = '';`)
	this.sqlTiddlerExists = function(title) {
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
	};
	/*
	Get the value of a tiddler
	*/
	var statementGetTiddler = self.db.prepare(`
	select t.title, ti.meta, ti.text
	FROM titles AS t
	JOIN tiddlers AS ti
	ON t.title = ti.title AND t.plugintitle = ti.plugintitle
	WHERE t.title = $title;
	`);
	this.sqlGetTiddler = function(title) {
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
	};
	/*
	Get the plugin from which a tiddler came
	*/
	var statementGetShadowSource = self.db.prepare(`
	SELECT t.title, t.plugintitle
	FROM tiddlers AS t
	LEFT JOIN plugins AS p ON t.plugintitle = p.plugintitle
	WHERE t.title = $title AND t.plugintitle <> ''
	ORDER BY p.priority DESC
	LIMIT 1;
	`);
	this.sqlGetShadowSource = function(title) {
		statementGetShadowSource.bind({
			$title: title
		});
		if(statementGetShadowSource.step()) {
			var row = statementGetShadowSource.get({});
			statementGetShadowSource.reset();
			return row.plugintitle;
		} else {
			statementGetShadowSource.reset();
			return null;
		}
	};
	/*
	Get all titles
	*/
	var statementAllTitles = self.db.prepare(`select title from titles order by title ${COLLATION_CLAUSE}`);
	this.sqlAllTitles = function() {
		let resultRows = [];
		while(statementAllTitles.step()) {
			var row = statementAllTitles.get({});
			resultRows.push(row.title);
		}
		statementAllTitles.reset();
		return resultRows;
	};
	/*
	All shadow titles
	*/
	var statementAllShadowTitles = self.db.prepare(`
	SELECT title
	FROM tiddlers
	WHERE plugintitle != ''
	ORDER BY title ${COLLATION_CLAUSE}
	`);
	this.sqlAllShadowTitles = function() {
		let resultRows = [];
		while(statementAllShadowTitles.step()) {
			var row = statementAllShadowTitles.get({});
			resultRows.push(row.title);
		}
		statementAllShadowTitles.reset();
		return resultRows;
	};
	/*
	Iterate through each tiddler
	*/
	var statementEachTiddler = self.db.prepare(`
	SELECT t.title, ti.meta, ti.text
	FROM titles AS t
	LEFT JOIN tiddlers AS ti ON t.title = ti.title AND t.plugintitle = ti.plugintitle
	WHERE t.plugintitle == ''
	ORDER BY t.title ${COLLATION_CLAUSE}
	`);
	this.sqlEachTiddler = function(callback) {
		while(statementEachTiddler.step()) {
			var row = statementEachTiddler.get({}),
				tiddlerFields = Object.assign({},JSON.parse(row.meta),{title: row.title, text: row.text});
			callback(tiddlerFields,row.title);
		}
		statementEachTiddler.reset();
	};
	/*
	Iterate through each tiddler that is a shadow (including overridden shadows)
	*/
	var statementEachShadowTiddler = self.db.prepare(`
	SELECT DISTINCT t.title, td.meta, td.text
	FROM titles AS t
	JOIN tiddlers AS td ON t.title = td.title
	WHERE td.plugintitle != ''
	ORDER BY t.title ${COLLATION_CLAUSE};
	`);
	this.sqlEachShadowTiddler = function(callback) {
		while(statementEachShadowTiddler.step()) {
			var row = statementEachShadowTiddler.get({});
			var tiddlerFields = Object.assign({},JSON.parse(row.meta),{title: row.title, text: row.text});
			callback(tiddlerFields,row.title);	
		}
		statementEachShadowTiddler.reset();
	};
	/*
	Iterate all tiddlers, and then the shadows
	*/
	this.sqlEachTiddlerPlusShadows = function(callback) {
		const titles = Object.create(null);
		self.sqlEachTiddler(function(fields,title) {
			titles[title] = true;
			callback(fields,title);
		});
		self.sqlEachShadowTiddler(function(fields,title) {
			if(!titles[title]) {
				callback(fields,title);
			}
		});
	};
	/*
	Iterate all shadows, and then the tiddlers
	*/
	this.sqlEachShadowPlusTiddlers = function(callback) {
		const titles = Object.create(null);
		self.sqlEachShadowTiddler(function(fields,title) {
			titles[title] = true;
			callback(fields,title);
		});
		self.sqlEachTiddler(function(fields,title) {
			if(!titles[title]) {
				callback(fields,title);
			}
		});
	};
	/*
	Return all tiddlers with a given tag
	*/
	this.sqlGetTiddlersWithTag = function(tag,method) {
		const titles = [];
		self.sqlEachShadowPlusTiddlers(function(fields,title) {
			var tags = $tw.utils.parseStringArray(fields.tags || "");
			if(tags.indexOf(tag) !== -1) {
				titles.push(title);
			}
		});
		return titles;
	};
};

})();
//# sourceURL=$:/plugins/tiddlywiki/sqlite3store/sql-functions.js
