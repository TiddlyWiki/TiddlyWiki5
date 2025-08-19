/*\
title: $:/core/modules/info/windowdimensions.js
type: application/javascript
module-type: info
\*/

exports.getInfoTiddlerFields = function(updateInfoTiddlersCallback) {
	if(!$tw.browser) {
		return [];
	}

	const resizeHandlers = new Map();

	const dimensionsInfo = [
		["outer/width", win => win.outerWidth],
		["outer/height", win => win.outerHeight],
		["inner/width", win => win.innerWidth],
		["inner/height", win => win.innerHeight],
		["client/width", win => win.document.documentElement.clientWidth],
		["client/height", win => win.document.documentElement.clientHeight]
	];

	const buildTiddlers = function(win,windowId) {
		const prefix = `$:/info/browser/window/${windowId}/`;
		return dimensionsInfo.map(info => ({title: prefix + info[0], text: String(info[1](win))}));
	};

	const clearTiddlers = function(windowId) {
		const prefix = `$:/info/browser/window/${windowId}/`,
			deletions = [];
		dimensionsInfo.forEach(info => deletions.push(prefix + info[0]));
		updateInfoTiddlersCallback([],deletions);
	};

	const getUpdateHandler = function(win,windowId) {
		let scheduled = false;
		return () => {
			if(!scheduled) {
				scheduled = true;
				requestAnimationFrame(() => {
					updateInfoTiddlersCallback(buildTiddlers(win,windowId),[]);
					scheduled = false;
				});
			}
		};
	};

	const trackWindow = function(win,windowId) {
		const handler = getUpdateHandler(win,windowId);
		handler(); // initial update
		win.addEventListener("resize",handler,{passive:true});
		resizeHandlers.set(windowId,{win,handler});
	};

	// Track main window
	trackWindow(window,"main");

	if($tw.multiWindowBus){
		$tw.multiWindowBus.on("opened", ({window:win, windowID}) => trackWindow(win,windowID));
		$tw.multiWindowBus.on("closed", ({windowID}) => {
			const entry = resizeHandlers.get(windowID);
			if(entry) {
				entry.win.removeEventListener("resize",entry.handler);
				resizeHandlers.delete(windowID);
			}
			clearTiddlers(windowID);
		});
	}

	return [];
};
