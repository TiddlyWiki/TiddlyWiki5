/*\
title: $:/core/modules/commands/publish.js
type: application/javascript
module-type: command

Publish static files

\*/
(function(){

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";
    
    exports.info = {
        name: "publish",
        synchronous: false
    };
    
    var Command = function(params,commander,callback) {
        this.params = params;
        this.commander = commander;
        this.callback = callback;
    };
    
    Command.prototype.execute = function() {
        if(this.params.length < 1) {
            return "Missing filename filter";
        }
        var self = this,
            wiki = this.commander.wiki,
            jobTiddler = this.params[0],
            variableList = this.params.slice(1),
            variables =  Object.create(null);
        while(variableList.length >= 2) {
            variables[variableList[0]] = variableList[1];
            variableList = variableList.slice(2);
        }
        $tw.publisherHandler.publish(jobTiddler,this.callback,{commander: this.commander,variables: variables});
        return null;
    };
    
    exports.Command = Command;
    
    })();
    