/*\
title: cyclic/b.js
type: application/javascript
module-type: library

Cycle require test B

\*/



var a = require('./a');
exports.b = function () {
    return a;
};

