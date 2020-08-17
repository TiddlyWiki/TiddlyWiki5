/*\
title: $:/core/modules/storyviews/solo.js
type: application/javascript
module-type: storyview

Flip between individual tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var SoloListView = function(listWidget) {
};

// Engage single tiddler mode
SoloListView.singleTiddlerMode = true;

exports.solo = SoloListView;

})();
