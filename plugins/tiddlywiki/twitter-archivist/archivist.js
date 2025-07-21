/*\
title: $:/plugins/tiddlywiki/twitter-archivist/archivist.js
type: application/javascript
module-type: utils

Utility class for manipulating Twitter archives

\*/



"use strict";

function TwitterArchivist(options) {
	options = options || {};
	this.source = options.source;
}

TwitterArchivist.prototype.loadArchive = async function(options) {
	options = options || {};
	const {wiki} = options;
	await this.source.init();
	// Process the manifest and profile
	const manifestData = await this.loadTwitterJsData("data/manifest.js","window.__THAR_CONFIG = ","");
	const profileData = await this.loadTwitterJsData("data/profile.js","window.YTD.profile.part0 = ","");
	const accountData = await this.loadTwitterJsData("data/account.js","window.YTD.account.part0 = ","");
	const username = manifestData.userInfo.userName;
	const user_id = manifestData.userInfo.accountId;
	wiki.addTiddler({
		title: `Twitter Archive for @${username}`,
		icon: "$:/core/images/twitter",
		color: "#1D9CF0",
		tags: "$:/tags/TwitterArchive",
		user_id,
		username,
		displayname: manifestData.userInfo.displayName,
		generation_date: $tw.utils.stringifyDate(new Date(manifestData.archiveInfo.generationDate)),
		account_created_date: $tw.utils.stringifyDate(new Date(accountData[0].account.createdAt)),
		bio: profileData[0].profile.description.bio,
		website: profileData[0].profile.description.website,
		location: profileData[0].profile.description.location
	});
	// Process the media
	await this.source.processFiles("data/tweets_media","base64",(mediaItem) => {
		const ext = mediaItem.filename.split(".").slice(-1)[0];
		if("jpg png".split(" ").includes(ext)) {
			const extensionInfo = $tw.utils.getFileExtensionInfo(`.${ext}`);
			const type = extensionInfo ? extensionInfo.type : null;
			wiki.addTiddler({
				title: `Tweet Media - ${mediaItem.filename}`,
				tags: "$:/tags/TweetMedia",
				status_id: mediaItem.filename.split("-")[0],
				text: mediaItem.contents,
				type
			});
		}
	});
	// Process the favourites
	const likeData = await this.loadTwitterJsData("data/like.js","window.YTD.like.part0 = ","");
	$tw.utils.each(likeData,(like) => {
		// Create the tweet tiddler
		const tiddler = {
			title: `Tweet - ${like.like.tweetId}`,
			text: `\\rules only html entity extlink\n${(like.like.fullText || "").replace("\n","<br>")}`,
			status_id: like.like.tweetId,
			liked_by: user_id,
			tags: "$:/tags/Tweet"
		};
		wiki.addTiddler(tiddler);
	});
	// Process the tweets
	const tweetData = await this.loadTwitterJsData("data/tweets.js","window.YTD.tweets.part0 = ","");
	$tw.utils.each(tweetData,(tweet) => {
		// Compile the tags for the tweet
		const tags = ["$:/tags/Tweet"];
		// Accumulate the replacements/insertions to the text as an array of {startPos:,endPos:,fnTransform:}
		const modifications = [];
		// Modifications for mentions
		const mentions = [];
		$tw.utils.each(tweet.tweet.entities.user_mentions,(mention) => {
			const title = `Tweeter - ${mention.id_str}`;
			tags.push(title);
			mentions.push(mention.id_str);
			wiki.addTiddler({
				title,
				screenname: `@${mention.screen_name}`,
				tags: "$:/tags/Tweeter",
				user_id: mention.id_str,
				name: mention.name
			});
			modifications.push({
				startPos: parseInt(mention.indices[0],10),
				endPos: parseInt(mention.indices[1],10),
				fnTransform(text) {
					return `<$link to="${title}">${$tw.utils.htmlEncode(text.substring(mention.indices[0],mention.indices[1]))
						}</$link>`;
				}
			});
		});
		// Modifications for URLs
		$tw.utils.each(tweet.tweet.entities.urls,(urlInfo) => {
			modifications.push({
				startPos: parseInt(urlInfo.indices[0],10),
				endPos: parseInt(urlInfo.indices[1],10),
				fnTransform(text) {
					return `<a href="${urlInfo.expanded_url}" rel="noopener noreferrer" target="_blank">${$tw.utils.htmlEncode(urlInfo.display_url)
						}</a>`;
				}
			});
		});
		// Modifications for hashtags
		$tw.utils.each(tweet.tweet.entities.hashtags,(hashtag) => {
			const title = `#${hashtag.text}`;
			tags.push(title);
			wiki.addTiddler({
				title,
				hashtag: hashtag.text,
				tags: "$:/tags/Hashtag"
			});
			modifications.push({
				startPos: parseInt(hashtag.indices[0],10),
				endPos: parseInt(hashtag.indices[1],10),
				fnTransform(text) {
					return `<$link to="${title}">` +
						`#${$tw.utils.htmlEncode(hashtag.text)
						}</$link>`;
				}
			});
		});
		// Sort the modifications by start position
		modifications.sort((a,b) => {
			return a.startPos - b.startPos;
		});
		// Apply the modifications in reverse order
		const rawText = tweet.tweet.full_text;
		let posText = 0;
		const chunks = [];
		$tw.utils.each(modifications,(modification) => {
			// Process any text before the modification
			if(modification.startPos > posText) {
				chunks.push($tw.utils.htmlEncode(rawText.substring(posText,modification.startPos)));
			}
			// Process the modification
			chunks.push(modification.fnTransform(rawText));
			// Adjust the position
			posText = modification.endPos;
		});
		// Process any remaining text
		if(posText < rawText.length) {
			chunks.push($tw.utils.htmlEncode(rawText.substring(posText)));
		}
		// Concatenate the chunks and replace newlines with <br>
		const text = chunks.join("").replace("\n","<br>");
		// Create the tweet tiddler
		const tiddler = {
			title: `Tweet - ${tweet.tweet.id_str}`,
			text: `\\rules only html entity extlink\n${text}`,
			status_id: tweet.tweet.id_str,
			user_id,
			favorite_count: tweet.tweet.favorite_count,
			retweet_count: tweet.tweet.retweet_count,
			tags,
			created: $tw.utils.stringifyDate(new Date(tweet.tweet.created_at)),
			modified: $tw.utils.stringifyDate(new Date(tweet.tweet.created_at))
		};
		if(tweet.tweet.in_reply_to_status_id_str) {
			tiddler.in_reply_to_status_id = tweet.tweet.in_reply_to_status_id_str;
		}
		if(mentions.length > 0) {
			tiddler.mention_user_ids = $tw.utils.stringifyList(mentions);
		}
		wiki.addTiddler(tiddler);
	});
};

TwitterArchivist.prototype.loadTwitterJsData = async function(filePath,prefix,suffix) {
	let tweetFileData = await this.source.loadTwitterJsData(filePath);
	if(prefix) {
		if(tweetFileData.slice(0,prefix.length) !== prefix) {
			throw `Reading Twitter JS file ${filePath} missing prefix '${prefix}'`;
		}
		tweetFileData = tweetFileData.slice(prefix.length);
	}
	if(suffix) {
		if(tweetFileData.slice(-suffix.length) !== suffix) {
			throw `Reading Twitter JS file ${filePath} missing suffix '${suffix}'`;
		}
		tweetFileData = tweetFileData.slice(0,tweetFileData.length - suffix.length);
	}
	return JSON.parse(tweetFileData);
};

function TwitterArchivistSourceNodeJs(options) {
	options = options || {};
	this.archivePath = options.archivePath;
}

TwitterArchivistSourceNodeJs.prototype.init = async function() {};

TwitterArchivistSourceNodeJs.prototype.processFiles = async function(dirPath,encoding,callback) {
	const fs = require("fs");
	const path = require("path");
	var dirPath = path.resolve(this.archivePath,dirPath);
	const filenames = fs.readdirSync(dirPath);
	$tw.utils.each(filenames,(filename) => {
		callback({
			filename,
			contents: fs.readFileSync(path.resolve(dirPath,filename),encoding)
		});
	});
};

TwitterArchivistSourceNodeJs.prototype.loadTwitterJsData = async function(filePath) {
	const fs = require("fs");
	const path = require("path");
	return fs.readFileSync(path.resolve(this.archivePath,filePath),"utf8");
};

function TwitterArchivistSourceBrowser(options) {
	options = options || {};
}

TwitterArchivistSourceBrowser.prototype.init = async function() {
	// Open directory
	this.rootDirHandle = await window.showDirectoryPicker();
};

TwitterArchivistSourceBrowser.prototype.processFiles = async function(dirPath,encoding,callback) {
	const dirHandle = await this.walkDirectory(dirPath.split("/"));
	const asyncIterator = dirHandle.entries();
	await AsyncIteratorForEach(asyncIterator,async ([filename,fileHandle]) => {
		const contents = await fileHandle.getFile();
		callback({
			filename,
			contents: encoding === "base64" ? arrayBufferToBase64(await contents.arrayBuffer()) : await contents.text()
		});
	});

	// for await (const [filename, fileHandle] of dirHandle.entries()) {
	// 	const contents = await fileHandle.getFile();
	// 	callback({
	// 		filename: filename,
	// 		contents: arrayBufferToBase64(await contents.arrayBuffer())
	// 	});
	// }
};

TwitterArchivistSourceBrowser.prototype.loadTwitterJsData = async function(filePath) {
	const filePathParts = filePath.split("/");
	const dirHandle = await this.walkDirectory(filePathParts.slice(0,-1));
	const fileHandle = await dirHandle.getFileHandle(filePathParts.slice(-1)[0]);
	const contents = await fileHandle.getFile();
	return await contents.text();
};

TwitterArchivistSourceBrowser.prototype.walkDirectory = async function(arrayDirectoryEntries) {
	const entries = [...arrayDirectoryEntries];
	let dirHandle = this.rootDirHandle;
	while(entries.length > 0) {
		dirHandle = await dirHandle.getDirectoryHandle(entries[0]);
		entries.shift();
	}
	return dirHandle;
};

// Thanks to MatheusFelipeMarinho
// https://github.com/MatheusFelipeMarinho/venom/blob/43ead0bfffa57a536a5cff67dd909e55da9f0915/src/lib/wapi/helper/array-buffer-to-base64.js#L55
function arrayBufferToBase64(arrayBuffer) {
	let base64 = '';
	const encodings =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	const bytes = new Uint8Array(arrayBuffer);
	const {byteLength} = bytes;
	const byteRemainder = byteLength % 3;
	const mainLength = byteLength - byteRemainder;

	let a; let b; let c; let d;
	let chunk;

	// Main loop deals with bytes in chunks of 3
	for(let i = 0;i < mainLength;i += 3) {
		// Combine the three bytes into a single integer
		chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

		// Use bitmasks to extract 6-bit segments from the triplet
		a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
		b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
		c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
		d = chunk & 63; // 63       = 2^6 - 1

		// Convert the raw binary segments to the appropriate ASCII encoding
		base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
	}

	// Deal with the remaining bytes and padding
	if(byteRemainder == 1) {
		chunk = bytes[mainLength];

		a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

		// Set the 4 least significant bits to zero
		b = (chunk & 3) << 4; // 3   = 2^2 - 1

		base64 += `${encodings[a] + encodings[b]}==`;
	} else if(byteRemainder == 2) {
		chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

		a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
		b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

		// Set the 2 least significant bits to zero
		c = (chunk & 15) << 2; // 15    = 2^4 - 1

		base64 += `${encodings[a] + encodings[b] + encodings[c]}=`;
	}
	return base64;
}


async function AsyncIteratorForEach(iter,callback) {

	// Start the iteration
	try {
		while(true) {
			// Await the next result object
			const {value,done} = await iter.next();
			if(done) break;
			await callback(value);
		}
	} finally {
		// If the iterator supports cleanup, call it
		if(typeof iter.return === "function") {
			await iter.return();
		}
	}
}


exports.TwitterArchivist = TwitterArchivist;
exports.TwitterArchivistSourceNodeJs = TwitterArchivistSourceNodeJs;
exports.TwitterArchivistSourceBrowser = TwitterArchivistSourceBrowser;
