/*\
title: $:/core/modules/utils/dom/animator.js
type: application/javascript
module-type: utils

Orchestrates animations and transitions

\*/

"use strict";

function Animator() {
	// Get the registered animation modules
	this.animations = {};
	$tw.modules.applyMethods("animation",this.animations);
}

Animator.prototype.perform = function(type,domNode,options) {
	options = options || {};
	// Find an animation that can handle this type
	var chosenAnimation;
	$tw.utils.each(this.animations,function(animation,name) {
		if($tw.utils.hop(animation,type)) {
			chosenAnimation = animation[type];
		}
	});
	if(!chosenAnimation) {
		chosenAnimation = function(domNode,options) {
			if(options.callback) {
				options.callback();
			}
		};
	}
	// Call the animation
	chosenAnimation(domNode,options);
};

exports.Animator = Animator;
