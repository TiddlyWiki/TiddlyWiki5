/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-sql/plugin.js
type: application/javascript
module-type: codemirror6-plugin

SQL language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langSql, hasConfiguredTag;
try {
	langSql = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-sql/lang-sql.js");
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

exports.plugin = {
	name: "lang-sql",
	description: "SQL syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			sqlLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return SQL_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getDialect: function(context) {
		var wiki = context.widget && context.widget.wiki;
		var dialectName = wiki && wiki.getTiddlerText("$:/config/codemirror-6/lang-sql/dialect", "StandardSQL");
		return DIALECTS[dialectName] || langSql.StandardSQL;
	},

	getCompartmentContent: function(context) {
		var dialect = this.getDialect(context);
		return [langSql.sql({
			dialect: dialect
		})];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.sqlLanguage) {
			return [compartments.sqlLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	},

	// Register event handlers with closure access to engine and context
	registerEvents: function(engine, context) {
		var self = this;

		return {
			settingsChanged: function(_settings) {
				if(engine._destroyed) return;

				var compartments = engine._compartments;
				if(compartments.sqlLanguage && engine.view) {
					var newContent = self.getCompartmentContent(context);
					engine.view.dispatch({
						effects: compartments.sqlLanguage.reconfigure(newContent)
					});
				}
			}
		};
	}
};
