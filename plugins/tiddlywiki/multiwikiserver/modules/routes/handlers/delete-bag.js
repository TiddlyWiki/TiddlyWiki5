/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/delete-bag.js
type: application/javascript
module-type: mws-route

DELETE /bags/:bag-name

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "DELETE";

exports.path = /^\/bags\/([^\/]+)$/;

exports.csrfDisable = true;

exports.useACL = true;

exports.entityName = "bag"

exports.handler = function(request,response,state) {
	const bagName = state.params[0];
	if(bagName) {
		const result = $tw.mws.store.deleteBag(bagName);
		if(!result) {
			state.sendResponse(302,{
				"Content-Type": "text/plain",
				"Location": "/"
			});
		} else {
			state.sendResponse(400,{
				"Content-Type": "text/plain"
			},
			result.message,
			"utf8");
		}
	} else {
		state.sendResponse(400,{
			"Content-Type": "text/plain"
		});
	}
};

}());