jQuery(document).ready(function(){

	module("Crypto");

	test("SHA-1 functions", function() {
		var actual = jQuery.encoding.digests.hexSha1Str("").toLowerCase();
		var expected = "da39a3ee5e6b4b0d3255bfef95601890afd80709";
		same(actual,expected,'SHA-1 hash of empty string should be correct');

		actual = jQuery.encoding.digests.hexSha1Str("The quick brown fox jumps over the lazy dog").toLowerCase();
		expected = "2fd4e1c67a2d28fced849ee1bb76e7391b93eb12";
		same(actual,expected,'SHA-1 hash of test vector 1 should be correct');

		actual = jQuery.encoding.digests.hexSha1Str("abc").toLowerCase();
		expected = "a9993e364706816aba3e25717850c26c9cd0d89d";
		same(actual,expected,'SHA-1 hash of test vector 2 should be correct');

		actual = jQuery.encoding.digests.hexSha1Str("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq");
		expected = "84983E441C3BD26EBAAE4AA1F95129E5E54670F1";
		same(actual,expected,'SHA-1 hash of test vector 3 should be correct');

		actual = jQuery.encoding.digests.hexSha1Str("12345678901234567890123456789012345678901234567890123456789012345678901234567890");
		expected = "50ABF5706A150990A08B2C5EA40FA0E585554732";
		same(actual,expected,'SHA-1 hash of test vector 4 should be correct');
	});

});
