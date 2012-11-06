/*\
title: $:/core/modules/macros/fields.js
type: application/javascript
module-type: macro

Fields macro

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "fields",
	dependentOnContextTiddler: true,
	params: {
	}
};

exports.executeMacro = function() {
	// Create the table
	var attributes = {
		"class": ["tw-fields-table"]
	};
	if(this.classes) {
		$tw.utils.pushTop(attributes["class"],this.classes);
	}
	var rows = [
		$tw.Tree.Element("tr",{},[
			$tw.Tree.Element("th",{},[$tw.Tree.Text("Field")]),
			$tw.Tree.Element("th",{},[$tw.Tree.Text("Value")])
		])
	];
	// Get the value to display
	var tiddler = this.wiki.getTiddler(this.tiddlerTitle);
	if(tiddler) {
		var fields = [];
		for(var f in tiddler.fields) {
			fields.push(f);
		}
		fields.sort();
		for(f=0; f<fields.length; f++) {
			var value;
			if(fields[f] === "text") {
				value = $tw.Tree.Element("em",{},[
					$tw.Tree.Text("(length: " + tiddler.fields.text.length + ")")
				]);
			} else {
				value = $tw.Tree.Text(tiddler.getFieldString(fields[f]));
			}
			rows.push($tw.Tree.Element("tr",{},[
				$tw.Tree.Element("td",{},[$tw.Tree.Text(fields[f])]),
				$tw.Tree.Element("td",{},[value])
			]));
		}
	}
	var child = $tw.Tree.Element("table",attributes,[
		$tw.Tree.Element("tbody",{},rows)	
	]);
	child.execute(this.parents,this.tiddlerTitle);
	return child;
};

})();
