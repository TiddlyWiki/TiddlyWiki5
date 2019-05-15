/*\
title: $:/core/modules/server/routes/get-login-hash.js
type: application/javascript
module-type: route

GET /login-hash -- force a hash based authentication

\*/
(function() {

/*jslint node: true, browser: false */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/login-hash$/;

exports.handler = function(request,response,state) {
	response.writeHead(200, {"Content-Type": "text/html"});
	var salt = state.pwInfo.salt.toString('hex');
	var sessionId = $tw.utils.createSessionId(state.pwInfo);
	var text = '<html><head><script>var login=function(){var a=new TextEncoder,i=Uint8Array;function u(e,n){var t=crypto.subtle;return t.importKey("raw",e,{name:"PBKDF2"},!1,["deriveKey"]).then(function(e){return t.deriveKey({name:"PBKDF2",salt:n,iterations:4096,hash:"SHA-256"},e,{name:"AES-GCM",length:256},!0,["encrypt","decrypt"])}).then(function(e){return t.exportKey("raw",e)})}return function(){var o=loginForm;o.onsubmit=function(){return!1};var r=function(e){for(var n=new i(e.length/2),t=0;t<e.length;t+=2)n[t/2]=parseInt(e.substr(t,2),16);return n}(o.salt.value);return u(a.encode(o.key.value),r).then(function(e){e=new i(e);var n=a.encode(o.sid.value),t=new i(e.length+n.length);return t.set(e),t.set(n,e.length),u(t,r)}).then(function(e){var n=function(e){for(var n="",t=0;t<e.length;++t)n+=(e[t]<16?"0":"")+e[t].toString(16);return n}(new i(e)),t=new XMLHttpRequest;t.open("POST",window.location,!0),t.responseType="json",t.setRequestHeader("Content-type","application/x-www-form-urlencoded; charset=UTF-8"),t.setRequestHeader("X-Requested-With","TiddlyWiki"),t.setRequestHeader("Accept","application/json"),t.onreadystatechange=function(){if(4===t.readyState){if(200===t.status)return void(window.location=t.response.location);403===t.status&&(document.getElementById("error").innerHTML=t.response.error),o.onsubmit=login}};var r="user="+encodeURIComponent(o.user.value)+"&key="+encodeURIComponent(n)+"&sid="+encodeURIComponent(o.sid.value);t.send(r)}),!1}}()</script></head><body><form name="loginForm" method="post" onsubmit="return login()">Username: <input type="text" name="user" size="20"> Password: <input type="text" name="key" size="20"> <input type="submit" value="Login"> <input type="hidden" name="salt" value="' + salt + '"> <input type="hidden" name="sid" value="' + sessionId + '"><div id="error" style="color: red"></div></form></body></html>'
	response.end(text, "utf8");
};

}());
