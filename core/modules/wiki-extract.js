/*\
title: $:/core/modules/wiki-extract.js
type: application/javascript
module-type: wikimethod

AST information extractor for indexers.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Return an array of tiddler titles that are directly linked within the given parse tree
 */
exports.extractLinks = function(parseTreeRoot) {
	// Count up the links
	var links = [],
		checkParseTree = function(parseTree) {
			for(var t=0; t<parseTree.length; t++) {
				var parseTreeNode = parseTree[t];
				if(parseTreeNode.type === "link" && parseTreeNode.attributes.to && parseTreeNode.attributes.to.type === "string") {
					var value = parseTreeNode.attributes.to.value;
					if(links.indexOf(value) === -1) {
						links.push(value);
					}
				}
				if(parseTreeNode.children) {
					checkParseTree(parseTreeNode.children);
				}
			}
		};
	checkParseTree(parseTreeRoot);
	return links;
};

/*
Return an array of tiddler titles that are directly linked from the specified tiddler
*/
exports.getTiddlerLinks = function(title) {
	var self = this;
	// We'll cache the links so they only get computed if the tiddler changes
	return this.getCacheForTiddler(title,"links",function() {
		// Parse the tiddler
		var parser = self.parseTiddler(title);
		if(parser) {
			return self.extractLinks(parser.tree);
		}
		return [];
	});
};

/*
Return an array of tiddler titles that link to the specified tiddler
*/
exports.getTiddlerBacklinks = function(targetTitle) {
	var self = this,
		backIndexer = this.getIndexer("BackIndexer"),
		backlinks = backIndexer && backIndexer.subIndexers.link.lookup(targetTitle);

	if(!backlinks) {
		backlinks = [];
		this.forEachTiddler(function(title,tiddler) {
			var links = self.getTiddlerLinks(title);
			if(links.indexOf(targetTitle) !== -1) {
				backlinks.push(title);
			}
		});
	}
	return backlinks;
};

/*
Return an array of tiddler titles that are directly transcluded within the given parse tree. `title` is the tiddler being parsed, we will ignore its self-referential transclusions, only return
*/
exports.extractTranscludes = function(parseTreeRoot, title) {
  // Count up the transcludes
  var transcludes = [],
    checkParseTree = function(parseTree, parentNode) {
      for(var t=0; t<parseTree.length; t++) {
        var parseTreeNode = parseTree[t];
        if(parseTreeNode.type === "transclude") {
          if(parseTreeNode.attributes.$tiddler && parseTreeNode.attributes.$tiddler.type === "string") {
            var value;
            // if it is Transclusion with Templates like `{{Index||$:/core/ui/TagTemplate}}`, the `$tiddler` will point to the template. We need to find the actual target tiddler from parent node
            if(parentNode && parentNode.type === "tiddler" && parentNode.attributes.tiddler && parentNode.attributes.tiddler.type === "string") {
              // Empty value (like `{{!!field}}`) means self-referential transclusion. 
              value = parentNode.attributes.tiddler.value || title;
            } else {
              value = parseTreeNode.attributes.$tiddler.value;
            }
          } else if(parseTreeNode.attributes.tiddler && parseTreeNode.attributes.tiddler.type === "string") {
            // Old transclude widget usage
            value = parseTreeNode.attributes.tiddler.value;
          } else if(parseTreeNode.attributes.$field && parseTreeNode.attributes.$field.type === "string") {
            // Empty value (like `<$transclude $field='created'/>`) means self-referential transclusion. 
            value = title;
          } else if(parseTreeNode.attributes.field && parseTreeNode.attributes.field.type === "string") {
            // Old usage with Empty value (like `<$transclude field='created'/>`)
            value = title;
          }
          // Deduplicate the result.
          if(value && transcludes.indexOf(value) === -1) {
            transcludes.push(value);
          }
        }
        if(parseTreeNode.children) {
          checkParseTree(parseTreeNode.children, parseTreeNode);
        }
      }
    };
  checkParseTree(parseTreeRoot);
  return transcludes;
};


/*
Return an array of tiddler titles that are transcluded from the specified tiddler
*/
exports.getTiddlerTranscludes = function(title) {
  var self = this;
  // We'll cache the transcludes so they only get computed if the tiddler changes
  return this.getCacheForTiddler(title,"transcludes",function() {
    // Parse the tiddler
    var parser = self.parseTiddler(title);
    if(parser) {
      // this will ignore self-referential transclusions from `title`
      return self.extractTranscludes(parser.tree, title);
    }
    return [];
  });
};

/*
Return an array of tiddler titles that transclude to the specified tiddler
*/
exports.getTiddlerBacktranscludes = function(targetTitle) {
  var self = this,
    backIndexer = this.getIndexer("BackIndexer"),
    backtranscludes = backIndexer && backIndexer.subIndexers.transclude.lookup(targetTitle);

  if(!backtranscludes) {
    backtranscludes = [];
  }
  return backtranscludes;
};

})();
