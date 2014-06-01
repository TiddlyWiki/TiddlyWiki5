#!/bin/bash
for f in `ls theme/`
do
sed "s/filename/$f/g" themeTemplate.txt >> theme.files
done