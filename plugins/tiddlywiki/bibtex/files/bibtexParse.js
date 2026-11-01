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
//Modified for TiddlyWiki: @string macros, parenthesised entries, stray @ signs,
//entries without fields, optional commas, parse() that reports a bad entry and
//carries on, and a standard option for BibTeX's own brace and whitespace rules
//
//Issues:
//no comment handling within strings
//Grammar implemented here:
//bibtex -> (string | preamble | comment | entry)*;
//string -> '@STRING' '{' key_equals_value '}';
//preamble -> '@PREAMBLE' '{' value '}';
//comment -> '@COMMENT' '{' value '}';
//entry -> '@' key '{' key [',' [key_value_list]] '}';
//any '{' '}' delimiting one of the above may instead be '(' ')'
//key_value_list -> key_equals_value (','* key_equals_value)* ','*;
//key_equals_value -> key '=' value;
//value -> single_value ('#' single_value)*;
//single_value -> value_quotes | value_braces | identifier;
//value_quotes -> '"' .*? '"'; // not quite
//value_braces -> '{' .*? '"'; // not quite
(function(exports) {

	class BibtexSyntaxError extends Error {}

	function BibtexParser(options) {

        this.months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        this.notKey = [',','{','}',' ','='];
        this.pos = 0;
        this.input = "";
        this.entries = new Array();
		this.errors = [];
		this.standard = !!(options && options.standard);
		this.strings = Object.create(null);
		this.opener = "{";
		this.closer = "}";

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

		this.fail = function(message) {
			throw new BibtexSyntaxError(message);
		};

        this.match = function(s, canCommentOut) {
            if (canCommentOut == undefined || canCommentOut == null)
                canCommentOut = true;
            this.skipWhitespace(canCommentOut);
            if (this.input.substring(this.pos, this.pos + s.length) == s) {
                this.pos += s.length;
            } else {
				this.fail("expected " + s + " but found " + JSON.stringify(this.input.substr(this.pos, 20)));
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
			// A loop, not recursion, so a long run of % lines cannot overflow the stack
			while (true) {
				while (this.isWhitespace(this.input[this.pos])) {
					this.pos++;
				};
				if (this.input[this.pos] != "%" || canCommentOut != true) {
					return;
				}
				while (this.pos < this.input.length && this.input[this.pos] != "\n") {
					this.pos++;
				};
			}
        };

        this.value_braces = function() {
            var bracecount = 0;
			// Not match(), which would skip the leading space of acm # { b}
			this.pos++;
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
						this.fail("unterminated value");
                    };
                };
				// BibTeX counts every brace, so in standard mode the \} in {x\}} closes the value
				if (this.input[this.pos] == '\\' && escaped == false && !this.standard)
                    escaped = true;
                else
                    escaped = false;
                this.pos++;
            };
        };

        this.value_comment = function() {
            var str = '';
            var brcktCnt = 0;
			while (!(this.tryMatch(this.closer, false) && brcktCnt == 0)) {
                str = str + this.input[this.pos];
				if (this.input[this.pos] == this.opener)
                    brcktCnt++;
				if (this.input[this.pos] == this.closer)
                    brcktCnt--;
                if (this.pos >= this.input.length - 1) {
					this.fail("unterminated value");
                };
                this.pos++;
            };
            return str;
        };

        this.value_quotes = function() {
			// Not match(), which would skip the leading space of acm # " b"
			this.pos++;
            var start = this.pos;
            var escaped = false;
			var bracecount = 0;
            while (true) {
                if (!escaped) {
					// In standard mode a quote inside braces belongs to the value: "x {"}y"
					if (this.input[this.pos] == '"' && bracecount == 0) {
                        var end = this.pos;
                        this.match('"', false);
                        return this.input.substring(start, end);
					} else if (this.standard && this.input[this.pos] == '{') {
						bracecount++;
					} else if (this.standard && this.input[this.pos] == '}' && bracecount > 0) {
						bracecount--;
                    } else if (this.pos >= this.input.length - 1) {
						this.fail("unterminated value");
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
            if (this.tryMatch("{")) {
                return this.value_braces();
            } else if (this.tryMatch('"')) {
                return this.value_quotes();
            } else {
				var k = this.identifier();
				if (k.match("^[0-9]+$"))
					return k;
				else if (k.toLowerCase() in this.strings) {
					this.usedMacro = true;
					return this.strings[k.toLowerCase()];
				} else if (this.months.includes(k.toLowerCase()))
					return k.toLowerCase();
				else if (k) {
					// An undefined macro keeps its name, so one bad value does not lose the file
					this.usedMacro = true;
					return k;
				} else
					this.fail("value expected but found " + JSON.stringify(this.input.substr(this.pos, 20)));

            };
        };

		// raw keeps every space, because "Proc. of " in a macro needs its own
		this.value = function(raw) {
            var values = [];
			this.usedMacro = false;
            values.push(this.single_value());
            while (this.tryMatch("#")) {
                this.match("#");
                values.push(this.single_value());
            };
			if (raw) {
				return values.join("");
			}
			if (this.standard || this.usedMacro) {
				return values.join("").trim();
			}
			// Values that parsed before macros existed keep their exact form: { a } becomes "a "
			return values.map(function(value) {
				return value.replace(/^[ \r\t\n]+/, "");
			}).join("");
        };

        this.key = function(optional) {
            var start = this.pos;
            while (true) {
                if (this.pos >= this.input.length) {
					this.fail("unexpected end of file in a key");
                };
                                // а-яА-Я is Cyrillic
                //console.log(this.input[this.pos]);
				if (this.notKey.includes(this.input[this.pos]) || this.input[this.pos] == this.closer) {
					if (optional) {
						// Whitespace may precede the comma: @book{a , title = {T}}
						var next = this.pos;
						while (this.isWhitespace(this.input[next])) {
							next++;
						}
						if (this.input[next] != ',' && this.input[next] != this.closer) {
							this.pos = start;
							return null;
						}
					}
                    return this.input.substring(start, this.pos);
                } else {
                    this.pos++;

                };
            };
        };

		// Unlike key(), stops at the delimiters that end a macro name or an entry type
		this.identifier = function() {
			var start = this.pos;
			while (this.pos < this.input.length && !/[\s,{}()=#"%]/.test(this.input[this.pos])) {
				this.pos++;
			}
			return this.input.substring(start, this.pos);
		};

		this.key_equals_value = function(raw) {
            var key = this.key();
            if (this.tryMatch("=")) {
                this.match("=");
				var val = this.value(raw);
                key = key.trim()
                return [ key, val ];
            } else {
				this.fail("expected = after " + JSON.stringify(key.trim().substr(0, 20)));
            };
        };

        this.key_value_list = function() {
			this.currentEntry['entryTags'] = {};
			while (true) {
				// Commas are optional, so a forgotten one does not lose the entry
				while (this.tryMatch(",")) {
					this.match(",");
				}
				if (this.pos >= this.input.length || this.tryMatch(this.closer)) {
					return;
				}
				var kv = this.key_equals_value();
				this.currentEntry['entryTags'][kv[0]] = kv[1];
			}
        };

        this.entry_body = function(d) {
            this.currentEntry = {};
			var key = this.key(true);
			this.currentEntry['citationKey'] = key !== null && this.standard ? key.trim() : key;
            this.currentEntry['entryType'] = d.substring(1);
			if (key !== null && !this.tryMatch(this.closer)) {
                this.match(",");
            }
			// Pushed first, so the fields read before a syntax error are kept
			this.entries.push(this.currentEntry);
            this.key_value_list();
			if (!key && Object.keys(this.currentEntry['entryTags']).length == 0) {
				this.fail("entry has neither a citation key nor fields");
			}
        };

        this.directive = function() {
            this.match("@");
			var start = this.pos;
			if (!this.standard) {
				// Anything key() read up to a "{" stays the entry type, such as "book#1"
				while (this.pos < this.input.length && !this.notKey.includes(this.input[this.pos])) {
					this.pos++;
				}
				var end = this.pos;
				if (this.tryMatch("{")) {
					return "@" + this.input.substring(start, end);
				}
				this.pos = start;
			}
			return "@" + this.identifier();
        };

		this.string = function() {
			var kv = this.key_equals_value(true);
			this.strings[kv[0].toLowerCase()] = kv[1];
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

		this.block = function() {
			var d = this.directive();
			if (this.tryMatch("(")) {
				this.opener = "(";
				this.closer = ")";
			} else if (this.tryMatch("{")) {
				this.opener = "{";
				this.closer = "}";
			} else {
				// An @ in free text, such as an email address between entries
				return;
			}
			this.match(this.opener);
			if (d.toUpperCase() == "@STRING") {
				this.string();
			} else if (d.toUpperCase() == "@PREAMBLE") {
				this.preamble();
			} else if (d.toUpperCase() == "@COMMENT") {
				this.comment();
			} else {
				this.entry(d);
			}
			this.match(this.closer);
		};

		// Reports the error, drops an entry that has no fields yet and moves to the next line starting with @
		this.recover = function(start, count, error) {
			this.errors.push({
				line: this.input.substring(0, start).split("\n").length,
				message: error.message
			});
			var last = this.entries[this.entries.length - 1];
			if (this.entries.length > count && Object.keys(last.entryTags || {}).length == 0) {
				this.entries.pop();
			}
			var nextEntry = /\n[ \t]*@/g;
			nextEntry.lastIndex = start + 1;
			this.pos = nextEntry.exec(this.input) ? nextEntry.lastIndex - 1 : this.input.length;
		};

        this.bibtex = function() {
            while (this.matchAt()) {
				var start = this.pos,
					count = this.entries.length;
				try {
					this.block();
				} catch (error) {
					if (!(error instanceof BibtexSyntaxError)) {
						throw error;
					}
					this.recover(start, count, error);
				}
            };

            this.alernativeCitationKey();
        };
    };

	// Returns {entries, errors}, where each error is {line, message}, and never fails on bad input
	exports.parse = function(bibtex, options) {
		var b = new BibtexParser(options);
		b.setInput(bibtex);
		b.bibtex();
		return {entries: b.entries, errors: b.errors};
	};

	exports.toJSON = function(bibtex, options) {
		return exports.parse(bibtex, options).entries;
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
