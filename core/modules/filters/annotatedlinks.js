/*\
title: $:/core/modules/filters/annotatedlinks.js
type: application/javascript
module-type: filteroperator

Filter operator for returning all the links from a tiddler with a given annotation

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function parseAnnotations(annotationstring){
  var annotations = {}
  if (annotationstring.length > 0){
    annotationstring.split(',').forEach(function(part){
      if (part.includes('=')){
        let subparts = part.split('=', 2);
        let key = subparts[0],
         value = subparts[1];
        annotations[key] = value;
      }else{
        annotations[part] = "*";
      }
    });
  }
  return annotations;
}

/*
Export our filter function
*/
exports.annotatedlinks = function(source,operator,options) {
	var results = new $tw.utils.LinkedList();
	source(function(tiddler,title) {
    var annotations = parseAnnotations(operator.operands[0]);
		results.pushTop(options.wiki.getTiddlerAnnotatedLinks(title, annotations));
	});
	return results.makeTiddlerIterator(options.wiki);
};


})();
