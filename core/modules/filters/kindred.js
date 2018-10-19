/*\
title: $:/core/modules/filters/kindred.js
type: application/javascript
module-type: filteroperator

Filter operator that gathering "family" of tiddler based on <field>

[kindred:<field>[<tiddler_from_family>]]
[kindredup:<field>[<tiddler_from_family>]]
[kindreddown:<field>[<tiddler_from_family>]]

\*/
(function () {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  // TODO: Should I set global tw to true?

  function collectFamilyMembers(tiddler, title, fieldname, direction) {
    var family_members = [];

    function addToResultsIfNotFoundAlready(title) {
      if (family_members.includes(title)) {
        return false;
      }
      family_members.push(title);
      return true
    }

    function findRecursivelyUp(tiddler, title) {
      if (addToResultsIfNotFoundAlready(title)) {
        if (tiddler) {
          tiddler.getFieldList(fieldname).forEach(function (target_title) {
            findRecursivelyUp($tw.wiki.getTiddler(target_title), target_title);
          });
        }
      }
    }

    function findRecursivelyDown(title) {
      if (addToResultsIfNotFoundAlready(title)) {
        $tw.wiki.findListingsOfTiddler(title, fieldname).forEach(function (target_title) {
          findRecursivelyDown(target_title);
        });
      }
    }

    if ((direction === 'up') || (direction === 'both')) {
      findRecursivelyUp(tiddler, title);
    }
    if (direction === 'both') {
      // Remove the base family member:
      // If it's already in the results, it will be skipped when parsing in
      // the oposite direction.
      family_members.shift();
    }
    if ((direction === 'down') || (direction === 'both')) {
      findRecursivelyDown(title);
    }
    return family_members;
  }

  function executeSource(source, operator, direction) {

    // TODO: System tiddlers are not shown???

    var results = [],
      fieldname = (operator.suffix || 'tags').toLowerCase(),
      title_from_family = operator.operand,
      tiddler_from_family = $tw.wiki.getTiddler(title_from_family),
      family_members = collectFamilyMembers(tiddler_from_family, title_from_family, fieldname, direction);

    source(function (tiddler, title) {
      if (family_members.includes(title)) {
        results.push(title);
      }
    });

    return results;
  }

  /*
  Export our filter function
  */
  exports.kindred = function (source, operator, options) {
    return executeSource(source, operator, 'both');
  };

  exports.kindredup = function (source, operator, options) {
    return executeSource(source, operator, 'up');
  };

  exports.kindreddown = function (source, operator, options) {
    return executeSource(source, operator, 'down');
  };

})();
