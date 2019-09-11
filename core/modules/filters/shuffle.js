/*\
title: $:/core/modules/filters/shuffle.js
type: application/javascript
module-type: filteroperator

A filter operator to randomize the order of the list passed to it.

\*/
(function(){

    "use strict";

    var hash = function(str) {
      var hash = 0, i, chr, len;
      if (str.length === 0) return hash;
      for (i = 0, len = str.length; i < len; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    }

    var shuffle = function(array, seed) {
      var currentIndex = array.length, temporaryValue, randomIndex ;
     Math.seedrandom(seed)

      // While there remain elements to shuffle...
      while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array;
    }

    var prepare_results = function (source) {
      var results = [];
      source(function(tiddler,title) {
        results.push(title);
      });
      return results;
    };

    exports.shuffle = function(source, operator, options) {
       var results = prepare_results(source);
       if (operator['operand'] !== "") {
         shuffle(results, hash(operator['operand']));
       } else if (options.wiki.tiddlerExists("$:/temp/seed")) {
         shuffle(results, options.wiki.getTiddler("$:/temp/seed").getFieldString("startup"));
       } else {
         shuffle(results, "");
       }
       return results;
    }
})();
