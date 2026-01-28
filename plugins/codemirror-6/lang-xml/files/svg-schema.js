/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-xml/svg-schema.js
type: application/javascript
module-type: library

SVG schema for XML language completions in CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Common presentation attributes (used by many elements)
var presentationAttrs = [
	"fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin",
	"stroke-dasharray", "stroke-dashoffset", "stroke-opacity", "fill-opacity",
	"opacity", "fill-rule", "clip-rule", "color", "display", "visibility",
	"font-family", "font-size", "font-style", "font-weight", "text-anchor",
	"dominant-baseline", "alignment-baseline", "letter-spacing", "word-spacing",
	"text-decoration", "filter", "clip-path", "mask"
];

// Global attributes available on all elements
var globalAttrs = [{
		name: "id",
		global: true
	},
	{
		name: "class",
		global: true
	},
	{
		name: "style",
		global: true
	},
	{
		name: "transform",
		global: true
	},
	{
		name: "tabindex",
		global: true
	},
	{
		name: "lang",
		global: true
	},
	{
		name: "xml:lang",
		global: true
	},
	{
		name: "xml:space",
		global: true,
		values: ["default", "preserve"]
	}
];

// Presentation attributes with common values
var presentationAttrSpecs = [{
		name: "fill",
		values: ["none", "currentColor", "inherit", "black", "white", "red", "green", "blue", "transparent"]
	},
	{
		name: "stroke",
		values: ["none", "currentColor", "inherit", "black", "white", "red", "green", "blue"]
	},
	{
		name: "stroke-width",
		values: ["1", "2", "3", "0.5", "1.5"]
	},
	{
		name: "stroke-linecap",
		values: ["butt", "round", "square"]
	},
	{
		name: "stroke-linejoin",
		values: ["miter", "round", "bevel"]
	},
	{
		name: "stroke-dasharray",
		values: ["none", "5,5", "10,5", "5,10", "3,3"]
	},
	{
		name: "opacity",
		values: ["0", "0.25", "0.5", "0.75", "1"]
	},
	{
		name: "fill-opacity",
		values: ["0", "0.25", "0.5", "0.75", "1"]
	},
	{
		name: "stroke-opacity",
		values: ["0", "0.25", "0.5", "0.75", "1"]
	},
	{
		name: "fill-rule",
		values: ["nonzero", "evenodd"]
	},
	{
		name: "clip-rule",
		values: ["nonzero", "evenodd"]
	},
	{
		name: "display",
		values: ["inline", "block", "none", "inherit"]
	},
	{
		name: "visibility",
		values: ["visible", "hidden", "collapse", "inherit"]
	},
	{
		name: "font-family",
		values: ["serif", "sans-serif", "monospace", "inherit"]
	},
	{
		name: "font-size",
		values: ["8", "10", "12", "14", "16", "18", "24", "32", "inherit"]
	},
	{
		name: "font-style",
		values: ["normal", "italic", "oblique", "inherit"]
	},
	{
		name: "font-weight",
		values: ["normal", "bold", "lighter", "bolder", "100", "200", "300", "400", "500", "600", "700", "800", "900"]
	},
	{
		name: "text-anchor",
		values: ["start", "middle", "end", "inherit"]
	},
	{
		name: "dominant-baseline",
		values: ["auto", "middle", "central", "text-top", "text-bottom", "alphabetic", "hanging", "mathematical"]
	},
	{
		name: "alignment-baseline",
		values: ["auto", "baseline", "before-edge", "text-before-edge", "middle", "central", "after-edge", "text-after-edge", "ideographic", "alphabetic", "hanging", "mathematical"]
	},
	{
		name: "text-decoration",
		values: ["none", "underline", "overline", "line-through"]
	}
];

// Container elements that can contain other elements
var containerChildren = [
	"svg", "g", "defs", "symbol", "use", "a",
	"rect", "circle", "ellipse", "line", "polyline", "polygon", "path",
	"text", "tspan", "textPath", "image",
	"linearGradient", "radialGradient", "stop",
	"clipPath", "mask", "pattern", "marker",
	"filter", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite",
	"feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDropShadow",
	"feFlood", "feGaussianBlur", "feImage", "feMerge", "feMergeNode",
	"feMorphology", "feOffset", "feSpecularLighting", "feTile", "feTurbulence",
	"title", "desc", "metadata", "switch", "foreignObject"
];

// SVG Elements specification
var elements = [
	// Root element
	{
		name: "svg",
		top: true,
		children: containerChildren,
		attributes: [
			"xmlns", "xmlns:xlink", "version", "baseProfile",
			"width", "height", "x", "y",
			"viewBox", "preserveAspectRatio",
			"overflow", "clip"
		].concat(presentationAttrs)
	},

	// Structural elements
	{
		name: "g",
		children: containerChildren,
		attributes: presentationAttrs
	},
	{
		name: "defs",
		children: containerChildren,
		attributes: []
	},
	{
		name: "symbol",
		children: containerChildren,
		attributes: ["viewBox", "preserveAspectRatio", "refX", "refY"].concat(presentationAttrs)
	},
	{
		name: "use",
		attributes: ["href", "xlink:href", "x", "y", "width", "height"].concat(presentationAttrs)
	},
	{
		name: "a",
		children: containerChildren,
		attributes: ["href", "xlink:href", "target", "download", "rel"].concat(presentationAttrs)
	},

	// Shape elements
	{
		name: "rect",
		attributes: ["x", "y", "width", "height", "rx", "ry", "pathLength"].concat(presentationAttrs)
	},
	{
		name: "circle",
		attributes: ["cx", "cy", "r", "pathLength"].concat(presentationAttrs)
	},
	{
		name: "ellipse",
		attributes: ["cx", "cy", "rx", "ry", "pathLength"].concat(presentationAttrs)
	},
	{
		name: "line",
		attributes: ["x1", "y1", "x2", "y2", "pathLength"].concat(presentationAttrs)
	},
	{
		name: "polyline",
		attributes: ["points", "pathLength"].concat(presentationAttrs)
	},
	{
		name: "polygon",
		attributes: ["points", "pathLength"].concat(presentationAttrs)
	},
	{
		name: "path",
		attributes: ["d", "pathLength"].concat(presentationAttrs)
	},

	// Text elements
	{
		name: "text",
		children: ["tspan", "textPath", "a"],
		attributes: ["x", "y", "dx", "dy", "rotate", "lengthAdjust", "textLength"].concat(presentationAttrs)
	},
	{
		name: "tspan",
		children: ["tspan", "a"],
		attributes: ["x", "y", "dx", "dy", "rotate", "lengthAdjust", "textLength"].concat(presentationAttrs)
	},
	{
		name: "textPath",
		children: ["tspan", "a"],
		attributes: ["href", "xlink:href", "startOffset", "method", "spacing", "side", "lengthAdjust", "textLength"].concat(presentationAttrs)
	},

	// Image element
	{
		name: "image",
		attributes: ["href", "xlink:href", "x", "y", "width", "height", "preserveAspectRatio", "crossorigin", "decoding"].concat(presentationAttrs)
	},

	// Gradient elements
	{
		name: "linearGradient",
		children: ["stop", "animate", "animateTransform", "set"],
		attributes: ["x1", "y1", "x2", "y2", "gradientUnits", "gradientTransform", "spreadMethod", "href", "xlink:href"]
	},
	{
		name: "radialGradient",
		children: ["stop", "animate", "animateTransform", "set"],
		attributes: ["cx", "cy", "r", "fx", "fy", "fr", "gradientUnits", "gradientTransform", "spreadMethod", "href", "xlink:href"]
	},
	{
		name: "stop",
		attributes: ["offset", "stop-color", "stop-opacity"]
	},

	// Clipping and masking
	{
		name: "clipPath",
		children: ["rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "text", "use"],
		attributes: ["clipPathUnits"]
	},
	{
		name: "mask",
		children: containerChildren,
		attributes: ["x", "y", "width", "height", "maskUnits", "maskContentUnits"]
	},
	{
		name: "pattern",
		children: containerChildren,
		attributes: ["x", "y", "width", "height", "patternUnits", "patternContentUnits", "patternTransform", "href", "xlink:href", "viewBox", "preserveAspectRatio"]
	},
	{
		name: "marker",
		children: containerChildren,
		attributes: ["markerWidth", "markerHeight", "refX", "refY", "orient", "markerUnits", "viewBox", "preserveAspectRatio"].concat(presentationAttrs)
	},

	// Filter elements
	{
		name: "filter",
		children: ["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDropShadow", "feFlood", "feGaussianBlur", "feImage", "feMerge", "feMorphology", "feOffset", "feSpecularLighting", "feTile", "feTurbulence"],
		attributes: ["x", "y", "width", "height", "filterUnits", "primitiveUnits"]
	},
	{
		name: "feGaussianBlur",
		attributes: ["in", "stdDeviation", "edgeMode", "result"]
	},
	{
		name: "feOffset",
		attributes: ["in", "dx", "dy", "result"]
	},
	{
		name: "feBlend",
		attributes: ["in", "in2", "mode", "result"]
	},
	{
		name: "feColorMatrix",
		attributes: ["in", "type", "values", "result"]
	},
	{
		name: "feComposite",
		attributes: ["in", "in2", "operator", "k1", "k2", "k3", "k4", "result"]
	},
	{
		name: "feFlood",
		attributes: ["flood-color", "flood-opacity", "result"]
	},
	{
		name: "feMerge",
		children: ["feMergeNode"],
		attributes: ["result"]
	},
	{
		name: "feMergeNode",
		attributes: ["in"]
	},
	{
		name: "feDropShadow",
		attributes: ["dx", "dy", "stdDeviation", "flood-color", "flood-opacity", "result"]
	},
	{
		name: "feMorphology",
		attributes: ["in", "operator", "radius", "result"]
	},
	{
		name: "feDisplacementMap",
		attributes: ["in", "in2", "scale", "xChannelSelector", "yChannelSelector", "result"]
	},
	{
		name: "feConvolveMatrix",
		attributes: ["in", "order", "kernelMatrix", "divisor", "bias", "targetX", "targetY", "edgeMode", "preserveAlpha", "result"]
	},
	{
		name: "feDiffuseLighting",
		children: ["feDistantLight", "fePointLight", "feSpotLight"],
		attributes: ["in", "surfaceScale", "diffuseConstant", "result"]
	},
	{
		name: "feSpecularLighting",
		children: ["feDistantLight", "fePointLight", "feSpotLight"],
		attributes: ["in", "surfaceScale", "specularConstant", "specularExponent", "result"]
	},
	{
		name: "feDistantLight",
		attributes: ["azimuth", "elevation"]
	},
	{
		name: "fePointLight",
		attributes: ["x", "y", "z"]
	},
	{
		name: "feSpotLight",
		attributes: ["x", "y", "z", "pointsAtX", "pointsAtY", "pointsAtZ", "specularExponent", "limitingConeAngle"]
	},
	{
		name: "feTurbulence",
		attributes: ["type", "baseFrequency", "numOctaves", "seed", "stitchTiles", "result"]
	},
	{
		name: "feImage",
		attributes: ["href", "xlink:href", "preserveAspectRatio", "crossorigin", "result"]
	},
	{
		name: "feTile",
		attributes: ["in", "result"]
	},
	{
		name: "feComponentTransfer",
		children: ["feFuncR", "feFuncG", "feFuncB", "feFuncA"],
		attributes: ["in", "result"]
	},
	{
		name: "feFuncR",
		attributes: ["type", "tableValues", "slope", "intercept", "amplitude", "exponent", "offset"]
	},
	{
		name: "feFuncG",
		attributes: ["type", "tableValues", "slope", "intercept", "amplitude", "exponent", "offset"]
	},
	{
		name: "feFuncB",
		attributes: ["type", "tableValues", "slope", "intercept", "amplitude", "exponent", "offset"]
	},
	{
		name: "feFuncA",
		attributes: ["type", "tableValues", "slope", "intercept", "amplitude", "exponent", "offset"]
	},

	// Animation elements
	{
		name: "animate",
		attributes: ["attributeName", "from", "to", "by", "values", "begin", "dur", "end", "repeatCount", "repeatDur", "fill", "calcMode", "keyTimes", "keySplines", "additive", "accumulate"]
	},
	{
		name: "animateTransform",
		attributes: ["attributeName", "type", "from", "to", "by", "values", "begin", "dur", "end", "repeatCount", "repeatDur", "fill", "calcMode", "keyTimes", "keySplines", "additive", "accumulate"]
	},
	{
		name: "animateMotion",
		children: ["mpath"],
		attributes: ["path", "keyPoints", "rotate", "origin", "from", "to", "by", "values", "begin", "dur", "end", "repeatCount", "repeatDur", "fill", "calcMode", "keyTimes", "keySplines", "additive", "accumulate"]
	},
	{
		name: "set",
		attributes: ["attributeName", "to", "begin", "dur", "end", "repeatCount", "repeatDur", "fill"]
	},
	{
		name: "mpath",
		attributes: ["href", "xlink:href"]
	},

	// Descriptive elements
	{
		name: "title",
		textContent: []
	},
	{
		name: "desc",
		textContent: []
	},
	{
		name: "metadata",
		textContent: []
	},

	// Other elements
	{
		name: "switch",
		children: containerChildren,
		attributes: ["requiredFeatures", "requiredExtensions", "systemLanguage"]
	},
	{
		name: "foreignObject",
		attributes: ["x", "y", "width", "height"].concat(presentationAttrs)
	}
];

// Additional attribute specifications with values
var attributes = globalAttrs.concat(presentationAttrSpecs).concat([{
		name: "xmlns",
		values: ["http://www.w3.org/2000/svg"]
	},
	{
		name: "xmlns:xlink",
		values: ["http://www.w3.org/1999/xlink"]
	},
	{
		name: "version",
		values: ["1.0", "1.1", "2.0"]
	},
	{
		name: "preserveAspectRatio",
		values: [
			"none",
			"xMinYMin", "xMidYMin", "xMaxYMin",
			"xMinYMid", "xMidYMid", "xMaxYMid",
			"xMinYMax", "xMidYMax", "xMaxYMax",
			"xMinYMin meet", "xMidYMid meet", "xMaxYMax meet",
			"xMinYMin slice", "xMidYMid slice", "xMaxYMax slice"
		]
	},
	{
		name: "overflow",
		values: ["visible", "hidden", "scroll", "auto"]
	},
	{
		name: "gradientUnits",
		values: ["userSpaceOnUse", "objectBoundingBox"]
	},
	{
		name: "spreadMethod",
		values: ["pad", "reflect", "repeat"]
	},
	{
		name: "clipPathUnits",
		values: ["userSpaceOnUse", "objectBoundingBox"]
	},
	{
		name: "maskUnits",
		values: ["userSpaceOnUse", "objectBoundingBox"]
	},
	{
		name: "maskContentUnits",
		values: ["userSpaceOnUse", "objectBoundingBox"]
	},
	{
		name: "patternUnits",
		values: ["userSpaceOnUse", "objectBoundingBox"]
	},
	{
		name: "patternContentUnits",
		values: ["userSpaceOnUse", "objectBoundingBox"]
	},
	{
		name: "filterUnits",
		values: ["userSpaceOnUse", "objectBoundingBox"]
	},
	{
		name: "primitiveUnits",
		values: ["userSpaceOnUse", "objectBoundingBox"]
	},
	{
		name: "markerUnits",
		values: ["strokeWidth", "userSpaceOnUse"]
	},
	{
		name: "orient",
		values: ["auto", "auto-start-reverse", "0", "45", "90", "180", "270"]
	},
	{
		name: "method",
		values: ["align", "stretch"]
	},
	{
		name: "spacing",
		values: ["auto", "exact"]
	},
	{
		name: "side",
		values: ["left", "right"]
	},
	{
		name: "lengthAdjust",
		values: ["spacing", "spacingAndGlyphs"]
	},
	{
		name: "target",
		values: ["_self", "_parent", "_top", "_blank"]
	},
	{
		name: "crossorigin",
		values: ["anonymous", "use-credentials"]
	},
	{
		name: "decoding",
		values: ["sync", "async", "auto"]
	},
	// Filter-specific attributes
	{
		name: "in",
		values: ["SourceGraphic", "SourceAlpha", "BackgroundImage", "BackgroundAlpha", "FillPaint", "StrokePaint"]
	},
	{
		name: "in2",
		values: ["SourceGraphic", "SourceAlpha", "BackgroundImage", "BackgroundAlpha", "FillPaint", "StrokePaint"]
	},
	{
		name: "mode",
		values: ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"]
	},
	{
		name: "operator",
		values: ["over", "in", "out", "atop", "xor", "lighter", "arithmetic", "erode", "dilate"]
	},
	{
		name: "edgeMode",
		values: ["duplicate", "wrap", "none"]
	},
	{
		name: "type",
		values: ["translate", "scale", "rotate", "skewX", "skewY", "matrix", "saturate", "hueRotate", "luminanceToAlpha", "identity", "table", "discrete", "linear", "gamma", "fractalNoise", "turbulence"]
	},
	{
		name: "xChannelSelector",
		values: ["R", "G", "B", "A"]
	},
	{
		name: "yChannelSelector",
		values: ["R", "G", "B", "A"]
	},
	{
		name: "stitchTiles",
		values: ["stitch", "noStitch"]
	},
	// Animation attributes
	{
		name: "calcMode",
		values: ["discrete", "linear", "paced", "spline"]
	},
	{
		name: "additive",
		values: ["replace", "sum"]
	},
	{
		name: "accumulate",
		values: ["none", "sum"]
	},
	{
		name: "repeatCount",
		values: ["indefinite"]
	},
	{
		name: "rotate",
		values: ["auto", "auto-reverse", "0", "45", "90", "180", "270"]
	}
]);

exports.svgElements = elements;
exports.svgAttributes = attributes;
