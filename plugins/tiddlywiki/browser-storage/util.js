/*\
title: $:/plugins/tiddlywiki/browser-storage/util.js
type: application/javascript
module-type: library

Utility methods for browser-storage plugin

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function BrowserStorageUtil(wiki,options) {
    this.options = options || {};
    this.wiki = wiki;
    this.cachedTiddlers = [];
    this.QUOTA_EXCEEDED_ALERT_TITLE = "$:/config/BrowserStorage/QuotaExceededAlert";
    this.DEFAULT_QUOTA_EXCEEDED_ALERT_PREFIX = "Quota exceeded attempting to store `";
    this.DEFAULT_QUOTA_EXCEEDED_ALERT_SUFFIX = "` in browser local storage";
}

BrowserStorageUtil.prototype.isEnabled = function() {
    return $tw.wiki.getTiddlerText(this.options.enabledTitle) === "yes";
};

BrowserStorageUtil.prototype.cachePreloadTiddlers = function() {
    var self = this;
    $tw.utils.each($tw.boot.preloadDirty, function(item){
        var tiddler = $tw.wiki.getTiddler(item);
        self.cachedTiddlers.push(tiddler);
    });
};

BrowserStorageUtil.prototype.addCachedTiddlers = function() {
    var self = this;
    if(this.cachedTiddlers.length > 0) {
        $tw.utils.each(this.cachedTiddlers, function(item){
            $tw.wiki.addTiddler(item);
        });
        this.cachedTiddlers.length = 0;
    }
};

BrowserStorageUtil.prototype.removeTiddlerFromLocalStorage = function(title) {
    console.log("browser-storage: Removing", title);
    window.localStorage.removeItem(this.options.prefix + title);
};

BrowserStorageUtil.prototype.saveTiddlerToLocalStorage = function(title) {
    // Get the tiddler
    var tiddler = $tw.wiki.getTiddler(title);
    if(tiddler) {
        console.log("browser-storage: Saving",title);
        // Get the JSON of the tiddler				
        var json = JSON.stringify(tiddler.getFieldStrings());
        // Try to save it to local storage
        try {
            window.localStorage.setItem(this.options.prefix + title,json);
        } catch(e) {
            if(e.name === "QuotaExceededError") {
                // Complain if we failed
                var msg = $tw.wiki.getTiddlerText(this.QUOTA_EXCEEDED_ALERT_TITLE,this.DEFAULT_QUOTA_EXCEEDED_ALERT_PREFIX + title + this.DEFAULT_QUOTA_EXCEEDED_ALERT_SUFFIX);
                if(this.options.logger) {
                    this.options.logger.alert(msg);
                }
                // No point in keeping old values around for this tiddler
                window.localStorage.removeItem(this.options.prefix + title);
            } else {
                console.log("Browser-storage error:",e);
            }
        }
    } else {
        // In local storage, use the special value of empty string to mark the tiddler as deleted
        // On future page loads, if the tiddler is already gone from startup then the blank entry
        // will be removed from localstorage. Otherwise, the tiddler will be deleted.
        console.log("browser-storage: Blanking",title); 
        try {
            window.localStorage.setItem(this.options.prefix + title, "");
        } catch(e) {
            console.log("Browser-storage error:",e);
        }
    }
};

BrowserStorageUtil.prototype.clearLocalStorage = function() {
    var url = window.location.pathname,
        log = [];
    // Step through each browser storage item
    if(window.localStorage) {
        for(var index=window.localStorage.length - 1; index>=0; index--) {
            var key = window.localStorage.key(index),
                parts = key.split("#");
            // Delete it if it is ours
            if(parts[0] === "tw5" && parts[1] === url) {
                window.localStorage.removeItem(key);
            }
        }
    }
};

exports.BrowserStorageUtil = BrowserStorageUtil;

})();
