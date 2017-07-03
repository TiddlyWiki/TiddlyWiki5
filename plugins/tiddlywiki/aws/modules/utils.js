/*\
title: $:/plugins/tiddlywiki/aws/utils.js
type: application/javascript
module-type: library

AWS utility functions

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Put a file to an S3 bucket
*/
function putFile(region,bucketName,title,text,type,callback) {
console.log("Writing file",bucketName,title,type)
	var AWS = require("aws-sdk"),
		s3bucket = new AWS.S3({
		region: region
	}),
		encoding = ($tw.config.contentTypeInfo[type] || {encoding: "utf8"}).encoding,
		params = {
			Bucket: bucketName,
			Key: title,
			Body: new Buffer(text,encoding),
			ContentType: type || "text/plain"
		};
	s3bucket.upload(params,callback);
}

exports.putFile = putFile;

})();
