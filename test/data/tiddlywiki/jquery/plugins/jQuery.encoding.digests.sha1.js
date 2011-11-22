/*
jQuery.encoding.digests.sha1.js

SHA-1 digest and associated utility functions

Copyright (c) UnaMesa Association 2009

Dual licensed under the MIT and GPL licenses:
  http://www.opensource.org/licenses/mit-license.php
  http://www.gnu.org/licenses/gpl.html
*/

(function($) {

if(!$.encoding)
	$.encoding = {};
	$.extend($.encoding,{
		strToBe32s: function(str) {
			// Convert a string to an array of big-endian 32-bit words
			var be=[];
			var len=Math.floor(str.length/4);
			var i, j;
			for(i=0, j=0; i<len; i++, j+=4) {
				be[i]=((str.charCodeAt(j)&0xff) << 24)|((str.charCodeAt(j+1)&0xff) << 16)|((str.charCodeAt(j+2)&0xff) << 8)|(str.charCodeAt(j+3)&0xff);
			}
			while(j<str.length) {
				be[j>>2] |= (str.charCodeAt(j)&0xff)<<(24-(j*8)%32);
				j++;
			}
			return be;
		},
		be32sToStr: function(be) {
			// Convert an array of big-endian 32-bit words to a string
			var str='';
			for(var i=0;i<be.length*32;i+=8) {
				str += String.fromCharCode((be[i>>5]>>>(24-i%32)) & 0xff);
			}
			return str;
		},
		be32sToHex: function(be) {
			// Convert an array of big-endian 32-bit words to a hex string
			var hex='0123456789ABCDEF';
			var str='';
			for(var i=0;i<be.length*4;i++) {
				str += hex.charAt((be[i>>2]>>((3-i%4)*8+4))&0xF) + hex.charAt((be[i>>2]>>((3-i%4)*8))&0xF);
			}
			return str;
		}
	});
})(jQuery);


(function($) {

if(!$.encoding.digests)
	$.encoding.digests = {};
	$.extend($.encoding.digests,{
		hexSha1Str: function(str) {
			// Return, in hex, the SHA-1 hash of a string
			return $.encoding.be32sToHex($.encoding.digests.sha1Str(str));
		},
		sha1Str: function(str) {
			// Return the SHA-1 hash of a string
			return sha1($.encoding.strToBe32s(str),str.length);
		},
		sha1: function(x,blen) {
			// Calculate the SHA-1 hash of an array of blen bytes of big-endian 32-bit words
			return sha1($.encoding.strToBe32s(str),str.length);
		}
	});

	// Private functions.
	function sha1(x,blen) {
		// Calculate the SHA-1 hash of an array of blen bytes of big-endian 32-bit words
		function add32(a,b) {
			// Add 32-bit integers, wrapping at 32 bits
			// Uses 16-bit operations internally to work around bugs in some JavaScript interpreters.
			var lsw=(a&0xFFFF)+(b&0xFFFF);
			var msw=(a>>16)+(b>>16)+(lsw>>16);
			return (msw<<16)|(lsw&0xFFFF);
		}
		function AA(a,b,c,d,e) {
			// Cryptographic round helper function. Add five 32-bit integers, wrapping at 32 bits, second parameter is rotated left 5 bits before the addition
			// Uses 16-bit operations internally to work around bugs in some JavaScript interpreters.
			b=(b>>>27)|(b<<5);
			var lsw=(a&0xFFFF)+(b&0xFFFF)+(c&0xFFFF)+(d&0xFFFF)+(e&0xFFFF);
			var msw=(a>>16)+(b>>16)+(c>>16)+(d>>16)+(e>>16)+(lsw>>16);
			return (msw<<16)|(lsw&0xFFFF);
		}
		function RR(w,j) {
			// Cryptographic round helper function.
			var n=w[j-3]^w[j-8]^w[j-14]^w[j-16];
			return (n>>>31)|(n<<1);
		}

		var len=blen*8;
		//# Append padding so length in bits is 448 mod 512
		x[len>>5] |= 0x80 << (24-len%32);
		//# Append length
		x[((len+64>>9)<<4)+15]=len;
		var w=new Array(80);

		var k1=0x5A827999;
		var k2=0x6ED9EBA1;
		var k3=0x8F1BBCDC;
		var k4=0xCA62C1D6;

		var h0=0x67452301;
		var h1=0xEFCDAB89;
		var h2=0x98BADCFE;
		var h3=0x10325476;
		var h4=0xC3D2E1F0;

		for(var i=0;i<x.length;i+=16) {
			var j=0;
			var t;
			var a=h0;
			var b=h1;
			var c=h2;
			var d=h3;
			var e=h4;
			while(j<16) {
				w[j]=x[i+j];
				t=AA(e,a,d^(b&(c^d)),w[j],k1);
				e=d; d=c; c=(b>>>2)|(b<<30); b=a; a=t; j++;
			}
			while(j<20) {
				w[j]=RR(w,j);
				t=AA(e,a,d^(b&(c^d)),w[j],k1);
				e=d; d=c; c=(b>>>2)|(b<<30); b=a; a=t; j++;
			}
			while(j<40) {
				w[j]=RR(w,j);
				t=AA(e,a,b^c^d,w[j],k2);
				e=d; d=c; c=(b>>>2)|(b<<30); b=a; a=t; j++;
			}
			while(j<60) {
				w[j]=RR(w,j);
				t=AA(e,a,(b&c)|(d&(b|c)),w[j],k3);
				e=d; d=c; c=(b>>>2)|(b<<30); b=a; a=t; j++;
			}
			while(j<80) {
				w[j]=RR(w,j);
				t=AA(e,a,b^c^d,w[j],k4);
				e=d; d=c; c=(b>>>2)|(b<<30); b=a; a=t; j++;
			}
			h0=add32(h0,a);
			h1=add32(h1,b);
			h2=add32(h2,c);
			h3=add32(h3,d);
			h4=add32(h4,e);
		}
		return [h0,h1,h2,h3,h4];
	}
})(jQuery);
