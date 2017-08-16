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
Get a file from an S3 bucket
region:
bucketName:
title:
callback: invoked with (err,{body:,type:}
*/
function getFile(region,bucketName,title,callback) {
console.log("Reading file from S3",bucketName,title)
	var AWS = require("aws-sdk"),
		s3bucket = new AWS.S3({
			region: region
		}),
		params = {
			Bucket: bucketName,
			Key: title
		};
	s3bucket.getObject(params,function(err,data) {
		if(err) {
			return callback(err);
		}
		callback(null,{
			etag: data.ETag,
			version: data.VersionId,
			type: data.ContentType,
			body: data.Body.toString()
		});
	});
}

/*
Put a file to an S3 bucket
*/
function putFile(region,bucketName,title,text,type,callback) {
console.log("Writing file to S3",bucketName,title,type)
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
exports.getFile = getFile;

})();
