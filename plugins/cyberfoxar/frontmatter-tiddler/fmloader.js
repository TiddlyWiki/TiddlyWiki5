/*\
title: $:/plugins/cyberfoxar/frontmatter-tiddler/fmloader.js
type: application/javascript
module-type: tiddlerLoader

Proof-of-concept plugin for a tiddlerloader.
Tries to find a fenced frontmatter block and parse the content like a tiddler metafile.
\*/

(function(){
	/**
	 * When given binary data, tries to deserialize it into a tiddler.
	 * 
	 * @param {string} filename - original filename, does not include path
	 * @param {Buffer} fileBuffer - file as read by NodeJS
	 * @param {Object} fileSpec - Context/Directory specification-like object
	 * @returns {Array[Object]} - decoded Tiddler fields to be added to the wiki
	 */
	function loadTiddlerFromBinary(filename, fileBuffer, fileSpec){
		var lines = fileBuffer.toString().split(/(?:\r\n|\r|\n)/g)
		var fm, text
		for (let index = 0; index < lines.length; index++) {
			const line = lines[index];
			console.log('read line:', line)
			if (line.startsWith('---') && line.trim().length < 4) {
				if (fm === undefined){
					fm = []
					// start fm
				} else {
					// end fm
					text = lines.slice(index+1).join('\n')
					break
				}
			} else if (fm !== undefined) {
				// fm has started
				fm = fm.concat(line)
			}
		}
		fm = fm ? fm.join('\n') : ""
		var myfields = $tw.utils.parseFields(fm)

		myfields.text = text
		myfields.type = 'text/markdown'
		myfields.deferredFiletype = 'bin/test-tiddler'

		return [myfields]
	}

	/**
	 * When given a Tiddler, binarize it however we like and gives
	 * back a temporary object holding the data, as well as the path
	 * where to save it.
	 * **This must include a file extension.**
	 * 
	 * @param {string} filePath 
	 * @param {$tw.Tiddler} tiddler - tiddler to be binarized
	 * @returns {
	 *  {
	 *      filePath: string
	 *      buffer: Buffer,
	 *      fileOptions: {fs.WriteFileOptions | undefined}
	 *  }
	 * }
	 */
	function makeBinaryFromTiddler(filePath, tiddler){
		// This is a very naive implementation of fences-in-text style.
		// It works, though.

		var fm = tiddler.getFieldStringBlock({exclude: ["text","bag"]});
		var content = "---\n" + (fm) + "\n---\n" + (!!tiddler.fields.text ? tiddler.fields.text : "")
		var fpath = filePath.concat(".fmd")
		return {
			filePath: fpath,
			buffer: content,
			fileOptions: {
				encoding: "utf8"
			}
		}
	}

	TiddlerLoaderPlugin.prototype.load = loadTiddlerFromBinary
	TiddlerLoaderPlugin.prototype.save = makeBinaryFromTiddler

	function TiddlerLoaderPlugin(){
		// console.log("TiddlerLoaderPlugin init called")
	}

	exports["bin/test-tiddler"] = TiddlerLoaderPlugin
})()