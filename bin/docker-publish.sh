#!/usr/bin/env bash
# Publish an official TiddlyWiki Docker image to Docker Hub.
#
# Usage:
#   ./bin/docker-publish.sh <tiddlywiki-version> [node-lts-version]
#
# Example:
#   ./bin/docker-publish.sh 5.3.6
#   ./bin/docker-publish.sh 5.4.0 24
#
# Requires:
#   - docker buildx with multi-platform support (linux/amd64, linux/arm64)
#   - docker login to Docker Hub as tiddlywiki org member

set -euo pipefail

TIDDLYWIKI_VERSION="${1:?Usage: $0 <tiddlywiki-version> [node-lts-version]}"
NODE_LTS_VERSION="${2:-24}"
REPO="tiddlywiki/tiddlywiki"

echo "Publishing ${REPO}:${TIDDLYWIKI_VERSION} (Node ${NODE_LTS_VERSION}-alpine) ..."

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg NODE_LTS_VERSION="${NODE_LTS_VERSION}" \
  --tag "${REPO}:${TIDDLYWIKI_VERSION}" \
  --tag "${REPO}:latest" \
  --push \
  .

echo "Done. Image available at: https://hub.docker.com/r/${REPO}"
