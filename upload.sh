#!/bin/bash

# Upload the latest build of tiddlywiki5 to the server at http://www.tiddlywiki.com/

# Usage:
#  upload [user]

# default values
REMOTE_USER=${1:-$USER}
FROMDIR=$PWD/tmp/tw5
HOST="tiddlywiki.com"
DIR="/var/www/www.tiddlywiki.com/htdocs/tiddlywiki5"
OWNER="www-data:www-data"
PERM="664"

# setPermissions()
# Usage:
#  setPermissions file
function setPermissions() {
	COMMANDS="$COMMANDS sudo chown $OWNER $1;"
	COMMANDS="$COMMANDS sudo chmod $PERM $1;"
}

echo "uploading files"

FILES="$FROMDIR/index.html $FROMDIR/static.html"
scp $FILES "$REMOTE_USER@$HOST:$DIR"

echo "setting file permissions"

COMMANDS="ssh $REMOTE_USER@$HOST"
setPermissions "$DIR/index.html"
setPermissions "$DIR/index.xml"

# execute
COMMANDS="$COMMANDS exit;"
$COMMANDS
