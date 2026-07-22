/*\
title: $:/tw5.com/modules/underlinedtabs-animate.js
type: application/javascript
module-type: startup

Conditional first-tab slide animation for the Underlined Tabs theme.
Watches each .tc-tab-buttons container and tags the first tab with
an animation class only when its selected state actually flips —
not when another tab is clicked (which also rebuilds the tab DOM).
Lives as an edition tiddler because theme plugins don't register JS
modules at boot. The CSS rules keying off these classes ship with
the underlined theme; when a different theme is active the classes
have no visual effect, so this can run unconditionally.
\*/
"use strict";

exports.name = "underlinedtabs-animate";
exports.platforms = ["browser"];
exports.after = ["rootwidget"];
exports.synchronous = true;

exports.startup = function() {
	function applyAnim(btn, inward) {
		var cls = inward ? "tc-uit-anim-in" : "tc-uit-anim-out";
		btn.classList.add(cls);
		btn.addEventListener("animationend", function handler() {
			btn.classList.remove(cls);
			btn.removeEventListener("animationend", handler);
		});
	}

	function check(container) {
		var btn = container.firstElementChild;
		if(!btn || btn.tagName !== "BUTTON") return;
		var isSelected = btn.classList.contains("tc-tab-selected");
		var prev = container.dataset.uitFirstSelected;
		if(prev !== undefined && (prev === "true") !== isSelected) {
			applyAnim(btn, isSelected);
		}
		container.dataset.uitFirstSelected = String(isSelected);
	}

	function scanAll() {
		document.querySelectorAll(".tc-tab-buttons").forEach(check);
	}

	var pending = false;
	function schedule() {
		if(pending) return;
		pending = true;
		Promise.resolve().then(function() {
			pending = false;
			scanAll();
		});
	}

	var obs = new MutationObserver(schedule);
	obs.observe(document.body, {childList: true, subtree: true});
	scanAll();
};
