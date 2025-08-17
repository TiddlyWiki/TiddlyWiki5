/*\
title: $:/core/modules/info/windowresize.js
type: application/javascript
module-type: info

Updates $:/info/browser/window/... tiddlers using the centralized windowResizeBus.
\*/

exports.getInfoTiddlerFields = function(updateInfoTiddlersCallback) {
	if($tw.browser && $tw.windowResizeBus) {

		function updateTiddlers(dims) {
			const tiddlers = [
				{title: "$:/info/browser/window/outer/width", text: String(dims.outerWidth)},
				{title: "$:/info/browser/window/outer/height", text: String(dims.outerHeight)},
				{title: "$:/info/browser/window/inner/width", text: String(dims.innerWidth)},
				{title: "$:/info/browser/window/inner/height", text: String(dims.innerHeight)},
				{title: "$:/info/browser/window/client/width", text: String(dims.clientWidth)},
				{title: "$:/info/browser/window/client/height", text: String(dims.clientHeight)}
			];
			updateInfoTiddlersCallback(tiddlers);
		}

		// Subscribe to the central window resize bus
		$tw.windowResizeBus.subscribe(updateTiddlers);
	}
	return [];
};
