/*\
title: $:/core/modules/macros/infosaver.js
type: application/javascript
module-type: macro

Display saver info name

\*/

;(function () {
  /*jslint node: true, browser: true */
  /*global $tw: false */
  'use strict'

  /*
   * Information about this macro
   */
  exports.name = 'infosaver'

  exports.params = [
    {name: 'tiddler'}
  ]

  /*
   * Run the macro
   */
  exports.run = function (tiddler) {
    return $tw.saverHandler.getSaver(tiddler).module.info.name
  }
})()
