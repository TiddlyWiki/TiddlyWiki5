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
			DROP TABLE IF EXISTS tiddlers;
			CREATE TABLE tiddlers (
				title TEXT NOT NULL ${COLLATION_CLAUSE},
				shadow INTEGER NOT NULL CHECK (shadow = 0 OR shadow = 1), -- 0=real tiddler, 1=shadow tiddler
				shadowsource TEXT,
				meta TEXT NOT NULL,
				text TEXT NOT NULL,
				PRIMARY KEY(title,shadow)
			);
			CREATE INDEX tiddlers_title_index ON tiddlers(title);
			DROP TABLE IF EXISTS tags;
			CREATE TABLE tags (
				tag_id INTEGER PRIMARY KEY,
				tag TEXT NOT NULL
			);
			DROP TABLE IF EXISTS tiddler_tags;
			CREATE TABLE tiddler_tags (
				tiddler_title TEXT NOT NULL,
				tiddler_shadow INTEGER NOT NULL,
				tag_id INTEGER NOT NULL,
				FOREIGN KEY (tiddler_title, tiddler_shadow) REFERENCES tiddlers (title, shadow) ON DELETE CASCADE ON UPDATE CASCADE,
				FOREIGN KEY (tag_id) REFERENCES tags (tag_id) ON DELETE CASCADE ON UPDATE CASCADE,
				PRIMARY KEY (tiddler_title, tiddler_shadow, tag_id)
			);
		`
	});
	/*
	Save a tiddler. shadowSource should be falsy for ordinary tiddlers, or the source plugin title for shadow tiddlers
	*/
	var querySaveTiddlerTableTiddlers = self.db.prepare(`
	-- Insert the new tiddler into the tiddlers table
	INSERT OR REPLACE INTO tiddlers (title, shadow, shadowsource, meta, text)
	VALUES ($title, $shadow, $shadowsource, $meta, $text);
	`);
	var querySaveTiddlerTableTags = self.db.prepare(`
	-- Parse and insert tags from the $tags JSON array
	WITH tag_values AS (
	  SELECT json_each.value AS tag
	  FROM json_each($tags)
	)
	INSERT INTO tags (tag)
	SELECT DISTINCT tag
	FROM tag_values
	WHERE tag NOT IN (
	  SELECT tag
	  FROM tags
	);
	`);
	var querySaveTiddlerTableTiddlerTags = self.db.prepare(`	
	-- Associate the new tiddler with the tags in the tiddler_tags table
	WITH tag_values AS (
	  SELECT json_each.value AS tag
	  FROM json_each($tags)
	)
	INSERT OR IGNORE INTO tiddler_tags (tiddler_title, tiddler_shadow, tag_id)
	SELECT $title, $shadow, tags.tag_id
	FROM tag_values
	JOIN tags ON tag_values.tag = tags.tag;
	`);
	this.sqlSaveTiddler = function(tiddlerFields,shadowSource) {
		var tags = JSON.stringify($tw.utils.parseStringArray(tiddlerFields.tags) || []);
		querySaveTiddlerTableTiddlers.bind({
			$title: tiddlerFields.title,
			$shadow: shadowSource ? 1 : 0,
			$shadowsource: shadowSource ? shadowSource : null,
			$meta: JSON.stringify(Object.assign({},tiddlerFields,{title: undefined, text: undefined})),
			$text: tiddlerFields.text || ""
		});
		querySaveTiddlerTableTiddlers.step();
		querySaveTiddlerTableTiddlers.reset();
		querySaveTiddlerTableTags.bind({
			$tags: tags
		});
		querySaveTiddlerTableTags.step();
		querySaveTiddlerTableTags.reset();
		querySaveTiddlerTableTiddlerTags.bind({
			$title: tiddlerFields.title,
			$shadow: shadowSource ? 1 : 0,
			$tags: tags
		});
		querySaveTiddlerTableTiddlerTags.step();
		querySaveTiddlerTableTiddlerTags.reset();
	};
	this.sqlDeleteTiddler = function(title) {
		self.db.exec({
			sql: "delete from tiddlers where title = $title and shadow = 0",
			bind: {
				$title: title
			}
		});
	};
	this.sqlClearShadows = function() {
		self.db.exec({
			sql: "delete from tiddlers where shadow = 1"
		});
	};
	var statementTiddlerExists = self.db.prepare(`select title from tiddlers where title = $title and shadow = 0;`)
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
	var statementGetTiddler = self.db.prepare(`select title, shadow, meta, text from tiddlers where title = $title order by shadow`);
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
	var statementGetShadowSource = self.db.prepare(`select title, shadowsource from tiddlers where title = $title and shadow = 1`);
	this.sqlGetShadowSource = function(title) {
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
	};
	var statementAllTitles = self.db.prepare(`select title from tiddlers where shadow = 0 order by title ${COLLATION_CLAUSE}`);
	this.sqlAllTitles = function() {
		let resultRows = [];
		while(statementAllTitles.step()) {
			var row = statementAllTitles.get({});
			resultRows.push(row.title);
		}
		statementAllTitles.reset();
		return resultRows;
	};
	var statementAllShadowTitles = self.db.prepare(`select title from tiddlers where shadow = 1 order by title ${COLLATION_CLAUSE}`);
	this.sqlAllShadowTitles = function() {
		let resultRows = [];
		while(statementAllShadowTitles.step()) {
			var row = statementAllShadowTitles.get({});
			resultRows.push(row.title);
		}
		statementAllShadowTitles.reset();
		return resultRows;
	};
	var statementEachTiddler = self.db.prepare(`select title, meta, text from tiddlers where shadow = 0 order by title ${COLLATION_CLAUSE}`);
	this.sqlEachTiddler = function(callback) {
		while(statementEachTiddler.step()) {
			var row = statementEachTiddler.get({}),
				tiddlerFields = Object.assign({},JSON.parse(row.meta),{title: row.title, text: row.text});
			callback(tiddlerFields,row.title);
		}
		statementEachTiddler.reset();
	};
	/*
	We get all the rows where either the shadow field is 1 and there is no row with the same title and
	a shadow field value of zero, or the shadow field is zero and there also exists a row with the same
	title and a shadow field value of 1
	*/
	var statementEachShadowTiddler = self.db.prepare(`
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
				)
		order by title ${COLLATION_CLAUSE};
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
	Return all the tiddler rows that have the "shadow" field set to 1, but only where the "title"
	field doesn't appear in a row with the "shadow" field set to 0
	*/
	var statementEachTiddlerPlusShadows = self.db.prepare(`
			select title,meta,text from tiddlers t1
			where t1.shadow = 1
				and not exists (
					select 1
					from tiddlers t2
					where t2.title = t1.title
						and t2.shadow = 0
					)
			order by t1.title ${COLLATION_CLAUSE};
		`);
	this.sqlEachTiddlerPlusShadows = function(callback) {
		self.sqlEachTiddler(callback);
		while(statementEachTiddlerPlusShadows.step()) {
			var row = statementEachTiddlerPlusShadows.get({});
			var tiddlerFields = Object.assign({},JSON.parse(row.meta),{title: row.title, text: row.text});
			callback(tiddlerFields,row.title);	
		}
		statementEachTiddlerPlusShadows.reset();
	};
	/*
	Return all rows where the shadow field is zero, and there is no row with the same title and a shadow field of 1
	*/
	var statementEachShadowPlusTiddlers = self.db.prepare(`
		select title,meta,text from tiddlers t1
		where t1.shadow = 0
			and not exists (
				select 1
				from tiddlers t2
				where t2.title = t1.title
					and t2.shadow = 1
				)
		order by t1.title ${COLLATION_CLAUSE};
	`);
	this.sqlEachShadowPlusTiddlers = function(callback) {
		self.sqlEachShadowTiddler(callback);
		while(statementEachShadowPlusTiddlers.step()) {
			var row = statementEachShadowPlusTiddlers.get({});
			var tiddlerFields = Object.assign({},JSON.parse(row.meta),{title: row.title, text: row.text});
			callback(tiddlerFields,row.title);	
		}
		statementEachShadowPlusTiddlers.reset();
	};
	/*
	Return all tiddlers with a given tag. Method determines the default ordering (before the list ordering fields are observed):
		each: just ordinary tiddlers
		eachShadow: just shadow tiddlers

	*/
	var statementGetTiddlersWithTag = self.db.prepare(`
	SELECT t.title
	FROM tiddlers AS t
	JOIN tiddler_tags AS tt ON t.title = tt.tiddler_title AND t.shadow = tt.tiddler_shadow
	WHERE tt.tag_id = (SELECT tag_id FROM tags WHERE tag = $tag)
	  AND (t.shadow = 0 OR NOT EXISTS (SELECT 1 FROM tiddlers WHERE title = t.title AND shadow = 0))
	GROUP BY t.title, t.shadow 
	ORDER BY t.title ${COLLATION_CLAUSE} ASC, t.shadow ASC;
	`);
	this.sqlGetTiddlersWithTag = function(tag,method) {
		statementGetTiddlersWithTag.bind({
			$tag: tag
		});
		var resultRows = [];
		while(statementGetTiddlersWithTag.step()) {
			var row = statementGetTiddlersWithTag.get({});
			resultRows.push(row.title);
		}
		statementGetTiddlersWithTag.reset();
		return resultRows;
	};
	/*
	An optimisation of the filter [all[shadows+tiddlers]prefix[$:/language/Docs/Types/]get[name]length[]maxall[]]
	*/
	var statementQuickFilterAllShadowsTiddlersPrefixDocTypeMaxLength = self.db.prepare(`
		SELECT MAX(LENGTH(name)) AS max_length
		FROM (
		SELECT title, shadow, JSON_EXTRACT(meta, '$.name') AS name
		FROM tiddlers
		WHERE title LIKE '$:/language/Docs/Types/%'
		AND (shadow = 0 OR (shadow = 1 AND NOT EXISTS (
			SELECT 1
			FROM tiddlers AS t2
			WHERE t2.title = tiddlers.title
			AND t2.shadow = 0
		)))
		);
	`);
	this.sqlQuickFilterAllShadowsTiddlersPrefixDocTypeMaxLength = function() {
		// We return a filter operation function that actually performs the query
		return function(results,source,widget) {
			var result = 0;
			if(statementQuickFilterAllShadowsTiddlersPrefixDocTypeMaxLength.step()) {
				var row = statementQuickFilterAllShadowsTiddlersPrefixDocTypeMaxLength.get({});
				result = row.max_length;
			}
			statementQuickFilterAllShadowsTiddlersPrefixDocTypeMaxLength.reset();
			results.clear();
			results.push(result.toString());
		};
	};
	/*
	Debugging
	*/
	var statementLogTiddlerTable = self.db.prepare("select title, shadow, meta, text from tiddlers order by title,shadow;"),
		statementLogTagsTable = self.db.prepare("select tag_id, tag from tags order by tag;"),
		statementLogTiddlerTagsTable = self.db.prepare("select tiddler_title, tiddler_shadow, tag_id from tiddler_tags order by tiddler_title, tiddler_shadow;");
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
		console.log("tiddlers",sqlLogTable(statementLogTiddlerTable));
		console.log("tags",sqlLogTable(statementLogTagsTable));
		console.log("tiddler tags",sqlLogTable(statementLogTiddlerTagsTable));
	};
};

})();
//# sourceURL=$:/plugins/tiddlywiki/sqlite3store/sql-functions.js
