/*\
title: js/HttpSync.js

\*/
(function(){

/*jslint node: true */
"use strict";

function HttpSync(store) {
	this.store = store;
	this.changeCounts = {};
	store.addEventListener("",function(changes) {
		for(var title in changes) {
			var tiddler = store.getTiddler(title);
			if(tiddler) {
				var fieldStrings = tiddler.getFieldStrings(),
					fields = {},
					t;
				for(t=0; t<fieldStrings.length; t++) {
					fields[fieldStrings[t].name] = fieldStrings[t].value;
				}
				fields.text = tiddler.text;
				var x = new XMLHttpRequest();
				x.open("PUT",window.location.toString() + encodeURIComponent(title),true);
				x.setRequestHeader("Content-type", "application/json");
				x.send(JSON.stringify(fields));
			}
		}
	});
}

exports.HttpSync = HttpSync;

})();
