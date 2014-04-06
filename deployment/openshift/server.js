var $tw = require("./boot/boot.js").TiddlyWiki();

/* OpenShift defines several environment variables that would
 * be useful to deploy TiddlyWiki5:
 *
 * OPENSHIFT_DATA_DIR - this is the directory for user data
 * OPENSHIFT_NODEJS_{IP/PORT} - the IP:PORT OpenShift uses to
 * communicate with the app
 */
$tw.boot.argv = [
  process.env.OPENSHIFT_DATA_DIR,
  "--verbose",
  "--server",
  process.env.OPENSHIFT_NODEJS_PORT,
  "$:/core/save/all",
  "text/plain",
  "text/html",
  "<username>",
  "<password>",
  process.env.OPENSHIFT_NODEJS_IP,
];

$tw.boot.boot();
