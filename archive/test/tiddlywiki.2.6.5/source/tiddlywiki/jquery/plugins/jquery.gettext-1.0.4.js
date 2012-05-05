/**
 * gettext for jQuery
 * 
 * Copyright (c) 2008 Sabin Iacob (m0n5t3r) <iacobs@m0n5t3r.info>
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details. 
 *
 * @license http://www.gnu.org/licenses/gpl.html 
 * @project jquery.gettext
 *
 * Usage:
 * 
 * This plugin expects its input data to be a JSON object like 
 * {"": header, "string": "translation", ...} 
 *
 * After getting the server side set up (either as a static file - my choice - or 
 * as a web service), the client side is simple:
 *  * add to the head section of the page something like 
 *    <link href="path/to/translation.json" lang="ro" rel="gettext"/>
 *  * in your script, use $.gt.gettext(string) or _(string); for plural forms, use
 *    $.gt.ngettext(sg, pl1[, pl2, ...], count) or n_(sg, pl1[, pl2, ...], count)
 *  * to extract strings to a .po file, you can use standard gettext utilities like
 *    xgettext and msgfmt; to generate the JSON, one could use the following Python 
 *    snippet, assuming a domain.mo file exists under path/lang/LC_MESSAGES:
 *
 *    import simplejson as enc
 * 
 *    def gettext_json(domain, path, lang = [], indent = False):
 *        try:
 *            tr = gettext.translation(domain, path, lang)
 *            return enc.dumps(tr._catalog, ensure_ascii = False, indent = indent)
 *        except IOError:
 *            return None
 *
 *    why go through the additional hassle of gettext? well, it's a matter of 
 *    preference, the main advantags I see are:
 *     * well known editing tools like KBabel, poEdit, gtranslator, Emacs PO mode, 
 *       etc.
 *     * translation memory, fuzzy matches and other features that get really 
 *       helpful when your application is big and you have hundreds of strings
 */
(function($) {
	$.gt = $.gt || {};

	$.extend($.gt, {
		messages: {},
		lang: 'C',
		setLang: function(code) { $.gt.lang = typeof code == 'string' && code != ' ' ? code : 'C'; },
		pl_re: /^Plural-Forms:\s*nplurals\s*=\s*(\d+);\s*plural\s*=\s*([^a-zA-Z0-9\$]*([a-zA-Z0-9\$]+).+)$/m,
		plural: function(n) {return n != 1;},
		load: function() {
			$('link[rel=gettext]').each(function(){
				var lang = this.lang;
				$.get(this.href, function(data){
					$.gt.messages[lang] = $.gt.messages[lang] || {};
					try {
						var messages = eval('(' + data + ')');
					} catch(e) {
						return;
					}

					$.extend($.gt.messages[lang], messages);

					var pl = $.gt.pl_re.exec($.gt.messages[lang]['']);
					if(pl){
						var expr = pl[2];
						var np = pl[1];
						var v = pl[3];
						try {
							var fn = eval('(function(' + v + ') {return ' + expr + ';})');
						} catch(e) {
							return;
						}
						$.gt.plural = fn;
					}
				});
			});
			$.gt.setLang($('html').attr('lang'));
		},
		gettext: function(msgstr) {
			var lang = $.gt.lang;
			
			if(lang == 'C' || typeof $.gt.messages[lang] == 'undefined') {
				return msgstr;
			}

			var trans = $.gt.messages[lang][msgstr];

			if(typeof trans == 'string') { // regular action
				return trans;
			} else if(typeof trans == 'object' && trans.constructor == Array) { // the translation contains plural(s), yet gettext was called
				return trans[0];
			}
			return msgstr;
		},
		ngettext: function() {
			var lang = $.gt.lang;
			var argv = Array.apply(null, arguments);
			var cnt = argv[argv.length - 1];
			var sg = argv[0];
			var pls = argv.slice(0, -1);
			
			var trans = pls;

			if(lang != 'C' && typeof $.gt.messages[lang] != 'undefined') {
				trans = $.gt.messages[lang][sg];
			}

			if(typeof trans == 'string') { // called ngettext, but no plural forms available :-?
				return trans;
			} else if(typeof trans == 'object' && trans.constructor == Array) {
				var pl = $.gt.plural(cnt);
				if(typeof pl == 'boolean' && pls.length == 2) {
					pl = pl ? 1 : 0;
				}
				if(typeof pl == 'number' && pl < trans.length) {
					return trans[pl];
				}
			}
			return sg;
		}
	});

	$('document').ready($.gt.load);
})(jQuery);

if(typeof _ == 'undefined') {
	var _ = jQuery.gt.gettext;
}
if(typeof n_ == 'undefined') {
	var n_ = jQuery.gt.ngettext;
}
