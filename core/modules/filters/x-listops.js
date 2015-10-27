/*\
title: $:/core/modules/filters/x-listops.js
type: application/javascript
module-type: filteroperator

Extended filter operators to manipulate the current list.

\*/
(function () {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  var prepare_results = function (source) {
    var results = [];
    source(function (tiddler, title) {
      results.push(title);
    });
    return results;
  };

  /*
  Moves a number of items from the tail of the current list before the item named in the operand
  */
  exports.putbefore = function (source, operator, options) {
    var results = prepare_results(source),
        index = results.indexOf(operator.operand),
        count = parseInt(operator.suffix) || 1;
    if (index === -1) {
      return results.slice(0, -1);
    }
    return results.slice(0, index).concat(results.slice(-count)).concat(results.slice(index, -count));
  };

  /*
  Moves a number of items from the tail of the current list after the item named in the operand
  */
  exports.putafter = function (source, operator, options) {
    var results = prepare_results(source),
        index = results.indexOf(operator.operand),
        count = parseInt(operator.suffix) || 1;
    if (index === -1) {
      return results.slice(0, -1);
    }
    return results.slice(0, index + 1).concat(results.slice(-count)).concat(results.slice(index + 1, -count));
  };

  /*
  Replaces the item named in the operand with a number of items from the tail of the current list
  */
  exports.replace = function (source, operator, options) {
    var results = prepare_results(source),
        index = results.indexOf(operator.operand),
        count = parseInt(operator.suffix) || 1;
    if (index === -1) {
      return results.slice(0, -count);
    }
    return results.slice(0, index).concat(results.slice(-count)).concat(results.slice(index + 1, -count));
  };

  /*
  Moves a number of items from the tail of the current list to the head of the list
  */
  exports.putfirst = function (source, operator, options) {
    var results = prepare_results(source),
        count = parseInt(operator.suffix) || 1;
    return results.slice(-count).concat(results.slice(0, -count));
  };

  /*
  Moves a number of items from the head of the current list to the tail of the list
  */
  exports.putlast = function (source, operator, options) {
    var results = prepare_results(source),
        count = parseInt(operator.suffix) || 1;
    return results.slice(count).concat(results.slice(0, count));
  };

/*
  Moves the item named in the operand a number of places forward or backward in the list
  */
  exports.move = function (source, operator, options) {
    var results = prepare_results(source),
        index = results.indexOf(operator.operand),
        count = parseInt(operator.suffix) || 1,
        marker = results.splice(index, 1);
    return results.slice(0, index + count).concat(marker).concat(results.slice(index + count));
  };

  /*
  Returns the items from the current list that are after the item named in the operand
  */
  exports.allafter = function (source, operator, options) {
    var results = prepare_results(source),
        index = results.indexOf(operator.operand);
    if (index === -1 || index > (results.length - 2)) {
      return [];
    }
    if (operator.suffix) {
      return results.slice(index);
    }
    return results.slice(index + 1);
  };

  /*
  Returns the items from the current list that are before the item named in the operand
  */
  exports.allbefore = function (source, operator, options) {
    var results = prepare_results(source),
        index = results.indexOf(operator.operand);
    if (index <= 0) {
      return [];
    } 
    if (operator.suffix) {
      return results.slice(0, index + 1);
    }
    return results.slice(0, index);
  };

  /*
  Appends the items listed in the operand array to the tail of the current list 
  */
  exports.append = function (source, operator, options) {
    var results = prepare_results(source),
        count = parseInt(operator.suffix) || 1,
        append = $tw.utils.parseStringArray(operator.operand);
    if (append === "") {
      return results;
    }
    if (operator.prefix) {
        return results.concat(append.slice(-count));
    } else {
        return results.concat(append.slice(0, count));
    }
  };

  /*
  Prepends the items listed in the operand array to the head of the current list 
  */
  exports.prepend = function (source, operator, options) {
      var results = prepare_results(source),
          count = parseInt(operator.suffix) || 1,
          prepend = $tw.utils.parseStringArray(operator.operand);
    if (prepend === "") {
      return results;
    }
    if (operator.prefix) {
        return prepend.slice(-count).concat(results);
    } else {
        return prepend.slice(0, count).concat(results);
    }
  };

  /*
  Returns all items from the current list except the items listed in the operand array
  */
  exports.remove = function (source, operator, options) {
    var results = prepare_results(source),
        count = parseInt(operator.suffix) || 1,
        p, len, index, array = $tw.utils.parseStringArray(operator.operand);
    len = array.length - 1;
    for (p = 0; p < count; ++p) {
      if (operator.prefix) {
        index = results.indexOf(array[len - p]);
      } else {
        index = results.indexOf(array[p]);
      }
      if (index !== -1) {
        results.splice(index, 1);
      }
    }
    return results;
  };

  /*
  Returns all items from the current list sorted in the order of the items in the operand array
  */
  exports.sortby = function (source, operator, options) {
    var results = prepare_results(source);
    if (!results || results.length < 2) {
      return results;
    }
    var lookup = $tw.utils.parseStringArray(operator.operand);
    results.sort(function (a, b) {
      return lookup.indexOf(a) - lookup.indexOf(b);
    });
    return results;
  };

})();
