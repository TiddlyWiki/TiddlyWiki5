# node-yaqrcode

Yet another node-qrcode Generator!

This is a simple and pure javascript wrapper for the QR Code Generator from the d-project.

No Canvas or Binary needed!

Note:

```
The word 'QR Code' is registered trademark of
DENSO WAVE INCORPORATED
http://www.denso-wave.com/qrcode/faqpatent-e.html
```

## Overview

- Pure Javascript and could work without any requiments

- Use `RS_BLOCK_TABLE` from http://davidshimjs.github.io/qrcodejs/ to support typeNumber 40

- Use the code from http://davidshimjs.github.io/qrcodejs/ to support UTF-8

- Return a Base64 Data URI like this

```
data:image/gif;base64,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
```

## Usage

```
npm install yaqrcode
```

```javascript
qrcode = require('yaqrcode');
base64 = qrcode('hello world');
```

### custom size

```javascript
qrcode = require('yaqrcode');
base64 = qrcode('hello world', {
    size: 500
});
```

## License

The MIT License (MIT)

Copyright (c) 2013,2015 Zeno Zeng

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
