#!/bin/bash

# Abbreviated build script for building prerelease

tiddlywiki editions/prerelease \
	--verbose \
	--build favicon index empty \
	|| exit 1
