/*\
title: $:/plugins/tiddlywiki/multiwikiserver/scripts/admin-dropdown.js
type: application/javascript

\*/

(function () {
document.addEventListener("click", function (event) {
	var dropdown = document.querySelector(".mws-admin-dropdown-content");
	var dropbtn = document.querySelector(".mws-admin-dropbtn");
	if(!event.target.matches(".mws-admin-dropbtn")) {
		if(dropdown.style.display === "block") {
			dropdown.style.display = "none";
		}
	} else {
		dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
	}
});
})();