/*\
title: $:/core/modules/debug-view.js
type: application/javascript
module-type: global

debug-view module supports the optional external debug window

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var dm = $tw.utils.domMaker;

/*
Instantiate the debug view
*/
function DebugView(options) {
	if($tw.browser) {
		this.outputFilters = dm("div",{
			text: "Yes"
		})
		this.container = dm("div",{
			"class": "tc-debug-view",
			children: [
				dm("div",{
					children: [
						dm("h1",{
							text: "TiddlyWiki Debug View"
						}),
						dm("h2",{
							text: "Filter Execution"
						}),
						this.outputFilters
					]
				})
			]
		});
		document.body.appendChild(this.container);
	}
}

/*
Show a generic network error alert
*/
DebugView.prototype.displayError = function(msg,err) {
	
};

exports.DebugView = DebugView;

})();
