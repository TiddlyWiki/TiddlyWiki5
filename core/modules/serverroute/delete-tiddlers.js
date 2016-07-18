/*\
title: $:/core/modules/serverroute/delete-tiddlers.js
type: application/javascript
module-type: serverroute

DELETE /recipes/default/tiddlers/:title

\*/
(function() {
	module.exports = {
		method: "DELETE",
		path: /^\/bags\/default\/tiddlers\/(.+)$/,

		handler: function(request,response,state) {
			var title = decodeURIComponent(state.params[0]);
			state.wiki.deleteTiddler(title);
			response.writeHead(204, "OK", {
				"Content-Type": "text/plain"
			});
			response.end();
		}
	};
}());
