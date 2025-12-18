/*\
title: $:/plugins/tiddlywiki/consent-banner/startup.js
type: application/javascript
module-type: startup

Startup initialisation

\*/

"use strict";

// Export name and synchronous status
exports.name = "consent-banner";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

var CHECK_CONSENT_INTERVAL = 1000, // Milliseconds between checking local storage
	IS_LOGGED_IN_TITLE = "$:/status/IsLoggedIn",
	CONSENT_KEY = "COOKIE_CONSENT", // Local storage keyname
	CONSENT_TITLE = "$:/state/consent-banner/accepted", // "": undeclared, "yes": accepted, "no": declined
	CONFIG_BLOCK_EMBEDDED_CONTENT_TITLE = "$:/config/plugins/tiddlywiki/consent-banner/block-embedded-content",
	EMBEDDED_MESSAGE_WRAPPER_TITLE = "$:/plugins/tiddlywiki/consent-banner/blocked-embed-message-wrapper";

exports.startup = function() { 
	var consentState = "",
		setConsentStatus = function(state) {
			if(consentState !== state) {
				consentState = state;
				// Write to local storage
				window.localStorage.setItem(CONSENT_KEY,state);
				// Write to a state tiddler
				$tw.wiki.addTiddler(new $tw.Tiddler({
					title: CONSENT_TITLE,
					text: state
				}));
			}
		},
		calculateConsentStatus = function() {
			// Consent is implied for logged in users, otherwise we check local storage
			return ($tw.wiki.getTiddlerText(IS_LOGGED_IN_TITLE) === "yes" && "yes") || window.localStorage.getItem(CONSENT_KEY) || "";
		},
		checkConsentStatus = function() {
			setConsentStatus(calculateConsentStatus());
			if(consentState === "") {
				pollConsentStatus();
			}
		},
		pollConsentStatus = function() {
			setTimeout(checkConsentStatus,CHECK_CONSENT_INTERVAL);
		};
	// Set the current consent status
	checkConsentStatus();
	// Listen for consent messages
	$tw.rootWidget.addEventListener("tm-consent-accept",function(event) {
		setConsentStatus("yes");
	});
	$tw.rootWidget.addEventListener("tm-consent-decline",function(event) {
		setConsentStatus("no");
	});
	$tw.rootWidget.addEventListener("tm-consent-clear",function(event) {
		setConsentStatus("");
	});
	// Add our element rendering hook
	if($tw.wiki.getTiddlerText(CONFIG_BLOCK_EMBEDDED_CONTENT_TITLE,"no") === "yes") {
		$tw.hooks.addHook("th-rendering-element",function(parseTreeNodes,widget) {
			if(parseTreeNodes) {
				return parseTreeNodes;
			}
			if(["iframe","object","embed"].indexOf(widget.tag) !== -1 && widget.getVariable("tv-block-embedded-content","no") === "yes") {
				var url = widget.getAttribute("src"),
					addUnitsIfMissing = function(str) {
						str = "" + str;
						return str + (("" + parseInt(str,10)) === str ? "px" : "");
					},
					width = addUnitsIfMissing(widget.getAttribute("width","")),
					height = addUnitsIfMissing(widget.getAttribute("height",""));
				return [
					{
						type: "vars",
						attributes: {
							url: {type: "string", value: url},
							width: {type: "string", value: width},
							height: {type: "string", value: height}
						},
						children: [
							{
								type: "transclude",
								attributes: {
									tiddler: {type: "string", value: EMBEDDED_MESSAGE_WRAPPER_TITLE},
									mode: {type: "string", value: "inline"}
								}
							}
						]
					}
				];
			}
			return null;
		});
	}
};
