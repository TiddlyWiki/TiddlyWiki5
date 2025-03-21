/*\
title: $:/plugins/tiddlywiki/twitter/widget.js
type: application/javascript
module-type: widget

Twitter widget

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var TwitterWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
TwitterWidget.prototype = new Widget();

var optionAttributes = "align ariaPolite borderColor cards chrome conversation count dnt hashtags height height lang linkColor related size text theme tweetLimit via width".split(" "),
	otherAttributes = "hashtag id ownerScreenName screenName slug tweetID type url userId widgetId".split(" "),
	allAttributes = Array.prototype.slice.call(optionAttributes,0).concat(otherAttributes);

/*
Render this widget into the DOM
*/
TwitterWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Housekeeping
	this.parentDomNode = parent;
	this.computeAttributes();
	// Compose the arguments for the tweet call
	var method,
		arg,
		options = {};
		$tw.utils.each(optionAttributes,function(attr) {
			options[attr] = self.getAttribute(attr);
		});
	switch(this.getAttribute("type")) {
		case "shareButton":
			method = "createShareButton";
			arg = this.getAttribute("url");
			break;
		case "followButton":
			method = "createFollowButton";
			arg = this.getAttribute("screenName");
			break;
		case "hashtagButton":
			method = "createHashtagButton";
			arg = this.getAttribute("hashtag");
			break;
		case "mentionButton":
			method = "createMentionButton";
			arg = this.getAttribute("screenName");
			break;
		case "tweet":
			method = "createTweet";
			arg = this.getAttribute("tweetID");
			break;
		case "timelineProfile":
			method = "createTimeline";
			arg = {
				sourceType: "profile",
				screenName: this.getAttribute("screenName"),
				userId: this.getAttribute("userId")
			};
			break;
		case "timelineLikes":
			method = "createTimeline";
			arg = {
				sourceType: "likes",
				screenName: this.getAttribute("screenName"),
				userId: this.getAttribute("userId")
			};
			break;
		case "timelineList":
			method = "createTimeline";
			arg = {
				sourceType: "list",
				ownerScreenName: this.getAttribute("ownerScreenName"),
				slug: this.getAttribute("slug"),
				id: this.getAttribute("id")
			};
			break;
		case "timelineCollection":
			method = "createTimeline";
			arg = {
				sourceType: "collection",
				id: this.getAttribute("id")
			};
			break;
		case "timelineUrl":
			method = "createTimeline";
			arg = {
				sourceType: "url",
				url: this.getAttribute("url")
			};
			break;
		case "timelineWidget":
			method = "createTimeline";
			arg = {
				sourceType: "widget",
				widgetId: this.getAttribute("widgetId")
			};
			break;
	}
	// Render the tweet into a div
	var div = this.document.createElement("div");
	if(!this.document.isTiddlyWikiFakeDom && window.twttr && method) {
		twttr.ready(function(twttr) {
			window.twttr.widgets[method](arg,div,options);
		});
	} else {
		div.appendChild(this.document.createTextNode("Can't render tweet"));
	}
	// Insert it into the DOM
	parent.insertBefore(div,nextSibling);
	this.domNodes.push(div);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
TwitterWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(allAttributes.find(function(attr) {
		return $tw.utils.hop(changedAttributes,attr);
	})) {
		this.refreshSelf();
		return true;
	} else {
		return false;	
	}
};

exports.twitter = TwitterWidget;
