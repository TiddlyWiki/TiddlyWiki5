# Utility Scripts

This folder contains tools used to extract the tiddlers from the original HTML file.

All pathnames in these instructions are relative to the root of this repository.

1. Load `./editions/tiddlywiki-surveys/great-interview-project-2010/The great TiddlyWiki interview project.htm` in a browser
2. Open the developer console and paste the script from `./editions/tiddlywiki-surveys/scripts/extract-text-tiddlers-via-console.js`. The JSON representation of the text tiddlers will be generated and copied to the clipboard
3. Paste the resulting JSON into `2010-great-interview-project.json` in the `./tmp` folder in the root of this repository
4. Open a terminal console in the root of this repository
5. Run the script `./editions/tiddlywiki-surveys/scripts/import-great-interview-project-json.sh`
6. Go back to the developer console and copy the text that was output by the previous line. This is quite tricky: it's a big block of text including newlines. It is easiest to scroll back up to find the line starting with `mkdir -p` and then select down to the bottom
7. Paste the results of the previous into the terminal
8. Build the wiki with `node ./tiddlywiki.js ./editions/tiddlywiki-surveys --build index`

The resulting wiki will be found in `./editions/tiddlywiki-surveys/output/index.html`.
