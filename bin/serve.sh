#!/bin/bash
#
# This script allows you to serve different TiddlyWiki editions.
#
# It respects a TW_SERVE_EDITION_PATH environment variable.
# If this variable is set it will be used. A command line parameter will overwrite it.
#
# Ensure your server tiddlywiki.info configuration contains
# these plugins, otherwise saving is not possible:
#    - "tiddlywiki/tiddlyweb"
#    - "tiddlywiki/filesystem"

# Global settings
# set -o nounset	#exit if a variable is not set
set -o errexit	#exit on error

# Get command name and path info needed for help text
ARG0=$(basename $0)
#ARG0DIR=$(dirname $0)
#[ $ARG0DIR == "." ] && ARG0DIR=$PWD

# ---- helper functions ----
version () {
	echo "$ARG0, TiddlyWiki serve script version 0.0.2"
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
	echo $'\t'\$1 .. edition directory .. full or relative path to edition directory
	echo $'\t'\$2 .. username for signing edits - can be empty like this: \"\"
	echo $'\t'\$3 .. password - can be empty like this: \"\"
	echo $'\t'\$4 .. IP address or HOST name .. defaults to: localhost
	echo $'\t'\$5 .. PORT .. defaults to: 8080
	echo
	echo $'\t'-v .. Version
	echo $'\t'-h .. Help
	echo
	echo Example 1 ./serve ./editions/tw5.com-server username
	echo Example 2 ./serve ./editions/tw5.com-server \"\" \"\" localhost 9090
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
	if [ ! -d $TW_SERVE_EDITION_PATH ]; then
		_log "Edition directory: '$TW_SERVE_EDITION_PATH' does not exist"
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
	[ -z $TW_SERVE_EDITION_PATH ] && TW_SERVE_EDITION_PATH="./editions/tw5.com-server"

	# directory must exist
	check_edition_directory

	# serve the default settings.
	serve "$TW_SERVE_EDITION_PATH" "" "" localhost 8080
else
	if [ -z "$5" ]; then 
		PORT=8080 
	else 
		PORT=$5
	fi
	
	# If the 1st parameter (edition) is set, it has priority.
	TW_SERVE_EDITION_PATH=$1

	# directory must exist
	check_edition_directory

	serve "$TW_SERVE_EDITION_PATH" "$2" "$3" "$4" $PORT
fi
