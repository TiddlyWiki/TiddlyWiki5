// From https://gist.github.com/Nijikokun/5192472
//
// UTF8 Module
//
// Cleaner and modularized utf-8 encoding and decoding library for javascript.
//
// copyright: MIT
// author: Nijiko Yonskai, @nijikokun, nijikokun@gmail.com
(function (name, definition, context, dependencies) {
  if (typeof context['module'] !== 'undefined' && context['module']['exports']) { if (dependencies && context['require']) { for (var i = 0; i < dependencies.length; i++) context[dependencies[i]] = context['require'](dependencies[i]); } context['module']['exports'] = definition.apply(context); }
  else if (typeof context['define'] !== 'undefined' && context['define'] === 'function' && context['define']['amd']) { define(name, (dependencies || []), definition); }
  else { context[name] = definition.apply(context); }
})('utf8', function () {
  return {
    encode: function (string) {
      if (typeof string !== 'string') return string;
      else string = string.replace(/\r\n/g, "\n");
      var output = "", i = 0, charCode;

      for (i; i < string.length; i++) {
        charCode = string.charCodeAt(i);

        if (charCode < 128)
          output += String.fromCharCode(charCode);
        else if ((charCode > 127) && (charCode < 2048))
          output += String.fromCharCode((charCode >> 6) | 192),
          output += String.fromCharCode((charCode & 63) | 128);
        else
          output += String.fromCharCode((charCode >> 12) | 224),
          output += String.fromCharCode(((charCode >> 6) & 63) | 128),
          output += String.fromCharCode((charCode & 63) | 128);
      }

      return output;
    },

    decode: function (string) {
      if (typeof string !== 'string') return string;
      var output = "", i = 0, charCode = 0;

      while (i < string.length) {
        charCode = string.charCodeAt(i);

        if (charCode < 128)
          output += String.fromCharCode(charCode),
          i++;
        else if ((charCode > 191) && (charCode < 224))
          output += String.fromCharCode(((charCode & 31) << 6) | (string.charCodeAt(i + 1) & 63)),
          i += 2;
        else
          output += String.fromCharCode(((charCode & 15) << 12) | ((string.charCodeAt(i + 1) & 63) << 6) | (string.charCodeAt(i + 2) & 63)),
          i += 3;
      }

      return output;
    }
  };
}, this);

// Base64 Module
//
// Cleaner, modularized and properly scoped base64 encoding and decoding module for strings.
//
// copyright: MIT
// author: Nijiko Yonskai, @nijikokun, nijikokun@gmail.com
(function (name, definition, context, dependencies) {
  if (typeof context['module'] !== 'undefined' && context['module']['exports']) { if (dependencies && context['require']) { for (var i = 0; i < dependencies.length; i++) context[dependencies[i]] = context['require'](dependencies[i]); } context['module']['exports'] = definition.apply(context); }
  else if (typeof context['define'] !== 'undefined' && context['define'] === 'function' && context['define']['amd']) { define(name, (dependencies || []), definition); }
  else { context[name] = definition.apply(context); }
})('base64', function (utf8) {
  var $this = this;
  var $utf8 = utf8 || this.utf8;
  var map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  return {
    encode: function (input) {
      if (typeof $utf8 === 'undefined') throw { error: "MissingMethod", message: "UTF8 Module is missing." };
      if (typeof input !== 'string') return input;
      else input = $utf8.encode(input);
      var output = "", a, b, c, d, e, f, g, i = 0;

      while (i < input.length) {
        a = input.charCodeAt(i++);
        b = input.charCodeAt(i++);
        c = input.charCodeAt(i++);
        d = a >> 2;
        e = ((a & 3) << 4) | (b >> 4);
        f = ((b & 15) << 2) | (c >> 6);
        g = c & 63;

        if (isNaN(b)) f = g = 64;
        else if (isNaN(c)) g = 64;

        output += map.charAt(d) + map.charAt(e) + map.charAt(f) + map.charAt(g);
      }

      return output;
    },

    decode: function (input) {
      if (typeof $utf8 === 'undefined') throw { error: "MissingMethod", message: "UTF8 Module is missing." };
      if (typeof input !== 'string') return input;
      else input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
      var output = "", a, b, c, d, e, f, g, i = 0;

      while (i < input.length) {
        d = map.indexOf(input.charAt(i++));
        e = map.indexOf(input.charAt(i++));
        f = map.indexOf(input.charAt(i++));
        g = map.indexOf(input.charAt(i++));

        a = (d << 2) | (e >> 4);
        b = ((e & 15) << 4) | (f >> 2);
        c = ((f & 3) << 6) | g;

        output += String.fromCharCode(a);
        if (f != 64) output += String.fromCharCode(b);
        if (g != 64) output += String.fromCharCode(c);
      }

      return $utf8.decode(output);
    }
  }
}, this, [ "utf8" ]);