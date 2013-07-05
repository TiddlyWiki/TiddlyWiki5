/*\
title: $:/core/modules/widgets/list/listviews/pop.js
type: application/javascript
module-type: listview

Animates list insertions and removals

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var PopListView = function(listWidget) {
	this.listWidget = listWidget;
}

PopListView.prototype.insert = function(index) {
	var listElementNode = this.listWidget.children[index],
		targetElement = listElementNode.domNode;
	// Reset once the transition is over
	var transitionEventName = $tw.utils.convertEventName("transitionEnd");
	targetElement.addEventListener(transitionEventName,function handler(event) {
		$tw.utils.setStyle(targetElement,[
			{transition: "none"},
			{transform: "none"}
		]);
		targetElement.removeEventListener(transitionEventName,handler,false);
	},false);
	// Set up the initial position of the element
	$tw.utils.setStyle(targetElement,[
		{transition: "none"},
		{transform: "scale(2)"},
		{opacity: "0.0"}
	]);
	$tw.utils.forceLayout(targetElement);
	// Transition to the final position
	$tw.utils.setStyle(targetElement,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"opacity " + $tw.config.preferences.animationDurationMs + " ease-in-out"},
		{transform: "scale(1)"},
		{opacity: "1.0"}
	]);
};

PopListView.prototype.remove = function(index) {
	var listElementNode = this.listWidget.children[index],
		targetElement = listElementNode.domNode;
	// Attach an event handler for the end of the transition
	var transitionEventName = $tw.utils.convertEventName("transitionEnd");
	targetElement.addEventListener(transitionEventName,function handler(event) {
		if(targetElement.parentNode) {
			targetElement.parentNode.removeChild(targetElement);
		}
		targetElement.removeEventListener(transitionEventName,handler,false);
	},false);
	// Animate the closure
	$tw.utils.setStyle(targetElement,[
		{transition: "none"},
		{transform: "scale(1)"},
		{opacity: "1.0"}
	]);
	$tw.utils.forceLayout(targetElement);
	$tw.utils.setStyle(targetElement,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"opacity " + $tw.config.preferences.animationDurationMs + " ease-in-out"},
		{transform: "scale(0.1)"},
		{opacity: "0.0"}
	]);
	// Returning true causes the DOM node not to be deleted
	return true;
};

exports.pop = PopListView;

})();
