/*\
title: method/a.js
type: application/javascript
module-type: library

Method test

\*/


exports.foo = function () {
    return this;
};
exports.set = function (x) {
    this.x = x;
};
exports.get = function () {
    return this.x;
};
exports.getClosed = function () {
    return exports.x;
};

