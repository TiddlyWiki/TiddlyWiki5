/*\
title: $:/plugins/wikilabs/debug/startup.js
type: application/javascript
module-type: startup

The main startup module that initializes the debug popup functionality.
\*/
"use strict";

exports.name = "debug-popup-startup";
exports.platforms = ["browser"];
exports.before = ["startup"];
exports.synchronous = true;

exports.startup = function() {
    const { DebugInfoPopup } = require("$:/plugins/wikilabs/debug/element.js");
    const { init } = require("$:/plugins/wikilabs/debug/observer.js");

    if (!window.customElements.get("debug-info-popup")) {
        window.customElements.define("debug-info-popup", DebugInfoPopup);

        let globalDebugPopup = document.getElementById("tw-debug-popup-instance");
        if (!globalDebugPopup) {
            globalDebugPopup = document.createElement("debug-info-popup");
            globalDebugPopup.id = "tw-debug-popup-instance";
            document.body.appendChild(globalDebugPopup);

            globalDebugPopup.addEventListener("mouseenter", function() {
                globalDebugPopup.handlePopupMouseEnter();
            });
            globalDebugPopup.addEventListener("mouseleave", function() {
                globalDebugPopup.handlePopupMouseLeave();
            });
        }
        
        init(globalDebugPopup);
    }
};