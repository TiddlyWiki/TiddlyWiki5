/*\
title: $:/plugins/tiddlywiki/markdown/markdown-it-katex.js
type: application/javascript
module-type: library

Based on markdown-it-katex v2.0.0 by @waylonflinn https://github.com/waylonflinn/markdown-it-katex | MIT License
\*/
(function(){
/* Process inline math */
/*
Like markdown-it-simplemath, this is a stripped down, simplified version of:
https://github.com/runarberg/markdown-it-math

It differs in that it takes (a subset of) LaTeX as input and relies on KaTeX
for rendering output.
*/

/*jslint node: true */
'use strict';

// Test if potential opening or closing delimieter
// Assumes that there is a "$" at state.src[pos]
function isValidDelim(state, pos) {
    var prevChar, nextChar,
        max = state.posMax,
        can_open = true,
        can_close = true;

    prevChar = pos > 0 ? state.src.charCodeAt(pos - 1) : -1;
    nextChar = pos + 1 <= max ? state.src.charCodeAt(pos + 1) : -1;

    // Check non-whitespace conditions for opening and closing, and
    // check that closing delimeter isn't followed by a number
    if(prevChar === 0x20/* " "  */ || prevChar === 0x09/* \t */ ||
        prevChar === 0x0d/* "\r" */ || prevChar === 0x0a/* \n */ ||
        (nextChar >= 0x30/* "0"  */ && nextChar <=  0x39/* "9" */)) {
        can_close = false;
    }
    if(nextChar === 0x20/* " "  */ || nextChar === 0x09/* \t */ ||
        nextChar === 0x0d/* "\r" */ || nextChar === 0x0a/* \ns */) {
        can_open = false;
    }

    if(state.src.substring(pos,pos+3) === "$:/") {
        can_open = false;
        can_close = false;
    }

    return {
        can_open: can_open,
        can_close: can_close
    };
}

function math_inline(state, silent) {
    var start, match, token, res, pos, esc_count;

    if(state.src[state.pos] !== "$") { return false; }

    res = isValidDelim(state, state.pos);
    if(!res.can_open) {
        if(!silent) { state.pending += "$"; }
        state.pos += 1;
        return true;
    }

    // First check for and bypass all properly escaped delimieters
    // This loop will assume that the first leading backtick can not
    // be the first character in state.src, which is known since
    // we have found an opening delimieter already.
    start = state.pos + 1;
    match = start;
    while( (match = state.src.indexOf("$", match)) !== -1) {
        // Found potential $, look for escapes, pos will point to
        // first non escape when complete
        pos = match - 1;
        while(state.src[pos] === "\\") { pos -= 1; }

        // Even number of escapes, potential closing delimiter found
        if( ((match - pos) % 2) == 1 ) { break; }
        match += 1;
    }

    // No closing delimter found.  Consume $ and continue.
    if(match === -1) {
        if(!silent) { state.pending += "$"; }
        state.pos = start;
        return true;
    }

    // Check if we have empty content, ie: $$.  Do not parse.
    if(match - start === 0) {
        if(!silent) { state.pending += "$$"; }
        state.pos = start + 1;
        return true;
    }

    // Check for valid closing delimiter
    res = isValidDelim(state, match);
    if(!res.can_close) {
        if(!silent) { state.pending += "$"; }
        state.pos = start;
        return true;
    }

    if(!silent) {
        token         = state.push('math_inline', '$latex', 0);
        token.markup  = "$";
        token.content = state.src.slice(start, match);
        token.attrs   = [["displayMode", "false"], ["text", token.content]];
    }

    state.pos = match + 1;
    return true;
}

/*! https://github.com/iktakahiro/markdown-it-katex/pull/2 by @shinhermit */
function math_inline_block(state, silent) {
    var start, match, token, res, pos, esc_count;

    if(state.src.slice(state.pos, state.pos+2) !== "$$") { return false; }

    // First check for and bypass all properly escaped delimieters
    // This loop will assume that the first leading backtick can not
    // be the first character in state.src, which is known since
    // we have found an opening delimieter already.
    start = state.pos + 2;
    match = start;
    while( (match = state.src.indexOf("$$", match)) !== -1) {
        // Found potential $$, look for escapes, pos will point to
        // first non escape when complete
        pos = match - 1;
        while(state.src[pos] === "\\") { pos -= 1; }

        // Even number of escapes, potential closing delimiter found
        if( ((match - pos) % 2) == 1 ) { break; }
        match += 2;
    }

    // No closing delimter found.  Consume $$ and continue.
    if(match === -1) {
        if(!silent) { state.pending += "$$"; }
        state.pos = start;
        return true;
    }

    // Check if we have empty content, ie: $$$$.  Do not parse.
    if(match - start === 0) {
        if(!silent) { state.pending += "$$$$"; }
        state.pos = start + 2;
        return true;
    }

    if(!silent) {
        token         = state.push('math_inline_block', '$latex', 0);
        token.block   = true;
        token.markup  = "$$";
        token.content = state.src.slice(start, match);
        token.attrs   = [["displayMode", "true"], ["text", token.content]];
    }

    state.pos = match + 2;
    return true;
}

module.exports = function math_plugin(md, options) {
    md.inline.ruler.after('escape', 'math_inline', math_inline);
    md.inline.ruler.after('escape', 'math_inline_block', math_inline_block);
};
})();