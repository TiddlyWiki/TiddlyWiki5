/*\
title: $:/core/modules/macros/list/listviews/classic.js
type: application/javascript
module-type: listview

Views the list as a linear sequence

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function ClassicListView(listMacro) {
	this.listMacro = listMacro;
};

ClassicListView.prototype.test = function() {
	alert("In ClassicListView");
};

exports["classic"] = ClassicListView;

})();
