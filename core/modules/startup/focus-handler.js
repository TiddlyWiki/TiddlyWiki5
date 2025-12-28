/*\
title: $:/plugins/custom/sidebar-focus/startup.js
type: application/javascript
module-type: startup

Handles focus management and spacebar scrolling for sidebar layout

\*/

"use strict";

exports.name = "sidebar-focus";
exports.platforms = ["browser"];
exports.after = ["story"];
exports.synchronous = true;

exports.startup = function() {
    var mainSelector = ".tc-story-river";
    var sidebarSelector = ".tc-sidebar";

    // Focus main content on startup
    var main = document.querySelector(mainSelector);
    if (main) {
        main.focus();
    }

    // Prevent spacebar scrolling on sidebar container itself
    document.addEventListener("keydown", function(e) {
        if (e.key !== " ") return;
        
        var sidebar = document.querySelector(sidebarSelector);
        if (sidebar && e.target === sidebar) {
            e.preventDefault();
        }
    });
};
