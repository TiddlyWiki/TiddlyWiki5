/*\
title: $:/core/modules/startup/windowresizebus.js
type: application/javascript
module-type: startup

Provides a central debounced window resize event bus for other modules.
\*/

exports.before = ["info"];
exports.after = ["load-modules"];
exports.platforms = ["browser"];

const subscribers = new Set();
let scheduled = false;

function getDimensions() {
	return {
		outerWidth: window.outerWidth,
		outerHeight: window.outerHeight,
		innerWidth: window.innerWidth,
		innerHeight: window.innerHeight,
		clientWidth: document.documentElement.clientWidth,
		clientHeight: document.documentElement.clientHeight
	};
}

function notifySubscribers() {
	scheduled = false;
	const dims = getDimensions();
	subscribers.forEach(fn => {
		try {
			fn(dims);
		} catch(e) {
			console.error("Error in window resize subscriber:", e);
		}
	});
}

function onResize() {
	if(!scheduled) {
		scheduled = true;
		requestAnimationFrame(notifySubscribers);
	}
}

exports.startup = function() {
	$tw.windowResizeBus = {
		subscribe: function(fn) {
			if(typeof fn === "function") {
				subscribers.add(fn);
				// Defer the first call until after layout/paint
				requestAnimationFrame(() => fn(getDimensions()));
			}
		},
		unsubscribe: function(fn) {
			subscribers.delete(fn);
		}
	};

	window.addEventListener("resize", onResize, {passive: true});
};