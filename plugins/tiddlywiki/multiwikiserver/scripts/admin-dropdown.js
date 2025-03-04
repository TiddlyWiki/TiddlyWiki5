/*\
title: $:/plugins/tiddlywiki/multiwikiserver/scripts/admin-dropdown.js
type: application/javascript

\*/

// @ts-check
(function () {
document.addEventListener("click", function (event) {
	/** @type {HTMLElement|null} */
	var dropdown = document.querySelector(".mws-admin-dropdown-content");
	/** @type {HTMLElement|null} */
	var dropbtn = document.querySelector(".mws-admin-dropbtn");
	// Ensure event.target is an Element
	if (!(event.target instanceof Element) || !event.target.matches(".mws-admin-dropbtn")) {
		if(dropdown.style.display === "block") {
			dropdown.style.display = "none";
		}
	} else {
		dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
	}
});
})();