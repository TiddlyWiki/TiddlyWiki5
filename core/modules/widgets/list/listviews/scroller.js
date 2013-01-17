/*\
title: $:/core/modules/widgets/list/listviews/scroller.js
type: application/javascript
module-type: listview

A list view that scrolls to newly inserted elements

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var ScrollerListView = function(listWidget) {
	this.listWidget = listWidget;
}

ScrollerListView.prototype.navigateTo = function(historyInfo) {
	var listElementIndex = this.listWidget.findListElementByTitle(0,historyInfo.title),
		listElementNode = this.listWidget.children[listElementIndex],
		targetElement = listElementNode.domNode;
	// Scroll the node into view
	var scrollEvent = document.createEvent("Event");
	scrollEvent.initEvent("tw-scroll",true,true);
	targetElement.dispatchEvent(scrollEvent);
};

exports.scroller = ScrollerListView;

})();
