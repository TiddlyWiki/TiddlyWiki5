#!/bin/sh
set -e

WIKI_DIR="${TIDDLYWIKI_DATA_DIR:-/data}"
HOST="${TIDDLYWIKI_HOST:-0.0.0.0}"
PORT="${TIDDLYWIKI_PORT:-8080}"

# Initialize wiki on first run
if [ ! -f "${WIKI_DIR}/tiddlywiki.info" ]; then
    echo "Initializing new wiki at ${WIKI_DIR} ..."
    tiddlywiki "${WIKI_DIR}" --init server
fi

# Build --listen argument list
LISTEN_ARGS="host=${HOST} port=${PORT}"

if [ -n "${TIDDLYWIKI_USERNAME}" ]; then
    LISTEN_ARGS="${LISTEN_ARGS} username=${TIDDLYWIKI_USERNAME}"
fi

if [ -n "${TIDDLYWIKI_PASSWORD}" ]; then
    LISTEN_ARGS="${LISTEN_ARGS} password=${TIDDLYWIKI_PASSWORD}"
fi

if [ -n "${TIDDLYWIKI_READERS}" ]; then
    LISTEN_ARGS="${LISTEN_ARGS} readers=${TIDDLYWIKI_READERS}"
fi

if [ -n "${TIDDLYWIKI_WRITERS}" ]; then
    LISTEN_ARGS="${LISTEN_ARGS} writers=${TIDDLYWIKI_WRITERS}"
fi

echo "Starting TiddlyWiki on ${HOST}:${PORT} ..."
exec tiddlywiki "${WIKI_DIR}" --listen ${LISTEN_ARGS}
