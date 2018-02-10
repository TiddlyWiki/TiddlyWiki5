Diff, Match and Patch Library
http://code.google.com/p/google-diff-match-patch/
Neil Fraser

This library is currently available in seven different ports, all using the same API.
Every version includes a full set of unit tests.

C++:
* Ported by Mike Slemmer.
* Currently requires the Qt library.

C#:
* Ported by Matthaeus G. Chajdas.

Dart:
* The Dart language is still growing and evolving, so this port is only as
  stable as the underlying language.

Java:
* Included is both the source and a Maven package.

JavaScript:
* diff_match_patch_uncompressed.js is the human-readable version.
  Users of node.js should 'require' this uncompressed version since the
  compressed version is not guaranteed to work outside of a web browser.
* diff_match_patch.js has been compressed using Google's internal JavaScript compressor.
  Non-Google hackers who wish to recompress the source can use:
  http://dean.edwards.name/packer/

Lua:
* Ported by Duncan Cross.
* Does not support line-mode speedup.

Objective C:
* Ported by Jan Weiss.
* Includes speed test (this is a separate bundle for other languages).

Python:
* Two versions, one for Python 2.x, the other for Python 3.x.
* Runs 10x faster under PyPy than CPython.

Demos:
* Separate demos for Diff, Match and Patch in JavaScript.
