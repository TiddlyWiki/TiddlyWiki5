/*\
title: $:/plugins/tiddlywiki/codemirror-6-lang-sql/plugin.js
type: application/javascript
module-type: codemirror6-plugin

SQL language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langSql, hasConfiguredTag;
try {
	langSql = require("$:/plugins/tiddlywiki/codemirror-6-lang-sql/lang-sql.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langSql || !hasConfiguredTag) return;

// Content types that activate this plugin
var SQL_TYPES = [
	"application/sql",
	"text/x-sql"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-sql/tags";

// Map config values to dialect objects
var DIALECTS = {
	"StandardSQL": langSql.StandardSQL,
	"MySQL": langSql.MySQL,
	"MariaSQL": langSql.MariaSQL,
	"PostgreSQL": langSql.PostgreSQL,
	"SQLite": langSql.SQLite,
	"MSSQL": langSql.MSSQL,
	"PLSQL": langSql.PLSQL,
	"Cassandra": langSql.Cassandra
};

function isSqlType(type) {
	return SQL_TYPES.indexOf(type) !== -1;
}

exports.plugin = {
	name: "lang-sql",
	description: "SQL syntax highlighting",
	priority: 50,

	/*
	Expose the real content types handled by this plugin.

	This lets the engine resolve a winning tag override to a real SQL
	language mode.
	*/
	contentTypes: SQL_TYPES,
	types: SQL_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;

		return {
			sqlLanguage: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			return SQL_TYPES[0];
		}

		return null;
	},

	condition: function(context) {
		var effectiveType = context.effectiveType || context.tiddlerType || "";

		/*
		If a tag override is active, only the winning tag/plugin may activate.

		Do not use hasConfiguredTag() here. A tiddler may contain multiple
		configured language tags, but the engine has already selected the
		winner.
		*/
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER ||
				isSqlType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured SQL language tag
		*/
		if(isSqlType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	getDialect: function(context) {
		var wiki = context.widget && context.widget.wiki;
		var dialectName = wiki && wiki.getTiddlerText(
			"$:/config/codemirror-6/lang-sql/dialect",
			"StandardSQL"
		);

		return DIALECTS[dialectName] || langSql.StandardSQL;
	},

	/*
	Runtime language switching uses this.

	This must return raw compartment content only.
	Do not return sqlLanguage.of(...) from here.
	*/
	getCompartmentContent: function(context) {
		var dialect = this.getDialect(context);

		return [
			langSql.sql({
				dialect: dialect
			})
		];
	},

	/*
	Initial editor construction uses this.

	This may wrap the raw content in the plugin's compartment.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;

		if(compartments.sqlLanguage) {
			return [
				compartments.sqlLanguage.of(
					this.getCompartmentContent(context)
				)
			];
		}

		return this.getCompartmentContent(context);
	},

	/*
	Register event handlers with closure access to engine and context.

	Important:
	The dialect reconfigure also uses getCompartmentContent(), so it feeds
	raw content into sqlLanguage.reconfigure(...). That is correct.
	*/
	registerEvents: function(engine, context) {
		var self = this;

		return {
			settingsChanged: function(_settings) {
				if(engine._destroyed) return;

				var compartments = engine._compartments;
				var currentContext = engine._pluginContext || context;

				if(compartments.sqlLanguage && engine.view) {
					engine.view.dispatch({
						effects: compartments.sqlLanguage.reconfigure(
							self.getCompartmentContent(currentContext)
						)
					});
				}
			}
		};
	}
};
