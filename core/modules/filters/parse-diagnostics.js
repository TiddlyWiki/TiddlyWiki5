/*\
title: $:/core/modules/filters/parse-diagnostics.js
type: application/javascript
module-type: filteroperator

Filter operator that reads a tiddler's parse diagnostics from the parse cache. It keys on the parser-agnostic `parser.diagnostics` contract, so it reports the recovery gradient of any parser type (wikitext or another grammar), not wikitext alone.

	[all[tiddlers]parse-diagnostics[]]        keep tiddlers whose parse produced diagnostics
	[all[tiddlers]!parse-diagnostics[]]       keep tiddlers whose parse was clean
	[<title>parse-diagnostics:grade[]]        the worst-severity band per input: clean|hint|info|warning|error
	[<title>parse-diagnostics:count[]]        the raw diagnostic count per input
	[all[tiddlers]parse-diagnostics:codes[]]  the distinct diagnostic codes across inputs

\*/

"use strict";

// Rank the closed severity set, lowest number wins (worst). A stable grade moves only when the worst class of problem changes
var SEVERITY_RANK = {error: 1, warning: 2, info: 3, hint: 4};

function gradeOf(diagnostics) {
	if(diagnostics.length === 0) {
		return "clean";
	}
	var worst = "hint",
		worstRank = SEVERITY_RANK.hint;
	$tw.utils.each(diagnostics,function(diagnostic) {
		var rank = SEVERITY_RANK[diagnostic.severity] !== undefined ? SEVERITY_RANK[diagnostic.severity] : SEVERITY_RANK.error;
		if(rank <= worstRank) {
			worstRank = rank;
			worst = SEVERITY_RANK[diagnostic.severity] !== undefined ? diagnostic.severity : "error";
		}
	});
	return worst;
}

exports["parse-diagnostics"] = function(source,operator,options) {
	var results = [],
		invert = operator.prefix === "!",
		suffix = operator.suffix || "";
	function diagnosticsFor(title) {
		var parser = options.wiki.parseTiddler(title);
		return (parser && parser.diagnostics) || [];
	}
	if(suffix === "grade") {
		source(function(tiddler,title) {
			results.push(gradeOf(diagnosticsFor(title)));
		});
	} else if(suffix === "count") {
		source(function(tiddler,title) {
			results.push("" + diagnosticsFor(title).length);
		});
	} else if(suffix === "codes") {
		source(function(tiddler,title) {
			$tw.utils.each(diagnosticsFor(title),function(diagnostic) {
				$tw.utils.pushTop(results,diagnostic.code);
			});
		});
	} else {
		source(function(tiddler,title) {
			var hasDiagnostics = diagnosticsFor(title).length > 0;
			if(hasDiagnostics !== invert) {
				results.push(title);
			}
		});
	}
	return results;
};
