# Html5-QRCode 

## Lightweight & cross platform QR Code and Bar code scanning library for the web

Use this lightweight library to easily / quickly integrate QR code, bar code, and other common code scanning capabilities to your web application.

## Key highlights
-   🔲 Support scanning [different types of bar codes and QR codes](#supported-code-formats).

-   🖥 Supports [different platforms](#supported-platforms) be it Android, IOS, MacOs, Windows or Linux

-   🌐 Supports [different browsers](#supported-platforms) like Chrome, Firefox, Safari, Edge, Opera ...

-   📷 Supports scanning with camera as well as local files

-   ➡️ Comes with an [end to end library with UI](#easy-mode---with-end-to-end-scanner-user-interface) as well as a [low level library to build your own UI with](#pro-mode---if-you-want-to-implement-your-own-user-interface).

-   🔦 Supports customisations like [flash/torch support](#showtorchbuttonifsupported---boolean--undefined), zooming etc.


Supports two kinds of APIs

-   `Html5QrcodeScanner` — End-to-end scanner with UI, integrate with less than ten lines of code.
    
-   `Html5Qrcode` — Powerful set of APIs you can use to build your UI without worrying about camera setup, handling permissions, reading codes, etc.

> Support for scanning local files on the device is a new addition and helpful for the web browser which does not support inline web-camera access in smartphones. **Note:** This doesn't upload files to any server — everything is done locally.

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/mebjas/html5-qrcode/tree/master.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/mebjas/html5-qrcode/tree/master) [![GitHub issues](https://img.shields.io/github/issues/mebjas/html5-qrcode)](https://github.com/mebjas/html5-qrcode/issues) [![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/mebjas/html5-qrcode)](https://github.com/mebjas/html5-qrcode/releases) ![GitHub](https://img.shields.io/github/license/mebjas/html5-qrcode) [![Codacy Badge](https://app.codacy.com/project/badge/Grade/51e4f0ef8b0b42e1b93ce29875dd23a0)](https://www.codacy.com/gh/mebjas/html5-qrcode/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=mebjas/html5-qrcode&amp;utm_campaign=Badge_Grade) [![Gitter](https://badges.gitter.im/html5-qrcode/community.svg)](https://gitter.im/html5-qrcode/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

![GitHub all releases](https://img.shields.io/github/downloads/mebjas/html5-qrcode/total?label=Github%20downloads&style=for-the-badge) [![npm](https://img.shields.io/npm/dw/html5-qrcode?label=npm%20downloads&style=for-the-badge)](https://www.npmjs.com/package/html5-qrcode) [![](https://img.shields.io/badge/Medium-12100E?style=for-the-badge&logo=medium&logoColor=white)](https://bit.ly/3CZiASv)

| <img src="https://scanapp.org/assets/github_assets/pixel6pro-optimised.gif" width="180px" /> | <img src="https://scanapp.org/assets/github_assets/pixel4_barcode_480.gif" width="180px" />|
| -- | -- |
| _Demo at [scanapp.org](https://scanapp.org)_ | _Demo at [qrcode.minhazav.dev](https://qrcode.minhazav.dev) - **Scanning different types of codes**_ |

## We need your help!

![image](https://user-images.githubusercontent.com/3007365/222830114-e5bcca15-bf8a-434e-9f48-339e82a0a4ef.png)
Help incentivise feature development, bug fixing by supporting the sponsorhip goals of this project. See [list of sponsered feature requests here](https://github.com/mebjas/html5-qrcode/wiki/Feature-request-sponsorship-goals#feature-requests).

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/L3L84G0C8)

## Documentation

The documentation for this project has been moved to [scanapp.org/html5-qrcode-docs](https://scanapp.org/html5-qrcode-docs/).

-   [Getting started](https://scanapp.org/html5-qrcode-docs/docs/intro)
-   [Supported frameworks](https://scanapp.org/html5-qrcode-docs/docs/supported_frameworks)
-   [Supported 1D and 2D Code formats](https://scanapp.org/html5-qrcode-docs/docs/supported_code_formats)
-   [Detailed API documentation](https://scanapp.org/html5-qrcode-docs/docs/apis)

## Supported platforms

We are working continuously on adding support for more and more platforms. If you find a platform or a browser where the library is not working, please feel free to file an issue. Check the [demo link](https://blog.minhazav.dev/research/html5-qrcode.html) to test it out.

**Legends**
-   ![](https://scanapp.org/assets/github_assets/done.png) Means full support — inline webcam and file based 
-   ![](https://scanapp.org/assets/github_assets/partial.png) Means partial support — only file based, webcam in progress

### PC / Mac

| <img src="https://scanapp.org/assets/github_assets/browsers/firefox_48x48.png" alt="Firefox" width="24px" height="24px" /><br/>Firefox | <img src="https://scanapp.org/assets/github_assets/browsers/chrome_48x48.png" alt="Chrome" width="24px" height="24px" /><br/>Chrome | <img src="https://scanapp.org/assets/github_assets/browsers/safari_48x48.png" alt="Safari" width="24px" height="24px" /><br/>Safari | <img src="https://scanapp.org/assets/github_assets/browsers/opera_48x48.png" alt="Opera" width="24px" height="24px" /><br/>Opera | <img src="https://scanapp.org/assets/github_assets/browsers/edge_48x48.png" alt="Edge" width="24px" height="24px" /><br/> Edge
| --------- | --------- | --------- | --------- | ------- |
|![](https://scanapp.org/assets/github_assets/done.png)| ![](https://scanapp.org/assets/github_assets/done.png)| ![](https://scanapp.org/assets/github_assets/done.png)| ![](https://scanapp.org/assets/github_assets/done.png) | ![](https://scanapp.org/assets/github_assets/done.png)

### Android

| <img src="https://scanapp.org/assets/github_assets/browsers/chrome_48x48.png" alt="Chrome" width="24px" height="24px" /><br/>Chrome | <img src="https://scanapp.org/assets/github_assets/browsers/firefox_48x48.png" alt="Firefox" width="24px" height="24px" /><br/>Firefox | <img src="https://scanapp.org/assets/github_assets/browsers/edge_48x48.png" alt="Edge" width="24px" height="24px" /><br/> Edge | <img src="https://scanapp.org/assets/github_assets/browsers/opera_48x48.png" alt="Opera" width="24px" height="24px" /><br/>Opera | <img src="https://scanapp.org/assets/github_assets/browsers/opera-mini_48x48.png" alt="Opera-Mini" width="24px" height="24px" /><br/> Opera Mini | <img src="https://scanapp.org/assets/github_assets/browsers/uc_48x48.png" alt="UC" width="24px" height="24px" /> <br/> UC
| --------- | --------- | --------- | --------- |  --------- | --------- |
|![](https://scanapp.org/assets/github_assets/done.png)| ![](https://scanapp.org/assets/github_assets/done.png)| ![](https://scanapp.org/assets/github_assets/done.png)| ![](https://scanapp.org/assets/github_assets/done.png)| ![](https://scanapp.org/assets/github_assets/partial.png) | ![](https://scanapp.org/assets/github_assets/partial.png) 

### IOS

| <img src="https://scanapp.org/assets/github_assets/browsers/safari_48x48.png" alt="Safari" width="24px" height="24px" /><br/>Safari | <img src="https://scanapp.org/assets/github_assets/browsers/chrome_48x48.png" alt="Chrome" width="24px" height="24px" /><br/>Chrome | <img src="https://scanapp.org/assets/github_assets/browsers/firefox_48x48.png" alt="Firefox" width="24px" height="24px" /><br/>Firefox | <img src="https://scanapp.org/assets/github_assets/browsers/edge_48x48.png" alt="Edge" width="24px" height="24px" /><br/> Edge 
| --------- | --------- | --------- | --------- |
|![](https://scanapp.org/assets/github_assets/done.png)| ![](https://scanapp.org/assets/github_assets/done.png)* | ![](https://scanapp.org/assets/github_assets/done.png)* | ![](https://scanapp.org/assets/github_assets/partial.png) 


> \* Supported for IOS versions >= 15.1
>
> Before version 15.1, Webkit for IOS is used by Chrome, Firefox, and other browsers in IOS and they do not have webcam permissions yet. There is an ongoing issue on fixing the support for iOS - [issue/14](https://github.com/mebjas/html5-qrcode/issues/14)

### Framework support
The library can be easily used with several other frameworks, I have been adding examples for a few of them and would continue to add more.

|<img src="https://scanapp.org/assets/github_assets/html5.png" width="30px" />| <img src="https://scanapp.org/assets/github_assets/vuejs.png" width="30px" />|<img src="https://scanapp.org/assets/github_assets/electron.png" width="30px" /> | <img src="https://scanapp.org/assets/github_assets/react.svg" width="30px" /> | <img src="https://seeklogo.com/images/L/lit-logo-6B43868CDC-seeklogo.com.png" width="30px" />
| -------- | -------- | -------- | -------- | -------- |
| [Html5](./examples/html5) | [VueJs](./examples/vuejs) | [ElectronJs](./examples/electron) | [React](https://github.com/scanapp-org/html5-qrcode-react) | [Lit](./examples/lit)

### Supported Code formats
Code scanning is dependent on [Zxing-js](https://github.com/zxing-js/library) library. We will be working on top of it to add support for more types of code scanning. If you feel a certain type of code would be helpful to have, please file a feature request.

| Code | Example |
| ---- | ----- |
| QR Code | <img src="https://scanapp.org/assets/github_assets/qr-code.png" width="200px" /> |
| AZTEC | <img src="https://scanapp.org/assets/github_assets/aztec.png" /> |
| CODE_39|  <img src="https://scanapp.org/assets/github_assets/code_39.gif" /> |
| CODE_93| <img src="https://scanapp.org/assets/github_assets/code_93.gif" />|
| CODE_128| <img src="https://scanapp.org/assets/github_assets/code_128.gif" />|
| ITF| <img src="https://scanapp.org/assets/github_assets/itf.png" />|
| EAN_13|<img src="https://scanapp.org/assets/github_assets/ean13.jpeg" /> |
| EAN_8| <img src="https://scanapp.org/assets/github_assets/ean8.jpeg" />|
| PDF_417| <img src="https://scanapp.org/assets/github_assets/pdf417.png" />|
| UPC_A| <img src="https://scanapp.org/assets/github_assets/upca.jpeg" />|
| UPC_E| <img src="https://scanapp.org/assets/github_assets/upce.jpeg" />|
| DATA_MATRIX|<img src="https://scanapp.org/assets/github_assets/datamatrix.png" /> |
| MAXICODE*| <img src="https://scanapp.org/assets/github_assets/maxicode.gif" /> |
| RSS_14*| <img src="https://scanapp.org/assets/github_assets/rss14.gif" />|
| RSS_EXPANDED*|<img src="https://scanapp.org/assets/github_assets/rssexpanded.gif" /> |

> *Formats are not supported by our experimental integration with native
> BarcodeDetector API integration ([Read more](/experimental.md)).

## Description - [View Demo](https://blog.minhazav.dev/research/html5-qrcode.html)

> See an end to end scanner experience at [scanapp.org](https://scanapp.org).

This is a cross-platform JavaScript library to integrate QR code, bar codes & a few other types of code scanning capabilities to your applications running on HTML5 compatible browser.

Supports:
-   Querying camera on the device (with user permissions)
-   Rendering live camera feed, with easy to use user interface for scanning
-   Supports scanning a different kind of QR codes, bar codes and other formats
-   Supports selecting image files from the device for scanning codes

## How to use

Find detailed guidelines on how to use this library on [scanapp.org/html5-qrcode-docs](https://scanapp.org/html5-qrcode-docs/docs/intro).

## Demo
<img src="https://scanapp.org/assets/github_assets/qr-code.png" width="200px"><br />
_Scan this image or visit [blog.minhazav.dev/research/html5-qrcode.html](https://blog.minhazav.dev/research/html5-qrcode.html)_

### For more information
Check these articles on how to use this library:
<!-- TODO(mebjas) Mirgate this link to blog.minhazav.dev -->
-   [QR and barcode scanner using HTML and JavaScript](https://minhazav.medium.com/qr-and-barcode-scanner-using-html-and-javascript-2cdc937f793d)
-   [HTML5 QR Code scanning — launched v1.0.1 without jQuery dependency and refactored Promise based APIs](https://blog.minhazav.dev/HTML5-QR-Code-scanning-launched-v1.0.1/).
-   [HTML5 QR Code scanning with JavaScript — Support for scanning the local file and using default camera added (v1.0.5)](https://blog.minhazav.dev/HTML5-QR-Code-scanning-support-for-local-file-and-default-camera/)

## Screenshots
![screenshot](https://scanapp.org/assets/github_assets/screen.gif)<br />
_Figure: Screenshot from Google Chrome running on MacBook Pro_

## Documentation
Find the full API documentation at [scanapp.org/html5-qrcode-docs/docs/apis](https://scanapp.org/html5-qrcode-docs/docs/apis).

### Extra optional `configuration` in `start()` method
Configuration object that can be used to configure both the scanning behavior and the user interface (UI). Most of the fields have default properties that will be used unless a different value is provided. If you do not want to override anything, you can just pass in an empty object `{}`.

#### `fps` — Integer, Example = 10
A.K.A frame per second, the default value for this is 2, but it can be increased to get faster scanning. Increasing too high value could affect performance. Value `>1000` will simply fail.

#### `qrbox` — `QrDimensions` or `QrDimensionFunction` (Optional), Example = `{ width: 250, height: 250 }`
Use this property to limit the region of the viewfinder you want to use for scanning. The rest of the viewfinder would be shaded. For example, by passing config `{ qrbox : { width: 250, height: 250 } }`, the screen will look like:

<img src="https://scanapp.org/assets/github_assets/screen.gif" />

This can be used to set a rectangular scanning area with config like:

```js
let config = { qrbox : { width: 400, height: 150 } }
```

This config also accepts a function of type
```ts
/**
  * A function that takes in the width and height of the video stream 
* and returns QrDimensions.
* 
* Viewfinder refers to the video showing camera stream.
*/
type QrDimensionFunction =
    (viewfinderWidth: number, viewfinderHeight: number) => QrDimensions;
```

This allows you to set dynamic QR box dimensions based on the video dimensions. See this blog article for example: [Setting dynamic QR box size in Html5-qrcode - ScanApp blog](https://scanapp.org/blog/2022/01/09/setting-dynamic-qr-box-size-in-html5-qrcode.html)

> This might be desirable for bar code scanning.

If this value is not set, no shaded QR box will be rendered and the scanner will scan the entire area of video stream.

#### `aspectRatio` — Float, Example 1.777778 for 16:9 aspect ratio
Use this property to render the video feed in a certain aspect ratio. Passing a nonstandard aspect ratio like `100000:1` could lead to the video feed not even showing up. Ideal values can be:
| Value | Aspect Ratio | Use Case |
| ----- | ------------ | -------- |
|1.333334 | 4:3 | Standard camera aspect ratio |
|1.777778 | 16:9 | Full screen, cinematic |
|1.0 | 1:1 | Square view |

If you do not pass any value, the whole viewfinder would be used for scanning. 
**Note**: this value has to be smaller than the width and height of the `QR code HTML element`.

#### `disableFlip` — Boolean (Optional), default = false
By default, the scanner can scan for horizontally flipped QR Codes. This also enables scanning QR code using the front camera on mobile devices which are sometimes mirrored. This is `false` by default and I recommend changing this only if:
-   You are sure that the camera feed cannot be mirrored (Horizontally flipped)
-   You are facing performance issues with this enabled.

Here's an example of a normal and mirrored QR Code
| Normal QR Code | Mirrored QR Code |
| ----- | ---- |
| <img src="https://scanapp.org/assets/github_assets/qr-code.png" width="200px" /> | <img src="https://scanapp.org/assets/github_assets/qr-code-flipped.png" width="200px" /><br /> |

#### `rememberLastUsedCamera` — Boolean (Optional), default = true
If `true` the last camera used by the user and weather or not permission was granted would be remembered in the local storage. If the user has previously granted permissions — the request permission option in the UI will be skipped and the last selected camera would be launched automatically for scanning.

If `true` the library shall remember if the camera permissions were previously
granted and what camera was last used. If the permissions is already granted for
"camera", QR code scanning will automatically * start for previously used camera.

#### `supportedScanTypes` - `Array<Html5QrcodeScanType> | []`
> This is only supported for `Html5QrcodeScanner`.

Default = `[Html5QrcodeScanType.SCAN_TYPE_CAMERA, Html5QrcodeScanType.SCAN_TYPE_FILE]`

This field can be used to:
-   Limit support to either of `Camera` or `File` based scan.
-   Change default scan type.

How to use:

```js
function onScanSuccess(decodedText, decodedResult) {
  // handle the scanned code as you like, for example:
  console.log(`Code matched = ${decodedText}`, decodedResult);
}

let config = {
  fps: 10,
  qrbox: {width: 100, height: 100},
  rememberLastUsedCamera: true,
  // Only support camera scan type.
  supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
};

let html5QrcodeScanner = new Html5QrcodeScanner(
  "reader", config, /* verbose= */ false);
html5QrcodeScanner.render(onScanSuccess);
```

For file based scan only choose:
```js
supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_FILE]
```

For supporting both as it is today, you can ignore this field or set as:
```js
supportedScanTypes: [
  Html5QrcodeScanType.SCAN_TYPE_CAMERA,
  Html5QrcodeScanType.SCAN_TYPE_FILE]
```

To set the file based scan as defult change the order:
```js
supportedScanTypes: [
  Html5QrcodeScanType.SCAN_TYPE_FILE,
  Html5QrcodeScanType.SCAN_TYPE_CAMERA]
```

#### `showTorchButtonIfSupported` - `boolean | undefined`
> This is only supported for `Html5QrcodeScanner`.

If `true` the rendered UI will have button to turn flash on or off based on device + browser support. The value is `false` by default.

### Scanning only specific formats
By default, both camera stream and image files are scanned against all the
supported code formats.  Both `Html5QrcodeScanner` and `Html5Qrcode` classes can
 be configured to only support a subset of supported formats. Supported formats
are defined in
[enum Html5QrcodeSupportedFormats](https://github.com/mebjas/html5-qrcode/blob/master/src/core.ts#L14).

```ts
enum Html5QrcodeSupportedFormats {
  QR_CODE = 0,
  AZTEC,
  CODABAR,
  CODE_39,
  CODE_93,
  CODE_128,
  DATA_MATRIX,
  MAXICODE,
  ITF,
  EAN_13,
  EAN_8,
  PDF_417,
  RSS_14,
  RSS_EXPANDED,
  UPC_A,
  UPC_E,
  UPC_EAN_EXTENSION,
}
```

I recommend using this only if you need to explicitly omit support for certain
formats or want to reduce the number of scans done per second for performance
reasons.

#### Scanning only QR code with `Html5Qrcode`
```js
const html5QrCode = new Html5Qrcode(
  "reader", { formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ] });
const qrCodeSuccessCallback = (decodedText, decodedResult) => {
    /* handle success */
};
const config = { fps: 10, qrbox: { width: 250, height: 250 } };

// If you want to prefer front camera
html5QrCode.start({ facingMode: "user" }, config, qrCodeSuccessCallback);
```

#### Scanning only QR code and UPC codes with `Html5QrcodeScanner`
```js
function onScanSuccess(decodedText, decodedResult) {
  // Handle the scanned code as you like, for example:
  console.log(`Code matched = ${decodedText}`, decodedResult);
}

const formatsToSupport = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
];
const html5QrcodeScanner = new Html5QrcodeScanner(
  "reader",
  {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    formatsToSupport: formatsToSupport
  },
  /* verbose= */ false);
html5QrcodeScanner.render(onScanSuccess);
```

## Experimental features
The library now supports some experimental features which are supported in the
library but not recommended for production usage either due to limited testing
done or limited compatibility for underlying APIs used. Read more about it [here](/experimental.md).
Some experimental features include:
-   [Support for BarcodeDetector JavaScript API](/experimental.md)

## How to modify and build
1.  Code changes should only be made to [/src](./src) only.

2.  Run `npm install` to install all dependencies.

3.  Run `npm run-script build` to build JavaScript output. The output JavaScript distribution is built to [/dist/html5-qrcode.min.js](./dist/html5-qrcode.min.js). If you are developing on Windows OS, run `npm run-script build-windows`.

4.  Testing
    -   Run `npm test`
    -   Run the tests before sending a pull request, all tests should run.
    -   Please add tests for new behaviors sent in PR.

5.  Send a pull request
    -   Include code changes only to `./src`. **Do not change `./dist` manually.**
    -   In the pull request add a comment like
	  ```text
	  @all-contributors please add @mebjas for this new feature or tests
	  ```
	  -   For calling out your contributions, the bot will update the contributions file.
    -   Code will be built & published by the author in batches.

## How to contribute
You can contribute to the project in several ways:

-   File issue ticket for any observed bug or compatibility issue with the project.
-   File feature request for missing features.
-   Take open bugs or feature request and work on it and send a Pull Request.
-   Write unit tests for existing codebase (which is not covered by tests today). **Help wanted on this** - [read more](./tests).

## Support 💖

This project would not be possible without all of our fantastic contributors and [sponsors](https://github.com/sponsors/mebjas). If you'd like to support the maintenance and upkeep of this project you can [donate via GitHub Sponsors](https://github.com/sponsors/mebjas).

**Sponsor the project for priortising feature requests / bugs relevant to you**. (Depends on scope of ask and bandwidth of the contributors).

<!-- sponsors -->
<a href="https://github.com/webauthor"><img src="https://github.com/webauthor.png" width="40px" alt="webauthor@" /></a>
<a href="https://github.com/ben-gy"><img src="https://github.com/ben-gy.png" width="40px" alt="ben-gy" /></a>
<a href="https://github.com/bujjivadu"><img src="https://github.com/bujjivadu.png" width="40px" alt="bujjivadu" /></a>
<!-- sponsors -->

Help incentivise feature development, bug fixing by supporting the sponsorhip goals of this project. See [list of sponsered feature requests here](https://github.com/mebjas/html5-qrcode/wiki/Feature-request-sponsorship-goals#feature-requests).

Also, huge thanks to following organizations for non monitery sponsorships

<!-- sponsors -->
<div>
	<a href="https://scanapp.org"><img src="https://scanapp.org/assets/svg/scanapp.svg" height="60px" alt="" /></a>
</div>
<div>
	<a href="https://www.browserstack.com"><img src="https://www.browserstack.com/images/layout/browserstack-logo-600x315.png" height="100px" alt="" /></a>
</div>
<!-- sponsors -->

## Credits
The decoder used for the QR code reading is from `Zxing-js` https://github.com/zxing-js/library<br />