/*\
title: $:/plugins/tiddlywiki/prosemirror/core/incremental-sync.js
type: application/javascript
module-type: library

Helpers for applying external ProseMirror document updates.

\*/

"use strict";

function replaceChangedContent(transaction, oldDoc, newDoc) {
	const diffStart = oldDoc.content.findDiffStart(newDoc.content);
	if(diffStart === null) {
		return { transaction: transaction, changed: false };
	}
	const diffEnd = oldDoc.content.findDiffEnd(newDoc.content) || {
		a: oldDoc.content.size,
		b: newDoc.content.size
	};
	let oldEnd = diffEnd.a;
	let newEnd = diffEnd.b;
	const overlap = diffStart - Math.min(oldEnd,newEnd);
	if(overlap > 0) {
		oldEnd += overlap;
		newEnd += overlap;
	}
	const slice = newDoc.slice(diffStart,newEnd);
	return {
		transaction: transaction.replace(diffStart,oldEnd,slice),
		changed: true,
		from: diffStart,
		oldEnd: oldEnd,
		newEnd: newEnd
	};
}

exports.replaceChangedContent = replaceChangedContent;