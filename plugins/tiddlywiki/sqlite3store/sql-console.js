/*\
title: $:/plugins/tiddlywiki/sqlite3store/sql-console.js
type: application/javascript

SQL console for debugging

\*/

(function() {

$tw.SqlConsole = function SqlConsole() {
	var self = this;
	// Container
	this.consoleContainer = document.createElement("div");
	this.consoleContainer.appendChild(document.createTextNode("console for sqlite3"));
	// Input box
	this.consoleInput = document.createElement("textarea");
	this.consoleInput.setAttribute("rows","10");
	this.consoleInput.style.width = "100%";
	this.consoleInput.addEventListener("keypress",function(event) {
		if(event.key === "Enter") {
			console.log("Gto enter")
			self.consoleRunButton.click();
			event.preventDefault();
			return false;
		}
	});
	this.consoleContainer.appendChild(this.consoleInput);
	// Run button
	this.consoleRunButton = document.createElement("button");
	this.consoleRunButton.appendChild(document.createTextNode("run sql"));
	this.consoleRunButton.addEventListener("click",this.runQuery.bind(this));
	this.consoleContainer.appendChild(this.consoleRunButton);
	// Output
	this.consoleOutput = document.createElement("div");
	this.consoleContainer.appendChild(this.consoleOutput);
	// Insert into DOM
	document.body.insertBefore(this.consoleContainer,document.body.firstChild);
};

$tw.SqlConsole.prototype.runQuery = function() {
	let resultRows = [],
		exception;
	try {
		$tw.wiki.sqlFunctions.db.exec({
			sql: this.consoleInput.value,
			rowMode: "object",
			resultRows: resultRows
		});
	} catch(e) {
		exception = e.toString();
	}
	var output = document.createElement("div");
	output.appendChild(document.createTextNode(exception || JSON.stringify(resultRows)));
	this.consoleOutput.insertBefore(output,this.consoleOutput.firstChild);
};

})();
//# sourceURL=$:/plugins/tiddlywiki/sqlite3store/sql-console.js