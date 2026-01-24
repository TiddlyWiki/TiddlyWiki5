/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-sql/register.js
type: application/javascript
module-type: startup

Register SQL language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-sql"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-sql";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core, langSql;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langSql = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-sql/lang-sql.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langSql) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;
	var LanguageSupport = core.language.LanguageSupport;

	var keywordCompletionSource = langSql.keywordCompletionSource;
	var schemaCompletionSource = langSql.schemaCompletionSource;
	var StandardSQL = langSql.StandardSQL;

	// Create completion source combining keyword and schema completions
	var sqlCompletionSource = function(context) {
		var keywordResult = keywordCompletionSource(StandardSQL)(context);
		if(keywordResult) return keywordResult;
		return null;
	};

	// Store completion source for use by other modules
	core.sqlCompletionSource = sqlCompletionSource;

	// Register for nested language completion in TiddlyWiki
	// Uses Language.isActiveAt() for detection
	// StandardSQL.language is the Language object for SQL
	core.registerNestedLanguageCompletion({
		name: "sql",
		language: StandardSQL.language,
		source: sqlCompletionSource
	});

	// Register SQL (standard)
	core.registerLanguage(LanguageDescription.of({
		name: "SQL",
		alias: ["sql"],
		extensions: ["sql"],
		support: langSql.sql()
	}));

	// Register MySQL
	core.registerLanguage(LanguageDescription.of({
		name: "MySQL",
		alias: ["mysql"],
		extensions: [],
		support: langSql.sql({
			dialect: langSql.MySQL
		})
	}));

	// Register PostgreSQL
	core.registerLanguage(LanguageDescription.of({
		name: "PostgreSQL",
		alias: ["postgresql", "postgres", "pgsql"],
		extensions: [],
		support: langSql.sql({
			dialect: langSql.PostgreSQL
		})
	}));

	// Register SQLite
	core.registerLanguage(LanguageDescription.of({
		name: "SQLite",
		alias: ["sqlite"],
		extensions: [],
		support: langSql.sql({
			dialect: langSql.SQLite
		})
	}));
};
