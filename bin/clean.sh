#!/bin/bash

# Remove any output files

find . -regex "^./editions/[a-z0-9\.-]*/output/.*" -delete
