#!/bin/bash
#
# This script allows you to serve different TiddlyWiki editions. 
# It respects the TIDDLYWIKI_EDITION_PATH variable described
# at: # http://tiddlywiki.com/#Environment%20Variables%20on%20Node.js
#
# Be sure your server tiddlywiki.info configuration contains the plugins:
#   - "tiddlywiki/tiddlyweb" and the "tiddlywiki/filesystem"
#   - Otherwise saving is not possible. 

# global settings
# set -o nounset	#exit if a variable is not set
set -o errexit	#exit on error

# get command name and path info needed for help text
ARG0=$(basename $0)
#ARG0DIR=$(dirname $0)
#[ $ARG0DIR == "." ] && ARG0DIR=$PWD

# ---- helper functions ----
version () {
	echo "$ARG0, TiddlyWiki serve script version 0.0.1"
	echo
}

usage() {
	version
	echo Usage:$'\t'$ARG0 [edition dir] [username] [password] [host] [port]
	echo
}

help() {
	usage

	echo Optional parameters
	echo
	echo $'\t'\$1 .. editions directory .. full path or relative to current directory
	echo $'\t'\$2 .. username for signing edits - can be empty like this: ""
	echo $'\t'\$3 .. password - can be empty like this: ""
	echo $'\t'\$4 .. IP address or HOST name .. defaults to "localhost"
	echo $'\t'\$5 .. PORT .. defaults to 8080
	echo
	echo $'\t'-v .. Version
	echo $'\t'-h .. Help
	echo
	echo Example 1 ./serve ./edition/tw5.com-server username
	echo Example 2 ./serve ./edition/tw5.com-server \"\" \"\" localhost 9090
	echo .. Example 2 defines: empty username, empty password
	echo
}

_log () {
	echo
	echo "---> $1"
}

# error handling for wrong parameters
error() {
    echo "$ARG0: $*" 1>&2
    exit 1
}

# start the server
serve () {
	#echo 1:$1 2:$2 3:$3 4:$4 5:$5

	node ./tiddlywiki.js \
		"$1" \
		--verbose \
		--server "$5" $:/core/save/all text/plain text/html "$2" "$3" "$4" \
		|| exit 1
}

check_edition_directory () {
	# The editions directory must exist and should contain a tiddlywiki.info file
	if [ ! -d $TIDDLYWIKI_EDITION_PATH ]; then
		_log "Edition directory: '$TIDDLYWIKI_EDITION_PATH' doesn't exist. Create it!"
		exit 1
	fi
}

# --------------------------------------------------
# command line parameter handler
while getopts vh flag
do
    case "$flag" in
    (h) help; exit 0;;
    (v) version; exit 0;;
    (*) help
		error
		exit 1;;
    esac
done
shift $(expr $OPTIND - 1)

#----------------------------------------------------

# If no edition parameter is provided, use Jeremy's defaults
if [ $# -eq 0 ]; then
	# check if the edition path environment variable is set. If yes use it.
	[ -z $TIDDLYWIKI_EDITION_PATH ] && TIDDLYWIKI_EDITION_PATH="./editions/tw5.com-server"

	# directory must exist!
	check_edition_directory

	# serve the default settings.
	serve "$TIDDLYWIKI_EDITION_PATH" "" "" localhost 8080
else
	if [ -z "$5" ]; then 
		PORT=8080 
	else 
		PORT=$5
	fi
	
	# If the 1st parameter (edition) is set, it has priority.
	TIDDLYWIKI_EDITION_PATH=$1

	# directory must exist!
	check_edition_directory

	serve "$TIDDLYWIKI_EDITION_PATH" "$2" "$3" "$4" $PORT
fi
