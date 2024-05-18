/*\
title: $:/plugins/cyberfoxar/fm-md/test.js
type: application/javascript
module-type: tiddlerLoader

Example API
\*/

(function(){
    console.log("LOADING TEST tiddlerLoader MODULE LETSGO");


    /**
     * One thing I might be able to do to 'parse' dendron:
     * use `$tw.utils.parseFields` which parses plaintext fields.
     * Now, I just need to find how to properly handle the fences.
     * And filenames-as-tags.
     * 
     * Fences might be as simple as:
     * open file, find first line with `---`
     * then read each line and stop when you find another empty line with `---`.
     * Everything read should go to parseFields, then fields
     * Everything else of the file should go to field.text
     */


    /**
     * When given binary data, tries to deserialize it into a tiddler.
     * 
     * @param {string} filename - original filename, does not include path
     * @param {Buffer} fileBuffer - file as read by NodeJS
     * @param {Object} fileSpec - Context/Directory specification-like object
     * @returns {$tw.Tiddler} - decoded Tiddler object to be added to the store
     */
    function loadTiddlerFromBinary(filename, fileBuffer, fileSpec){
        console.log("TiddlerLoaderPlugin asked to load stuff: ", filename, fileBuffer, fileSpec)
        // throw Error("not implemented")

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

        console.log('FRONTMATTER IS:', myfields)
        myfields.text = text
        myfields.type = 'text/markdown'
        myfields.deferredFiletype = 'bin/test-tiddler'

        // var fields = Object.create(null);
        // fields.text = "TEST TIDDLER DO NOT EAT.";
        // fields.type = "text/plain";
        // fields.title = "test/myTiddler/lol"
        return [myfields]
    }

    /**
     * When given a Tiddler, binarize it however we like and gives
     * back a temporary object holding the data.
     * 
     * @param {string} filename 
     * @param {$tw.Tiddler} tiddler - tiddler to be binarized
     * @returns {
     *  {
     *      buffer: Buffer,
     *      filename: string
     *      fileOptions: {fs.WriteFileOptions | undefined}
     *  }
     * }
     */
    function makeBinaryFromTiddler(filename, tiddler){
        throw Error("not implemented")
    }

    TiddlerLoaderPlugin.prototype.load = loadTiddlerFromBinary
    TiddlerLoaderPlugin.prototype.save = makeBinaryFromTiddler

    function TiddlerLoaderPlugin(){
        console.log("TiddlerLoaderPlugin init called")
    }

    exports["bin/test-tiddler"] = TiddlerLoaderPlugin
})()