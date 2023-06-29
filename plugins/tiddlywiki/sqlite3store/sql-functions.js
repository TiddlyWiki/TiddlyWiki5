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
	this.db = new $tw.sqlite3.oo1.DB("/tiddlywiki.sqlite3","c");
	/*
	Create tables and indexes
	*/
	self.db.exec({
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
	var statementSaveTiddler = self.db.prepare("replace into tiddlers(title,shadow,shadowsource,meta,text) values ($title,$shadow,$shadowsource,$meta,$text);");
	this.sqlSaveTiddler = function(tiddlerFields,shadowSource) {
		statementSaveTiddler.bind({
			$title: tiddlerFields.title,
			$shadow: shadowSource ? 1 : 0,
			$shadowsource: shadowSource ? shadowSource : null,
			$meta: JSON.stringify(Object.assign({},tiddlerFields,{title: undefined, text: undefined})),
			$text: tiddlerFields.text || ""
		});
		statementSaveTiddler.step();
		statementSaveTiddler.reset();
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
	var statementTiddlerExists = self.db.prepare("select title from tiddlers where title = $title and shadow = 0;")
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
	var statementGetTiddler = self.db.prepare("select title, shadow, meta, text from tiddlers where title = $title order by shadow");
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
	var statementGetShadowSource = self.db.prepare("select title, shadowsource from tiddlers where title = $title and shadow = 1");
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
	var statementAllTitles = self.db.prepare("select title from tiddlers where shadow = 0 order by title");
	this.sqlAllTitles = function() {
		let resultRows = [];
		while(statementAllTitles.step()) {
			var row = statementAllTitles.get({});
			resultRows.push(row.title);
		}
		statementAllTitles.reset();
		return resultRows;
	};
	var statementAllShadowTitles = self.db.prepare("select title from tiddlers where shadow = 1 order by title");
	this.sqlAllShadowTitles = function() {
		let resultRows = [];
		while(statementAllShadowTitles.step()) {
			var row = statementAllShadowTitles.get({});
			resultRows.push(row.title);
		}
		statementAllShadowTitles.reset();
		return resultRows;
	};
	var statementEachTiddler = self.db.prepare("select title, meta, text from tiddlers where shadow = 0 order by title");
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
				);
		order by title;
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
			order by t1.title;
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
			order by t1.title;
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
};

})();
//# sourceURL=$:/plugins/tiddlywiki/sqlite3store/sql-functions.js