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

ClassicListView.prototype.insert = function(index) {
	var listElementNode = this.listMacro.listFrame.children[index],
		targetElement = listElementNode.domNode;
	// Get the current height of the tiddler
	var currHeight = targetElement.offsetHeight;
	// Animate the closure
	var d = $tw.config.preferences.animationDuration + "ms";
	targetElement.style[$tw.browser.transition] = "";
	targetElement.style[$tw.browser.transformorigin] = "0% 0%";
	targetElement.style[$tw.browser.transform] = "translateX(" + window.innerWidth + "px)";
	targetElement.style.opacity = "0.0";
	targetElement.style.height = "0px";
	$tw.utils.forceLayout(targetElement);
	targetElement.style[$tw.browser.transition] = "-" + $tw.browser.prefix.toLowerCase() + "-transform " + d + " ease-in-out, " +
														"opacity " + d + " ease-out, " +
														"height " + d + " ease-in-out";
	targetElement.style[$tw.browser.transform] = "translateX(0px)";
	targetElement.style.opacity = "1.0";
	targetElement.style.height = currHeight + "px";
};

ClassicListView.prototype.remove = function(index) {
	var listElementNode = this.listMacro.listFrame.children[index],
		targetElement = listElementNode.domNode;
	// Get the current height of the tiddler
	var currHeight = targetElement.offsetHeight;
	// Put a wrapper around the dom node we're closing
	var wrapperElement = document.createElement("div");
	targetElement.parentNode.insertBefore(wrapperElement,targetElement);
	wrapperElement.appendChild(targetElement);
	// Attach an event handler for the end of the transition
	wrapperElement.addEventListener($tw.browser.transitionEnd,function(event) {
		if(wrapperElement.parentNode) {
			wrapperElement.parentNode.removeChild(wrapperElement);
		}
	},false);
	// Animate the closure
	var d = $tw.config.preferences.animationDuration + "ms";
	wrapperElement.style[$tw.browser.transition] = "-" + $tw.browser.prefix.toLowerCase() + "-transform " + d + " ease-in-out, " +
															"opacity " + d + " ease-out, " +
															"height " + d + " ease-in-out";
	wrapperElement.style[$tw.browser.transformorigin] = "0% 0%";
	wrapperElement.style[$tw.browser.transform] = "translateX(0px)";
	wrapperElement.style.opacity = "1.0";
	wrapperElement.style.height = currHeight + "px";
	$tw.utils.forceLayout(wrapperElement);
	wrapperElement.style[$tw.browser.transform] = "translateX(-" + window.innerWidth + "px)";
	wrapperElement.style.opacity = "0.0";
	wrapperElement.style.height = "0px";
	// Returning true causes the DOM node not to be deleted
	return true;
};

exports["classic"] = ClassicListView;

})();
