#!/bin/bash

# Bump to a new version number

if [ -z "$1" ]
  then
    echo "Missing version (eg '5.0.0-alpha.99')"
    exit 1
fi

# Set the new version number (will also commit and tag the release)

npm version $1 -m "Version update" || exit 1

# Make sure our tags are pushed to the origin server

git push origin --tags || exit 1
