module.exports = exports = ConsoleSpecFilter;

function ConsoleSpecFilter(options) {
  var filterString = options && options.filterString;
  var filterPattern = new RegExp(filterString);

  this.matches = function(specName) {
    return filterPattern.test(specName);
  };
}
