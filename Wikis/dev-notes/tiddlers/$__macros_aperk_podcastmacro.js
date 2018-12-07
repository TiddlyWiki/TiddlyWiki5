/*\
title: $:/macros/aperk/podcastmacro.js
type: application/javascript
module-type: macro

<<podcastmacro>>
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "podcastmacro";

exports.params = [
    {name: "episode"}
];

/*
Run the macro
*/
exports.run = function(episode) {
//  var title = 'pHead ' + episode;
//  var episodeTiddler = this.wiki.getTiddlerDataCached (title);
  var libsyn = this.wiki.getTiddlerDataCached ('PHEAD_LIBSYNID');
  var libsynId = libsyn[episode];
  var output = '';
  var libsynFrame = "<iframe style=\"border:none\" src=\"//html5-player.libsyn.com/embed/episode/id/"
+ libsynId
+ "/height/100/width/600/thumbnail/yes/render-playlist/no/theme/custom/tdest_id/260044/custom-color/444444\" scrolling=\"no\" 0=\"allowfullscreen\" 1=\"webkitallowfullscreen\" 2=\"mozallowfullscreen\" 3=\"oallowfullscreen\" 4=\"msallowfullscreen\" class=\"iframe-class\" width=\"600\" height=\"100\" frameborder=\"0\"></iframe>";
    output =  '<div>'
      + '<p>' 
      + 'Release Date: {{PHEAD_DATE##' + episode + '}}'
      + '</p><p>' 
      + '{{PHEAD_DESCRIPTION##' + episode + '}}'
      + '</p><p>' 
      + libsynFrame
      + '</p></div>';
  return output;
};

})();

