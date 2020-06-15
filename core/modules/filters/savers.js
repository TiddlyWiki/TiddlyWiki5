/*\
title: $:/core/modules/filters/savers.js
type: application/javascript
module-type: filteroperator

This Filter operator return savers title

\*/
;(function () {
  /*jslint node: true, browser: true */
  /*global $tw: false */
  'use strict'

  /*
  Export our filter function
  */
  exports.savers = function (source, operator, options) {
    var results = []
    for (var i in $tw.saverHandler.savers) {
      results.push($tw.saverHandler.savers[i].title)
    }
    return results
  }
})()
