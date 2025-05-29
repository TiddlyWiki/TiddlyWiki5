/*\
title: $:/core/modules/filters/compoundtiddlers.js
type: application/javascript
module-type: filteroperator

Filter operators for compound tiddlers 

\*/

"use strict";


/*
Export our filter function
*/
exports.compoundTiddlers = function(source,operator,options) {

	var tiddlers = [];
	source(function(tiddler,title) {
		if(tiddler && tiddler.fields.text){
			var parser = $tw.wiki.parseText("text/vnd.tiddlywiki-multiple",tiddler.fields.text,{}),
				contentRoot = $tw.wiki.makeWidget(parser,{document: $tw.fakeDocument}),
				contentContainer = $tw.fakeDocument.createElement("div");

			contentRoot.render(contentContainer,null);
			$tw.utils.each(contentRoot.children, function(dataitem){ tiddlers.push(dataitem.tiddler.fields.title) });
		}
	});
	return tiddlers;
};
