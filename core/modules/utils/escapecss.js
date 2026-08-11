/*\
title: $:/core/modules/utils/escapecss.js
type: application/javascript
module-type: utils-browser

Provides CSS.escape() functionality.

\*/

"use strict";

exports.escapeCSS = (function() {
	return window.CSS.escape;
})();
