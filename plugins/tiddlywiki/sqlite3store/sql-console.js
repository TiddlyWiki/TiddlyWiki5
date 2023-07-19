/*\
title: $:/plugins/tiddlywiki/sqlite3store/sql-console.js
type: application/javascript

SQL console for debugging

\*/

(function() {

$tw.SqlConsole = function SqlConsole() {
	var self = this,
		dm = $tw.utils.domMaker;
	// Input box
	this.consoleInput = dm("textarea",{
		"class": "sql-console-input",
		attributes: {
			"rows": "10"
		}
	});
	// Run button
	this.consoleRunButton = dm("button",{
		text: "run sql"
	});
	this.consoleRunButton.addEventListener("click",this.runQuery.bind(this));
	// Clear output button
	this.consoleClearButton = dm("button",{
		text: "clear output"
	});
	this.consoleClearButton.addEventListener("click",this.clearOutput.bind(this));
	// Output
	this.consoleOutput = dm("div",{
		"class": "sql-console-output-container"
	});
	// Container
	this.consoleContainer = dm("div",{
		"class": "sql-console",
		children: [
			document.createTextNode("console for sqlite3"),
			this.consoleInput,
			this.consoleRunButton,
			this.consoleClearButton,
			this.consoleOutput
		]
	});
	// Insert into DOM
	document.body.insertBefore(this.consoleContainer,document.body.firstChild);
};

$tw.SqlConsole.prototype.clearOutput = function() {
	while(this.consoleOutput.firstChild) {
		this.consoleOutput.removeChild(this.consoleOutput.firstChild);
	}
};

$tw.SqlConsole.prototype.runQuery = function() {
	var self = this,
		dm = $tw.utils.domMaker,
		sql = this.consoleInput.value,
		resultRows = [],
		exception;
	// Execute the query
	try {
		$tw.wiki.sqlFunctions.db.exec({
			sql: sql,
			rowMode: "object",
			resultRows: resultRows
		});
	} catch(e) {
		exception = e.toString();
	}
	// Display the result
	var output = dm("div",{
		"class": "sql-console-output",
		children: [
			dm("div",{
				"class": "sql-console-output-input",
				text: sql
			}),
			dm("div",{
				"class": "sql-console-output-output",
				text: exception || JSON.stringify(resultRows)
			})
		]
	});
	this.consoleOutput.insertBefore(output,this.consoleOutput.firstChild);
};

})();
//# sourceURL=$:/plugins/tiddlywiki/sqlite3store/sql-console.js