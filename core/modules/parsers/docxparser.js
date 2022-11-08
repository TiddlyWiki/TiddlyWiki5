/*\
title: $:/core/modules/parsers/docxparser.js
type: application/javascript
module-type: parser

The Docx parser embeds a Docx viewer

\*/

(function () {
  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  const BinaryParser = require("./binaryparser");

  var DocxParser = function (type, text, options) {
    // Element to display MS Office files inside an iframe
    var element_uri = {
      type: "element",
      tag: "iframe",
      attributes: {
        src: {
          type: "string",
          value: `https://view.officeapps.live.com/op/embed.aspx?src=${options._canonical_uri}`,
        },
        loading: { type: "string", value: "lazy" },
        style: {
          type: "string",
          value: "border:0; width: 100%; object-fit: contain",
        },
      },
    };

    // Element to show "binary data" warning and link if _canonical_uri is not set
    var element_binary = {
      type: "element",
      tag: "div",
      attributes: {
        class: { type: "string", value: "tc-binary-warning" },
      },
      children: [BinaryParser.BinaryParserWarn, BinaryParser.BinaryParserLink],
    };

    this.tree = options._canonical_uri ? [element_uri] : [element_binary];
  };

  // MS Word formats
  exports[
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ] = DocxParser;
  exports["application/msword"] = DocxParser;
  // MS Excel formats
  exports["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] =
    DocxParser;
  exports["application/vnd.ms-excel"] = DocxParser;
  // MS Powerpoint
  exports[
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ] = DocxParser;
  exports["application/vnd.ms-powerpoint"] = DocxParser;
})();
