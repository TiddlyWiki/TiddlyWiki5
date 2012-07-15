/*\
title: $:/core/modules/utils/dom/modal.js
type: application/javascript
module-type: utils

Modal message mechanism

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Modal = function(wiki) {
	this.wiki = wiki;
};

Modal.prototype.display = function(title) {
	var wrapper = document.createElement("div"),
		template,renderer;
	template = "$:/templates/ModalMessage";
	renderer = $tw.wiki.parseTiddler(template);
	renderer.execute([],title);
	renderer.renderInDom(wrapper);
	$tw.wiki.addEventListener("",function(changes) {
		renderer.refreshInDom(changes);
	});
	wrapper.addEventListener("tw-close",function(event) {
console.log("Got tw-close event");
		document.body.removeChild(wrapper);
		event.stopPropogation();
		return false;
	},false);
	document.body.appendChild(wrapper);
};

exports.Modal = Modal;

})();
