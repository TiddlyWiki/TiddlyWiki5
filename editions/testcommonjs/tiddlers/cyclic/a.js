/*\
title: cyclic/a.js
type: application/javascript
module-type: library

Cycle require test A

\*/

exports.a = function () {
    return b;
};
var b = require('./b');


