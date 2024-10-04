/*\
title: $:/plugins/tiddlywiki/multiwikiserver/commands/mws-list-users.js
type: application/javascript
module-type: command

Command to list users

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
  name: "mws-list-users",
  synchronous: false
};

var Command = function(params,commander,callback) {
  this.params = params;
  this.commander = commander;
  this.callback = callback;
};

Command.prototype.execute = function() {
  var self = this;

  if(!$tw.mws || !$tw.mws.store || !$tw.mws.store.sqlTiddlerDatabase) {
    return "Error: MultiWikiServer or SQL database not initialized.";
  }

  var users = $tw.mws.store.sqlTiddlerDatabase.listUsers().map(function(user){
      return ({
      username: user.username,
      email: user.email,
      created_at: user.created_at,
    })
  });
  console.log("Users:", users);
  self.callback(null, "Users retrieved successfully:\n" + JSON.stringify(users, null, 2));
};

exports.Command = Command;

})();