//--
//-- Deprecated Crypto functions and associated conversion routines.
//-- Use the jQuery.encoding functions directly instead.
//--

// Crypto 'namespace'
function Crypto() {}

// Convert a string to an array of big-endian 32-bit words
Crypto.strToBe32s = function(str)
{
	return jQuery.encoding.strToBe32s(str);
};

// Convert an array of big-endian 32-bit words to a string
Crypto.be32sToStr = function(be)
{
	return jQuery.encoding.be32sToStr(be);
};

// Convert an array of big-endian 32-bit words to a hex string
Crypto.be32sToHex = function(be)
{
	return jQuery.encoding.be32sToHex(be);
};

// Return, in hex, the SHA-1 hash of a string
Crypto.hexSha1Str = function(str)
{
	return jQuery.encoding.digests.hexSha1Str(str);
};

// Return the SHA-1 hash of a string
Crypto.sha1Str = function(str)
{
	return jQuery.encoding.digests.sha1Str(str);
};

// Calculate the SHA-1 hash of an array of blen bytes of big-endian 32-bit words
Crypto.sha1 = function(x,blen)
{
	return jQuery.encoding.digests.sha1(x,blen);
};

