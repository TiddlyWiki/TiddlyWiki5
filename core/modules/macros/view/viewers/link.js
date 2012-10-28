/*\
title: $:/core/modules/macros/view/viewers/link.js
type: application/javascript
module-type: fieldviewer

A viewer for viewing tiddler fields as a link

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var LinkViewer = function(viewMacro,tiddler,field,value) {
	this.viewMacro = viewMacro;
	this.tiddler = tiddler;
	this.field = field;
	this.value = value;
};

LinkViewer.prototype.render = function() {
	if(this.value === undefined) {
		return $tw.Tree.Text("");
	} else {
		var link = $tw.Tree.Macro("link",{
									srcParams: {to: this.value},
									content: [$tw.Tree.Text(this.value)],
									isBlock: this.viewMacro.isBlock,
									wiki: this.viewMacro.wiki
								});
		link.execute(this.viewMacro.parents,this.viewMacro.tiddlerTitle);
		return link;
	}
}

exports["link"] = LinkViewer;

})();
