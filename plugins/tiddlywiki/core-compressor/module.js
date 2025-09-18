
(function (fflate) {
    "use strict";
    function registerBrowser($tw) {
        // create the $tw.preloadHooks array if it doesn't exist
        $tw = $tw || Object.create(null);
        $tw.preloadHooks = $tw.preloadHooks || [];
        // Add the hook with the vnd.json.gz plugin serializer
        $tw.preloadHooks.push(["th-boot-start", (options) => {
            $tw.modules.define("$:/boot/plugininfo/vnd.json.gz", "pluginserializer", pluginserializer)
        }]);
    }
    function registerNode($tw) {
        $tw.Wiki.pluginSerializerModules[pluginserializer.name] = pluginserializer;
    }

    const pluginserializer = {
        name: "application/vnd.json.gz",
        parse: function (tiddler) { return parse_json_gzip_base64(tiddler.fields.text); },
        stringify: function (fields, data) { return stringify_json_gzip_base64(data); }
    };

    // bufferToBase64 and bufferFromBase64 functions adapted from
    // https://github.com/niklasvh/base64-arraybuffer
    // Copyright (c) 2012 Niklas von Hertzen 
    // MIT License
    // https://github.com/niklasvh/base64-arraybuffer/blob/master/src/index.ts

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) { lookup[chars.charCodeAt(i)] = i; }

    /** 
     * @typedef BufferLike
     * @property {number} BYTES_PER_ELEMENT
     * @property {ArrayBuffer} buffer
     * @property {number} byteLength
     * @property {number} byteOffset
     */
    /**
     *  
     * @param {BufferLike} buf 
     * @returns {string}
     */
    const bufferToBase64 = (buf) => {
        let bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength),
            i,
            len = bytes.length,
            base64 = '';

        for (i = 0; i < len; i += 3) {
            base64 += chars[bytes[i] >> 2];
            base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
            base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
            base64 += chars[bytes[i + 2] & 63];
        }

        if (len % 3 === 2) {
            base64 = base64.substring(0, base64.length - 1) + '=';
        } else if (len % 3 === 1) {
            base64 = base64.substring(0, base64.length - 2) + '==';
        }

        return base64;
    };



    /**
     * 
     * @param {string} base64 
     * @returns {Uint8Array}
     */
    const bufferFromBase64 = function (base64) {
        if (!base64.charCodeAt) console.log(base64);
        let bufferLength = base64.length * 0.75,
            len = base64.length,
            i,
            p = 0,
            encoded1,
            encoded2,
            encoded3,
            encoded4;

        if (base64[base64.length - 1] === '=') {
            bufferLength--;
            if (base64[base64.length - 2] === '=') {
                bufferLength--;
            }
        }

        const arraybuffer = new ArrayBuffer(bufferLength),
            bytes = new Uint8Array(arraybuffer);

        for (i = 0; i < len; i += 4) {
            encoded1 = lookup[base64.charCodeAt(i)];
            encoded2 = lookup[base64.charCodeAt(i + 1)];
            encoded3 = lookup[base64.charCodeAt(i + 2)];
            encoded4 = lookup[base64.charCodeAt(i + 3)];

            bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
            bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
            bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        }

        return bytes;
    };
    const parse_json_gzip_base64 = function (text) {
        const compressed2 = bufferFromBase64(text);
        const decom = fflate.gunzipSync(compressed2);
        const str = fflate.strFromU8(decom);
        try { return JSON.parse(str); } catch (e) { }
    }

    const stringify_json_gzip_base64 = function (data) {
        const text = JSON.stringify(data);
        const buf = fflate.strToU8(text);
        const compressed = fflate.compressSync(buf, { level: 4, mem: 5 });
        return bufferToBase64(compressed);
    }

    return { registerBrowser, registerNode };

    // the file ends with this so the suffix can call it
})