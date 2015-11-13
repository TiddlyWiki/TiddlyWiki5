#!/bin/bash

# Remove any output files

find . -regex "^./editions/[a-z\.-]*/output/.*" -delete
