/*\
title: $:/plugins/tiddlywiki/ai-tools/modules/conversations-archive-importer.js
type: application/javascript
module-type: library

Conversations archive importer

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function ConversationsArchiveImporter() {
}

ConversationsArchiveImporter.prototype.import = function(widget,conversationsTitle) {
	var logger = new $tw.utils.Logger("ai-tools");
	var jsonConversations = widget.wiki.getTiddlerData(conversationsTitle,[]);
	var tiddlers = [];
	$tw.utils.each(jsonConversations,function(jsonConversation) {
		var conversationTitle = (jsonConversation.title || "Untitled") + " (" + jsonConversation.conversation_id + ")",
			conversationCreated = convertDate(jsonConversation.create_time),
			conversationModified = convertDate(jsonConversation.update_time);
		var conversationFields = {
			title: conversationTitle,
			tags: $tw.utils.stringifyList(["$:/tags/AI/Conversation"]),
			created: conversationCreated,
			modified: conversationModified
		};
		tiddlers.push(conversationFields);
		var messageIndex = 1;
		$tw.utils.each(jsonConversation.mapping,function(jsonMessage,messageId) {
			// Skip messages where "message" is null
			if(jsonMessage.message) {
				var messageFields = {
					title: conversationTitle + " " + (messageIndex + 1),
					created: convertDate(jsonMessage.message.create_time) || conversationCreated,
					modified: convertDate(jsonMessage.message.update_time) || conversationModified,
					tags: $tw.utils.stringifyList([conversationTitle]),
					role: jsonMessage.message.author.role,
					"message-type": jsonMessage.message.content.content_type
				}
				switch(jsonMessage.message.content.content_type) {
					case "code":
						messageFields.text = jsonMessage.message.content.text;
						messageFields.type = "text/plain";
						break;
					case "execution_output":
						messageFields.text = jsonMessage.message.content.text;
						messageFields.type = "text/plain";
						break;
					case "system_error":
						messageFields.text = jsonMessage.message.content.text;
						messageFields.type = "text/plain";
						break;
					case "text":
						messageFields.text = jsonMessage.message.content.parts.join("");
						messageFields.type = "text/markdown";
						break;
					default:
						messageFields.text = JSON.stringify(jsonMessage.message,null,4);
						messageFields.type = "text/plain";
					break;
				}
				tiddlers.push(messageFields);
				messageIndex += 1;
			}
		});
	});
	// Create summary tiddler
	$tw.utils.each(tiddlers,function(tidder) {
		
	});
	// Create the tiddlers
	widget.wiki.addTiddlers(tiddlers);
	// widget.dispatchEvent({type: "tm-import-tiddlers", param: JSON.stringify(tiddlers)});
};

function convertDate(unixTimestamp) {
	return $tw.utils.stringifyDate(new Date(unixTimestamp * 1000));
}

exports.ConversationsArchiveImporter = ConversationsArchiveImporter;

})();
