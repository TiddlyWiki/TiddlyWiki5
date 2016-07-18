/*\
title: $:/core/modules/serverroute/get-status.js
type: application/javascript
module-type: serverroute

GET /status

\*/
(function() {
	module.exports = {
		method: "GET",
		path: /^\/status$/,

		handler: function(request,response,state) {
			response.writeHead(200, {"Content-Type": "application/json"});
			var text = JSON.stringify({
				username: state.server.get("username"),
				space: {
					recipe: "default"
				},
				tiddlywiki_version: $tw.version
			});
			response.end(text,"utf8");
		}
	};
}());
