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

exports.isLoginPage = true;

exports.handler = function(request,response,state) {
	response.writeHead(200, {"Content-Type": "text/html"});
	var sessionId = $tw.utils.createSessionId(state.secretKey);
	var text = '<html><head><script>var login=function(){var o="' + sessionId + '",i=new TextEncoder,a=Uint8Array;function s(e,n){var t=crypto.subtle;return t.importKey("raw",e,{name:"PBKDF2"},!1,["deriveKey"]).then(function(e){return t.deriveKey({name:"PBKDF2",salt:n,iterations:4096,hash:"SHA-256"},e,{name:"AES-GCM",length:256},!0,["encrypt","decrypt"])}).then(function(e){return t.exportKey("raw",e)})}function u(e,n){var t=new XMLHttpRequest;t.open("POST",window.location,!0),t.responseType="json",t.setRequestHeader("Content-type","application/x-www-form-urlencoded; charset=UTF-8"),t.setRequestHeader("X-Requested-With","TiddlyWiki"),t.setRequestHeader("Accept","application/json"),t.onreadystatechange=function(){if(4===t.readyState){if(200===t.status)return void n(t.response);"Object"==typeof t.response?document.getElementById("error").innerHTML=t.response.error:document.getElementById("error").innerHTML="Server request failed with response code:"+t.status,loginForm.onsubmit=login}};var r="";for(var o in e)r&&(r+="&"),r+=o+"="+encodeURIComponent(e[o]);t.send(r)}return function(){var t=loginForm;return t.onsubmit=function(){return!1},u({user:t.user.value,sid:o},function(e){var r=function(e){for(var n=new a(e.length/2),t=0;t<e.length;t+=2)n[t/2]=parseInt(e.substr(t,2),16);return n}(e.salt);s(i.encode(t.key.value),r).then(function(e){e=new a(e);var n=i.encode(o),t=new a(e.length+n.length);return t.set(e),t.set(n,e.length),s(t,r)}).then(function(e){var n=function(e){for(var n="",t=0;t<e.length;++t)n+=(e[t]<16?"0":"")+e[t].toString(16);return n}(new a(e));u({user:t.user.value,sid:o,key:n},function(e){window.location=e.location})})}),!1}}()</script></head><body><form name="loginForm" method="post" onsubmit="return login()">Username: <input type="text" name="user" size="20"> Password: <input type="text" name="key" size="20"> <input type="submit" value="Login"><div id="error" style="color: red"></div></form></body></html>';
	response.end(text, "utf8");
};

}());
