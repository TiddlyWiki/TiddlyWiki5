/*\
title: $:/edition/tw5.com/dropbox-url.js
type: application/javascript
tags: $:/tags/Macro
module-type: macro

Implements the Dropbox URL converter macro.

```
<$macrocall $name="dropbox-url" url={{$:/temp/dropbox}}/>
```

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "dropbox-url";

exports.params = [
	{name: "url", default: "https://www.dropbox.com/s/<gobbledegook>/mywiki.html"}
];

exports.run = function(url) {
	url = url.replace("www.dropbox.com","dl.dropboxusercontent.com");
	return "`" + url + "` <small>([[open|" + url + "]])</small>";
};

})();
