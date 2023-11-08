/*\
title: $:/plugins/tiddlywiki/sqlite3store/sql-filter-compiler.js
type: application/javascript

A sqlite3 implementation of a wiki store object

This file is spliced into the HTML file to be executed before the boot kernel has been loaded.

\*/

(function() {

	/*
	If possible, return a filter evaluation function with the signature (source,widget) that executes the provided filter parse tree
	*/
	$tw.Wiki.prototype.optimiseFilter = function(filterString,filterParseTree) {
		// switch($tw.utils.trim(filterString)) {
		// 	case "[all[shadows+tiddlers]prefix[$:/language/Docs/Types/]get[name]length[]maxall[]]":
		// 		return [this.sqlFunctions.sqlQuickFilterAllShadowsTiddlersPrefixDocTypeMaxLength()];
		// 		break;
		// }
		return undefined;
	};

})();
//# sourceURL=$:/plugins/tiddlywiki/sqlite3store/sql-filter-compiler.js