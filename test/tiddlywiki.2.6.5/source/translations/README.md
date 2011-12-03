Translating TiddlyWiki
======================

Are you you thinking of writing a translation for TiddlyWiki? That is fantastic: it will make a real difference to the community. This page is here to get you going.

If you have any questions you would like addressed, please contact translations@tiddlywiki.org.


How to create or update a translation of TiddlyWiki
---------------------------------------------------

1. First, check below to see if the translation you need already exists.
2. Download a fresh copy of TiddlyWiki from  http://www.tiddlywiki.com/
3. In another window, visit  https://github.com/TiddlyWiki/tiddlywiki/blob/master/locales/core/en/locale.en.js and copy all the text to the clipboard
4. Go back to the TiddlyWiki file and create a tiddler named after the language you are translating
5. Paste the clipboard into the body of the new tiddler
6. Add the tag "systemConfig" to the tiddler
7. Click 'done' and save your changes
8. Study the entries you've pasted and replace the various quoted English strings (only the ones in double-quotes!) with their translations
9. Save and reload to test
10. The "config.locale" in your translation-tiddler is used to set the W3C language tags in your HTML automatically, but since this reload is the first time your translation is executed, only now these tags are actually updated. Therefore you have to save your TW once again.


Useful links
------------

[W3C Internationalization Best Practices](http://www.w3.org/TR/i18n-html-tech-lang/)

http://www.w3.org/International/articles/language-tags/Overview.en.php

http://www.loc.gov/standards/iso639-2/php/code_list.php

http://www.iana.org/assignments/language-subtag-registry
