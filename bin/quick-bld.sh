#!/bin/bash

# Abbreviated build script for building prerelease

tiddlywiki editions/prerelease \
	--verbose \
	--build favicon index \
	|| exit 1
