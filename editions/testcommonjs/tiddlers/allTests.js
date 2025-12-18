/*\
title: allTests.js
type: application/javascript
module-type: library

Runs all CommonJS Modules tests

\*/

$tw.modules.execute('absolute/program.js');
$tw.modules.execute('cyclic/program.js');
$tw.modules.execute('determinism/program.js');
$tw.modules.execute('exactExports/program.js');
$tw.modules.execute('hasOwnProperty/program.js');
$tw.modules.execute('method/program.js');
$tw.modules.execute('missing/program.js');
$tw.modules.execute('monkeys/program.js');
$tw.modules.execute('nested/program.js');
$tw.modules.execute('relative/program.js');
$tw.modules.execute('transitive/program.js');



