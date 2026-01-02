/*\
title: $:/plugins/tiddlywiki/markdown/markdown-it-tiddlywiki.js
type: application/javascript
module-type: library

Wraps up the markdown-it parser for use as a Parser in TiddlyWiki

\*/

"use strict";

var md;
var pluginOpts;

var TWMarkReplacements = {
	"{" : "&#123;",
	"[" : "&#91;",
	"$" : "&#36;"
};

var TWMarkRegEx = /[{[$]/g;
function encodeTWMark(match) {
	return TWMarkReplacements[match];
}

// escpae {, [ and $ in string s
function escapeTWMarks(s) {
	s = String(s);
	TWMarkRegEx.lastIndex = 0;
	return s.replace(TWMarkRegEx,encodeTWMark);
}

// escape anything that could be interpreted as transclusion or syslink
function render_code_inline(tokens,idx,options,env,slf) {
	tokens[idx].attrJoin('class','_codified_');
	return  '<code' + slf.renderAttrs(tokens[idx]) + '>'
		+ escapeTWMarks(md.utils.escapeHtml(tokens[idx].content))
		+ '</code>';
}

function render_code_block(tokens,idx) {
	return  '<$codeblock code=e"' + md.utils.escapeHtml(tokens[idx].content) + '" language=""/>\n';
}

function render_fence(tokens,idx) {
	var info = tokens[idx].info ? md.utils.unescapeAll(tokens[idx].info).trim() : '';
	return '<$codeblock code=e"' + md.utils.escapeHtml(tokens[idx].content) + '" language="' + info.split(/(\s+)/g)[0] + '"/>\n';
}

// add a blank line after opening tag to activate TW block parsing
function render_paragraph_open(tokens,idx) {
	return tokens[idx].hidden ? '' : '<p>\n\n';
}

function render_paragraph_close(tokens,idx) {
	return tokens[idx].hidden ? '' : '\n</p>\n';
}

// Replace footnote links with "qualified" internal links
function render_footnote_ref(tokens,idx,options,env,slf) {
	var id      = slf.rules.footnote_anchor_name(tokens,idx,options,env,slf);
	var caption = slf.rules.footnote_caption(tokens,idx,options,env,slf);
	var refid   = id;

	if(tokens[idx].meta.subId > 0) {
		refid += ':' + tokens[idx].meta.subId;
	}
	return '<a class="footnote-ref" href=<<qualify "##fn' + id + '">> id=<<qualify "#fnref' + refid + '">>>' + caption + '</a>';
}

function render_footnote_open(tokens,idx,options,env,slf) {
	var id = slf.rules.footnote_anchor_name(tokens,idx,options,env,slf);

	if(tokens[idx].meta.subId > 0) {
		id += ':' + tokens[idx].meta.subId;
	}
	return '<li id=<<qualify "#fn' + id + '">>  class="footnote-item">';
}

function render_footnote_anchor(tokens,idx,options,env,slf) {
	var id = slf.rules.footnote_anchor_name(tokens,idx,options,env,slf);

	if(tokens[idx].meta.subId > 0) {
		id += ':' + tokens[idx].meta.subId;
	}

	// append variation selector to prevent display as Apple Emoji on iOS
	return '<a href=<<qualify "##fnref' + id + '">> class="footnote-backref">\u21A5\uFE0E</a>';
}

// do not un-escape html entities and escape characters
function render_text_special(tokens,idx) {
	if(tokens[idx].info === 'entity') {
		return tokens[idx].markup;
	}
	return escapeTWMarks(md.utils.escapeHtml(tokens[idx].content));
}

function render_tw_expr(tokens,idx) {
	return tokens[idx].content;
}

// Overwrite default: attribute values can be either a string or {type;, value:}.
// 1) string attr val: render in e"..." format so HTML entities can be decoded.
// 2) object attr val: render value as is.
function render_token_attrs(token) {
	var i, l, result;

	if(!token.attrs) { return ''; }

	result = '';

	for(i=0, l=token.attrs.length; i<l; i++) {
		if(typeof token.attrs[i][1] === "object" && token.attrs[i][1] !== null) {
			result += ' ' + md.utils.escapeHtml(token.attrs[i][0]) + '=' + token.attrs[i][1].value;
		} else {
			result += ' ' + md.utils.escapeHtml(token.attrs[i][0]) + '=e"' + md.utils.escapeHtml(token.attrs[i][1]) + '"';
		}
	}

	return result;
}

// given tw parsing rule and starting pos, returns match index or undefined
// assumes pos >= 0
function findNextMatch(ruleinfo,pos) {
	// ruleinfo.matchIndex needs to be -1 at the start of inline state
	if(ruleinfo.matchIndex < pos) {
		ruleinfo.matchIndex = ruleinfo.rule.findNextMatch(pos);
	}

	return ruleinfo.matchIndex;
}

// Add inline rule "macrocall" to parse <<macroname ...>>
function tw_macrocallinline(state,silent) {
	var ruleinfo = pluginOpts.inlineRules.macrocallinline;

	var pos = state.pos;
	var matchIndex = findNextMatch(ruleinfo,pos);
	if(matchIndex === undefined || matchIndex !== pos) {
		return false;
	}

	if(!silent) {
		var token = state.push('tw_expr','',0);
		token.content = state.src.slice(pos,ruleinfo.rule.nextCall.end);
	}
	state.pos = ruleinfo.rule.nextCall.end;
	return true;
}

// parse transclusion elements
function tw_transcludeinline(state,silent) {
	var ruleinfo = pluginOpts.inlineRules.transcludeinline;

	var pos = state.pos;
	var matchIndex = findNextMatch(ruleinfo,pos);
	if(matchIndex === undefined || matchIndex !== pos) {
		return false;
	}

	if(!silent) {
		var token = state.push('tw_expr','',0);
		token.content = state.src.slice(pos,pos+ruleinfo.rule.match[0].length);
	}
	state.pos += ruleinfo.rule.match[0].length;
	return true;
}

// parse filtered transclusion elements
function tw_filteredtranscludeinline(state,silent) {
	var ruleinfo = pluginOpts.inlineRules.filteredtranscludeinline;

	var pos = state.pos;
	var matchIndex = findNextMatch(ruleinfo,pos);
	if(matchIndex === undefined || matchIndex !== pos) {
		return false;
	}

	if(!silent) {
		var token = state.push('tw_expr','',0);
		if(state.linkLevel > 0) {
			var filter = ruleinfo.rule.match[1];
			token.content = '<$text text={{{' + filter + '}}}/>';
		} else {
			token.content = state.src.slice(pos,pos+ruleinfo.rule.match[0].length);
		}
	}
	state.pos += ruleinfo.rule.match[0].length;
	return true;
}

// based on markdown-it html_block()
var WidgetTagRegEx = [/^<\/?\$[a-zA-Z0-9\-\$\.]+(?=(\s|\/?>|$))/, /^$/];
function tw_block(state,startLine,endLine,silent) {
	var i, nextLine, token, lineText,
		pos = state.bMarks[startLine] + state.tShift[startLine],
		max = state.eMarks[startLine];

	// if it's indented more than 3 spaces, it should be a code block
	if(state.sCount[startLine] - state.blkIndent >= 4) { return false; }

	if(!state.md.options.html) { return false; }

	if(state.src.charCodeAt(pos) !== 0x3C/* < */) { return false; }

	lineText = state.src.slice(pos,max);

	if(!WidgetTagRegEx[0].test(lineText)) { return false; }

	if(silent) {
		// don't let widgets interrupt a paragrpah
		return false;
	}

	nextLine = startLine + 1;

	// If we are here - we detected HTML block.
	// Let's roll down till block end.
	if(!WidgetTagRegEx[1].test(lineText)) {
		for(; nextLine < endLine; nextLine++) {
			if(state.sCount[nextLine] < state.blkIndent) { break; }

			pos = state.bMarks[nextLine] + state.tShift[nextLine];
			max = state.eMarks[nextLine];
			lineText = state.src.slice(pos,max);

			if(WidgetTagRegEx[1].test(lineText)) {
				if(lineText.length !== 0) { nextLine++; }
				break;
			}
		}
	}

	state.line = nextLine;

	token         = state.push('html_block','',0);
	token.map     = [ startLine, nextLine ];
	token.content = state.getLines(startLine,nextLine,state.blkIndent,true);

	return true;
}

// parse [img[...]] elements
function tw_image(state,silent) {
	var ruleinfo = pluginOpts.inlineRules.image;

	// ignore at parseLinkLabel stage; will be recognized in tokenize()
	if(state.parsingLinkLabel > 0) {
		return false;
	}

	var pos = state.pos;
	var matchIndex = findNextMatch(ruleinfo,pos);
	if(matchIndex === undefined || matchIndex !== pos) {
		return false;
	}

	if(!silent) {
		var twNode = ruleinfo.rule.parse()[0];
		var token = state.push('$image','$image',0);
		$tw.utils.each(twNode.attributes,function(attr,id) {
			switch(attr.type) {
				case "filtered":
					token.attrSet(id,{ type: "filtered", value: "{{{" + attr.filter + "}}}" });
					break;
				case "indirect":
					token.attrSet(id,{ type: "indirect", value: "{{" + attr.textReference + "}}" });
					break;
				case "macro":
					token.attrSet(id,{ type: "macro", value: ruleinfo.rule.parser.source.substring(attr.value.start,attr.value.end) });
					break;
				default:
					token.attrSet(id,attr.value);
			}
		});
		token.markup = 'tw_image';
	}
	state.pos = ruleinfo.rule.parser.pos;
	return true;
}

// parse [[link]] elements
function tw_prettylink(state,silent) {
	var ruleinfo = pluginOpts.inlineRules.prettylink;

	// skip if in link label
	if(state.linkLevel > 0 || state.parsingLinkLabel > 0) {
		return false;
	}

	var pos = state.pos;
	var matchIndex = findNextMatch(ruleinfo,pos);
	if(matchIndex === undefined || matchIndex !== pos) {
		return false;
	}

	if(!silent) {
		var twNode = ruleinfo.rule.parse()[0];
		var tag = (twNode.type==='link' ? '$link' : 'a');
		// push a link_open token so markdown's core.linkify will ignore
		var token = state.push('link_open',tag,1);

		$tw.utils.each(twNode.attributes,function(attr,id) {
			token.attrSet(id,attr.value);
		});
		token.attrJoin('class','_codified_');
		token.markup = 'tw_prettylink';

		state.linkLevel++;
		token = state.push('text','',0);
		token.content = twNode.children[0].text;
		state.linkLevel--;

		token = state.push('link_close',tag,-1);
		token.markup = 'tw_prettylink';
	}
	state.pos = ruleinfo.rule.parser.pos;
	return true;
}

function tw_prettyextlink(state,silent) {
	var ruleinfo = pluginOpts.inlineRules.prettyextlink;

	// skip if in link label
	if(state.linkLevel > 0 || state.parsingLinkLabel > 0) {
		return false;
	}

	var pos = state.pos;
	var matchIndex = findNextMatch(ruleinfo,pos);
	if(matchIndex === undefined || matchIndex !== pos) {
		return false;
	}

	if(!silent) {
		var twNode = ruleinfo.rule.parse()[0];
		var token = state.push('link_open','a',1);

		$tw.utils.each(twNode.attributes,function(attr,id) {
			token.attrSet(id,attr.value);
		});
		token.attrJoin('class','_codified_');
		token.markup = 'tw_prettyextlink';

		state.linkLevel++;
		token = state.push('text','',0);
		token.content = twNode.children[0].text;
		state.linkLevel--;

		token = state.push('link_close','a',-1);
		token.markup = 'tw_prettyextlink';
	}
	state.pos = ruleinfo.rule.parser.pos;
	return true;
}

var TWCloseTagRegEx = /<\/\$[A-Za-z0-9\-\$\.]+\s*>/gm;
function extendHtmlInline(origRule) {
	return function(state,silent) {
		if(origRule(state,silent)) {
			return true;
		}

		var token, pos = state.pos;
		var parseTag = $tw.Wiki.parsers['text/vnd.tiddlywiki'].prototype.inlineRuleClasses.html.prototype.parseTag;
		var tag = parseTag(state.src,pos,{});
		if(tag) {
			if(!silent) {
				token = state.push('html_inline','',0);
				token.content = state.src.slice(pos,tag.end);
			}
			state.pos = tag.end;
			return true;
		}

		TWCloseTagRegEx.lastIndex = pos;
		var match = TWCloseTagRegEx.exec(state.src);
		if(!match || match.index !== pos) {
			return false;
		}

		if(!silent) {
			token = state.push('html_inline','',0);
			token.content = state.src.slice(pos,pos + match[0].length);
		}
		state.pos = TWCloseTagRegEx.lastIndex;
		return true;
	};
}

function extendParseLinkLabel(origFunc) {
	return function(state,start,disableNested) {
		if(state.parsingLinkLabel === undefined) {
			state.parsingLinkLabel = 0;
		}
		state.parsingLinkLabel++;
		var labelEnd = origFunc(state,start,disableNested);
		state.parsingLinkLabel--;
		return labelEnd;
	};
}

// reset each tw inline rule to initial inline state
function extendInlineParse(thisArg,origFunc,twInlineRules) {
	return function(str,md,env,outTokens) {
		var i, ruleinfo, key;
		for(key in twInlineRules) {
			ruleinfo = twInlineRules[key];
			ruleinfo.rule.parser.source = str;
			ruleinfo.rule.parser.sourceLength = str.length;
			ruleinfo.rule.parser.pos = 0; // not used
			ruleinfo.matchIndex = -1;
		}
		origFunc.call(thisArg,str,md,env,outTokens);
	}
}

/// post processing ///

function wikify(state) {
	var href, title, src, alt;
	var tagStack = [];

	state.tokens.forEach(function(blockToken) {
		if(blockToken.type === 'inline' && blockToken.children) {
			blockToken.children.forEach(function(token) {
				switch(token.type) {
				case 'link_open':
					if(token.markup === 'tw_prettylink' || token.markup === 'tw_prettyextlink') {
						return;
					}
					href = token.attrGet('href');
					if(href[0] === '#') {
						token.tag = '$link';
						href = $tw.utils.decodeURIComponentSafe(href.substring(1));
						title = token.attrGet('title');
						token.attrs = [['to', href], ['class', '_codified_']];
						if(title) {
							token.attrSet('tooltip',title);
						}
					} else {
						token.attrSet('target','_blank');
						token.attrJoin('class','tc-tiddlylink-external');
						token.attrJoin('class','_codified_');
						token.attrSet('rel','noopener noreferrer');
					}
					tagStack.push(token.tag);
					break;
				case 'link_close':
					if(token.markup === 'tw_prettylink' || token.markup === 'tw_prettyextlink') {
						return;
					}
					token.tag = tagStack.pop();
					break;
				case 'image':
					token.tag = '$image';
					src = token.attrGet('src');
					alt = token.attrGet('alt');
					title = token.attrGet('title');

					token.attrs[token.attrIndex('src')][0] = 'source';
					if(src[0] === '#') {
						src = $tw.utils.decodeURIComponentSafe(src.substring(1));
						token.attrSet('source',src);
					}
					if(title) {
						token.attrs[token.attrIndex('title')][0] = 'tooltip';
					}
					break;
				}
			});
		}
	});
}

module.exports = function tiddlyWikiPlugin(markdown,options) {
	var defaults = {
		renderWikiText: false,
		blockRules: {},
		inlineRules: {}
	};

	md = markdown;
	pluginOpts = md.utils.assign({},defaults,options||{});

	md.renderer.rules.code_inline = render_code_inline;
	md.renderer.rules.code_block = render_code_block;
	md.renderer.rules.fence = render_fence;
	md.renderer.rules.paragraph_open = render_paragraph_open;
	md.renderer.rules.paragraph_close = render_paragraph_close;
	md.renderer.rules.footnote_ref = render_footnote_ref;
	md.renderer.rules.footnote_open = render_footnote_open;
	md.renderer.rules.footnote_anchor = render_footnote_anchor;
	md.renderer.rules.text_special = render_text_special;
	md.renderer.rules.tw_expr = render_tw_expr;
	md.renderer.renderAttrs = render_token_attrs;

	if(pluginOpts.renderWikiText) {
		md.helpers.parseLinkLabel = extendParseLinkLabel(md.helpers.parseLinkLabel);

		if(pluginOpts.inlineRules.image) {
			md.inline.ruler.after('link','tw_image',tw_image);
		}
		if(pluginOpts.inlineRules.prettyextlink) {
			md.inline.ruler.after('link','tw_prettyextlink',tw_prettyextlink);
		}
		if(pluginOpts.inlineRules.prettylink) {
			md.inline.ruler.after('link','tw_prettylink',tw_prettylink);
		}
		if(pluginOpts.inlineRules.filteredtranscludeinline) {
			md.inline.ruler.before('html_inline','tw_filteredtranscludeinline',tw_filteredtranscludeinline);
		}
		if(pluginOpts.inlineRules.transcludeinline) {
			md.inline.ruler.before('html_inline','tw_transcludeinline',tw_transcludeinline);
		}
		if(pluginOpts.inlineRules.macrocallinline) {
			md.inline.ruler.before('html_inline','tw_macrocallinline',tw_macrocallinline);
		}

		md.inline.ruler.at('html_inline',extendHtmlInline(md.inline.ruler.__rules__[md.inline.ruler.__find__('html_inline')].fn));
		md.block.ruler.after('html_block','tw_block',tw_block,{
			alt: [ 'paragraph', 'reference', 'blockquote' ]
		});
		md.inline.parse = extendInlineParse(md.inline,md.inline.parse,options.inlineRules);
	}

	md.core.ruler.disable('text_join');
	md.core.ruler.push('wikify',wikify);
};
