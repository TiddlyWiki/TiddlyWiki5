/*\
title: $:/plugins/tiddlywiki/tiddlyweb/sse-client.js
type: application/javascript
module-type: startup

GET /recipes/default/tiddlers/:title

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "/events/plugins/tiddlywiki/tiddlyweb";
exports.after = ["startup"];
exports.synchronous = true;
exports.platforms = ["browser"];
exports.startup = function () {
  //make sure we're actually being used
  if($tw.syncadaptor.name !== "tiddlyweb") return;
  //get the mount point in case a path prefix is used
  var host = $tw.syncadaptor.getHost();
  //make sure it ends with a slash (it usually does)
  if(!host.endsWith("/")) host += "/";
  //setup the event listener 
  var events = new EventSource(host + "events/plugins/tiddlywiki/tiddlyweb");
  events.addEventListener("change", function () {
    $tw.syncer.syncFromServer();
  });
}

})();