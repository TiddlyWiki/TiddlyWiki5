/*\
title: absolute/submodule/a.js
type: application/javascript
module-type: library

Absolute require test

\*/


exports.foo = function () {
    return require('../b');
};

