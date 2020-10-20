/* start bibtexParse 0.0.24 */

//Original work by Henrik Muehe (c) 2010
//
//CommonJS port by Mikola Lysenko 2013
//
//Choice of compact (default) or pretty output from toBibtex:
//		Nick Bailey, 2017.
//
//Port to Browser lib by ORCID / RCPETERS
//
//Issues:
//no comment handling within strings
//no string concatenation
//no variable values yet
//Grammar implemented here:
//bibtex -> (string | preamble | comment | entry)*;
//string -> '@STRING' '{' key_equals_value '}';
//preamble -> '@PREAMBLE' '{' value '}';
//comment -> '@COMMENT' '{' value '}';
//entry -> '@' key '{' key ',' key_value_list '}';
//key_value_list -> key_equals_value (',' key_equals_value)*;
//key_equals_value -> key '=' value;
//value -> value_quotes | value_braces | key;
//value_quotes -> '"' .*? '"'; // not quite
//value_braces -> '{' .*? '"'; // not quite
(function(exports) {

    function BibtexParser() {

        this.months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        this.notKey = [',','{','}',' ','='];
        this.pos = 0;
        this.input = "";
        this.entries = new Array();

        this.currentEntry = "";

        this.setInput = function(t) {
            this.input = t;
        };

        this.getEntries = function() {
            return this.entries;
        };

        this.isWhitespace = function(s) {
            return (s == ' ' || s == '\r' || s == '\t' || s == '\n');
        };

        this.match = function(s, canCommentOut) {
            if (canCommentOut == undefined || canCommentOut == null)
                canCommentOut = true;
            this.skipWhitespace(canCommentOut);
            if (this.input.substring(this.pos, this.pos + s.length) == s) {
                this.pos += s.length;
            } else {
                throw TypeError("Token mismatch: match", "expected " + s + ", found "
                        + this.input.substring(this.pos));
            };
            this.skipWhitespace(canCommentOut);
        };

        this.tryMatch = function(s, canCommentOut) {
            if (canCommentOut == undefined || canCommentOut == null)
                canCommentOut = true;
            this.skipWhitespace(canCommentOut);
            if (this.input.substring(this.pos, this.pos + s.length) == s) {
                return true;
            } else {
                return false;
            };
            this.skipWhitespace(canCommentOut);
        };

        /* when search for a match all text can be ignored, not just white space */
        this.matchAt = function() {
            while (this.input.length > this.pos && this.input[this.pos] != '@') {
                this.pos++;
            };

            if (this.input[this.pos] == '@') {
                return true;
            };
            return false;
        };

        this.skipWhitespace = function(canCommentOut) {
            while (this.isWhitespace(this.input[this.pos])) {
                this.pos++;
            };
            if (this.input[this.pos] == "%" && canCommentOut == true) {
                while (this.input[this.pos] != "\n") {
                    this.pos++;
                };
                this.skipWhitespace(canCommentOut);
            };
        };

        this.value_braces = function() {
            var bracecount = 0;
            this.match("{", false);
            var start = this.pos;
            var escaped = false;
            while (true) {
                if (!escaped) {
                    if (this.input[this.pos] == '}') {
                        if (bracecount > 0) {
                            bracecount--;
                        } else {
                            var end = this.pos;
                            this.match("}", false);
                            return this.input.substring(start, end);
                        };
                    } else if (this.input[this.pos] == '{') {
                        bracecount++;
                    } else if (this.pos >= this.input.length - 1) {
                        throw TypeError("Unterminated value: value_braces");
                    };
                };
                if (this.input[this.pos] == '\\' && escaped == false)
                    escaped = true;
                else
                    escaped = false;
                this.pos++;
            };
        };

        this.value_comment = function() {
            var str = '';
            var brcktCnt = 0;
            while (!(this.tryMatch("}", false) && brcktCnt == 0)) {
                str = str + this.input[this.pos];
                if (this.input[this.pos] == '{')
                    brcktCnt++;
                if (this.input[this.pos] == '}')
                    brcktCnt--;
                if (this.pos >= this.input.length - 1) {
                    throw TypeError("Unterminated value: value_comment", + this.input.substring(start));
                };
                this.pos++;
            };
            return str;
        };

        this.value_quotes = function() {
            this.match('"', false);
            var start = this.pos;
            var escaped = false;
            while (true) {
                if (!escaped) {
                    if (this.input[this.pos] == '"') {
                        var end = this.pos;
                        this.match('"', false);
                        return this.input.substring(start, end);
                    } else if (this.pos >= this.input.length - 1) {
                        throw TypeError("Unterminated value: value_quotes", this.input.substring(start));
                    };
                }
                if (this.input[this.pos] == '\\' && escaped == false)
                    escaped = true;
                else
                    escaped = false;
                this.pos++;
            };
        };

        this.single_value = function() {
            var start = this.pos;
            if (this.tryMatch("{")) {
                return this.value_braces();
            } else if (this.tryMatch('"')) {
                return this.value_quotes();
            } else {
                var k = this.key();
                if (k.match("^[0-9]+$"))
                    return k;
                else if (this.months.indexOf(k.toLowerCase()) >= 0)
                    return k.toLowerCase();
                else
                    throw "Value expected: single_value" + this.input.substring(start) + ' for key: ' + k;

            };
        };

        this.value = function() {
            var values = [];
            values.push(this.single_value());
            while (this.tryMatch("#")) {
                this.match("#");
                values.push(this.single_value());
            };
            return values.join("");
        };

        this.key = function(optional) {
            var start = this.pos;
            while (true) {
                if (this.pos >= this.input.length) {
                    throw TypeError("Runaway key: key");
                };
                                // а-яА-Я is Cyrillic
                //console.log(this.input[this.pos]);
                if (this.notKey.indexOf(this.input[this.pos]) >= 0) {
                    if (optional && this.input[this.pos] != ',') {
                        this.pos = start;
                        return null;
                    };
                    return this.input.substring(start, this.pos);
                } else {
                    this.pos++;

                };
            };
        };

        this.key_equals_value = function() {
            var key = this.key();
            if (this.tryMatch("=")) {
                this.match("=");
                var val = this.value();
                key = key.trim()
                return [ key, val ];
            } else {
                throw TypeError("Value expected, equals sign missing: key_equals_value",
                     this.input.substring(this.pos));
            };
        };

        this.key_value_list = function() {
            var kv = this.key_equals_value();
            this.currentEntry['entryTags'] = {};
            this.currentEntry['entryTags'][kv[0]] = kv[1];
            while (this.tryMatch(",")) {
                this.match(",");
                // fixes problems with commas at the end of a list
                if (this.tryMatch("}")) {
                    break;
                }
                ;
                kv = this.key_equals_value();
                this.currentEntry['entryTags'][kv[0]] = kv[1];
            };
        };

        this.entry_body = function(d) {
            this.currentEntry = {};
            this.currentEntry['citationKey'] = this.key(true);
            this.currentEntry['entryType'] = d.substring(1);
            if (this.currentEntry['citationKey'] != null) {
                this.match(",");
            }
            this.key_value_list();
            this.entries.push(this.currentEntry);
        };

        this.directive = function() {
            this.match("@");
            return "@" + this.key();
        };

        this.preamble = function() {
            this.currentEntry = {};
            this.currentEntry['entryType'] = 'PREAMBLE';
            this.currentEntry['entry'] = this.value_comment();
            this.entries.push(this.currentEntry);
        };

        this.comment = function() {
            this.currentEntry = {};
            this.currentEntry['entryType'] = 'COMMENT';
            this.currentEntry['entry'] = this.value_comment();
            this.entries.push(this.currentEntry);
        };

        this.entry = function(d) {
            this.entry_body(d);
        };

        this.alernativeCitationKey = function () {
            this.entries.forEach(function (entry) {
                if (!entry.citationKey && entry.entryTags) {
                    entry.citationKey = '';
                    if (entry.entryTags.author) {
                        entry.citationKey += entry.entryTags.author.split(',')[0] += ', ';
                    }
                    entry.citationKey += entry.entryTags.year;
                }
            });
        }

        this.bibtex = function() {
            while (this.matchAt()) {
                var d = this.directive();
                this.match("{");
                if (d.toUpperCase() == "@STRING") {
                    this.string();
                } else if (d.toUpperCase() == "@PREAMBLE") {
                    this.preamble();
                } else if (d.toUpperCase() == "@COMMENT") {
                    this.comment();
                } else {
                    this.entry(d);
                }
                this.match("}");
            };

            this.alernativeCitationKey();
        };
    };

    exports.toJSON = function(bibtex) {
        var b = new BibtexParser();
        b.setInput(bibtex);
        b.bibtex();
        return b.entries;
    };

    /* added during hackathon don't hate on me */
    /* Increased the amount of white-space to make entries
     * more attractive to humans. Pass compact as false
     * to enable */
    exports.toBibtex = function(json, compact) {
        if (compact === undefined) compact = true;
        var out = '';
        
        var entrysep = ',';
        var indent = '';
        if (!compact) {
		      entrysep = ',\n';
		      indent = '    ';        
        }
        for ( var i in json) {
            out += "@" + json[i].entryType;
            out += '{';
            if (json[i].citationKey)
                out += json[i].citationKey + entrysep;
            if (json[i].entry)
                out += json[i].entry ;
            if (json[i].entryTags) {
                var tags = indent;
                for (var jdx in json[i].entryTags) {
                    if (tags.trim().length != 0)
                        tags += entrysep + indent;
                    tags += jdx + (compact ? '={' : ' = {') + 
                            json[i].entryTags[jdx] + '}';
                }
                out += tags;
            }
            out += compact ? '}\n' : '\n}\n\n';
        }
        return out;

    };

})(typeof exports === 'undefined' ? this['bibtexParse'] = {} : exports);

/* end bibtexParse */
