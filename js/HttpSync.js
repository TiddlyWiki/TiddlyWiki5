/*\
title: js/HttpSync.js

\*/
(function(){

/*jslint node: true, browser: true */
"use strict";

function HttpSync(store) {
	this.store = store;
	this.changeCounts = {};
	store.addEventListener("",function(changes) {
		for(var title in changes) {
			var x = new XMLHttpRequest(),
				tiddler = store.getTiddler(title);
			if(tiddler) {
				var fieldStrings = tiddler.getFieldStrings(),
					fields = {},
					t;
				for(t=0; t<fieldStrings.length; t++) {
					fields[fieldStrings[t].name] = fieldStrings[t].value;
				}
				fields.text = tiddler.text;
				x.open("PUT",window.location.toString() + encodeURIComponent(title),true);
				x.setRequestHeader("Content-type", "application/json");
				x.send(JSON.stringify(fields));
			} else {
				x.open("DELETE",window.location.toString() + encodeURIComponent(title),true);
				x.send();
			}
		}
	});
}

exports.HttpSync = HttpSync;

})();
