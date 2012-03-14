var modules = {};

var define = function(name,module) {
	modules[name] = {module: module};
};

define("util",function(require,exports) {});
