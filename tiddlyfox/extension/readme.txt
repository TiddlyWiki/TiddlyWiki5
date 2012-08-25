In order to test the extension, edit the file `tiddlyfox@tiddlywiki.org` to contain the path to the TiddlyFox extension folder, and then drop the file in your `[firefox profile folder]\extensions\` folder.

----

This package accompanies the article at MozillaZine Knowledge Base, which can be
found at <http://kb.mozillazine.org/Getting_started_with_extension_development>

You can use its contents as a starting point for developing extensions. Steps to
register these files in the EM are described in the "Registering your extension 
in the Extension Manager" section of the article. In short:
 1. Unzip this package to any location, e.g. c:\dev
 2. Put the path to the "helloworld" folder (e.g. c:\dev\helloworld) in the 
    "helloworld@mozilla.doslash.org" file and move that file to 
    [profile folder]\extensions\
 3. Restart Firefox.

You should see a new red "Hello world" item in the Tools menu and the extension
should show up in the Extension Manager window (Tools > Extensions).

********* YOU MUST RUN FIREFOX 3.6 OR FIREFOX 4 TO USE THIS PACKAGE ************

helloworld.xpi contains working prebuilt version of the extension, just in case.

You must change the following items before making your extension 
available to general public:
1) the extension's ID in install.rdf (helloworld@mozilla.doslash.org).
  (For details see <https://developer.mozilla.org/en/install.rdf>)
2) the extension's short name (currently "helloworld"). 
  The new name must be in lower case.

********* OK, the example is working. What's next?

Follow the tips at <https://developer.mozilla.org/en/Setting_up_extension_development_environment>
to save yourself time.

Check the documentation available at <https://developer.mozilla.org/en/Extensions>.

If you have any problems that you can't solve yourself, feel free to ask questions:
 <https://developer.mozilla.org/en/Extensions#Community>
