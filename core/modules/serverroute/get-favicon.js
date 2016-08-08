/*\
title: $:/core/modules/serverroute/get-favicon.js
type: application/javascript
module-type: serverroute

GET /favicon.ico

\*/
(function() {
	module.exports = {
		method: "GET",
		path: /^\/favicon.ico$/,

		handler: function(request,response,state) {
			response.writeHead(200, {"Content-Type": "image/x-icon"});
			var buffer = state.wiki.getTiddlerText("$:/favicon.ico","");
			response.end(buffer,"base64");
		}
	};
}());
