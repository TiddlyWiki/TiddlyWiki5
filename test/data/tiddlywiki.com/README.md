TiddlyWiki
==========

https://github.com/TiddlyWiki/tiddlywiki.com


Description
-----------

This repository contains the tools required to create the site http://tiddlywiki.com/

The content for tiddlywiki.com is obtained from a [TiddlySpace](http://tiddlyspace.com/).


Prerequisites
-------------

Ensure that you have downloaded and installed TiddlyWiki as described at https://github.com/TiddlyWiki/tiddlywiki

You need perl to build tiddlywiki.com. If you do not have it installed, it can be downloaded [here](http://www.perl.org/get.html).

You need to set up `ginsu`. Copy the `ginsu` script file to somewhere that is on your path. Edit this file according to the instructions in the file.

You need to set up the `tiddler2tid`. Copy the `tiddler2tid` script file to somewhere that is on your path.


Building tiddlywiki.com
-----------------------

After downloading and installing TiddlyWiki checkout the version of TiddlyWiki that you wish to use for tiddlywiki.com. Ongoing development occurs in the tiddlywiki repository, so you need to checkout a tagged release version of TiddlyWiki. Change to the tiddlywiki directory and checkout the required version, eg:

    git checkout tags/v2.6.5

Change back to the tiddlywiki.com directory.

Pull down the tiddlywiki.com content form TiddlySpace by invoking the `pull.sh` script:

    ./pull.sh

Edit the build script `bld` setting the correct version number for TiddlyWiki.

Invoke the build script:

    ./bld

You now need to generate the TiddlyWiki RSS file. To do this open the TiddlyWiki file index.html in Firefox, ensure the AdvancedOption "Generate an RSS feed when saving changes" is set, and then save the TiddlyWiki. Doing this also causes TiddlyWiki to generate some static HTML for display when Javascript is not enabled.

Edit the upload script `upload` setting the correct version number for TiddlyWiki.

Finally you need to upload the TiddlyWiki files to tiddlywiki.com. If this is the first time you are uploading, then you will need to create a `tmp` directory on tiddlywiki.com:

    ssh user@tiddlywiki.com
    [enter your password when prompted]
    mkdir tmp
    exit

You can now upload the TiddlyWiki files, run the upload script:

    ./upload

You will be prompted for your password on several occasions during the upload process. To do this you will of course need an account on tiddlywiki.com. The upload script assumes your remote user name is the same as your local user name, if it is not then you may specify your remote user name as the first parameter to the upload script.

Migrated from http://svn.tiddlywiki.org on 20110719.
