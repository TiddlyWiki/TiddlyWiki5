function stringifyList(value) {
	if(Array.isArray(value)) {
		var result = new Array(value.length);
		for(var t=0, l=value.length; t<l; t++) {
			var entry = value[t] || "";
			if(entry.match(/[^\S\xA0]/mg)) {
				result[t] = "[[" + entry + "]]";
			} else {
				result[t] = entry;
			}
		}
		return result.join(" ");
	} else {
		return value || "";
	}
};

const tiddlers=[];
const questions = [];
const siteIconByUsername = {};
for(const child of document.querySelector("#tiddlerDisplay").childNodes) {
	const titlePrefix = "2010 - ";
	const title = child.getAttribute("tiddler");
	if(title !== "HelloThere") {
		questions.push(titlePrefix + title);
		const childTitles = [];
		const children = title === "What do you think of the name TiddlyWiki and the term \"tiddler\"?" ? child.querySelectorAll("div.content > div.viewer > div.resultsArea > ul > li") : child.querySelectorAll("div.resultsArea > ul > li");
		for(const answer of children) {
			const siteIconName = answer.querySelector(".siteIcon img").src.split("/").pop();
			const username = answer.innerText.split("\n\n")[0].split(" ")[1];
			const answerDate = new Date(answer.innerText.split("\n\n")[0].split(" on ")[1]);
			const answerHTML = answer.querySelector("blockquote").innerHTML;
			const childTitle = titlePrefix + title + " - " + username + " - " + answerDate.toISOString();
			// console.log(`${username} has site icon ${siteIconName}`);
			siteIconByUsername[username] = siteIconName;
			childTitles.push(childTitle);
			tiddlers.push({
				title: childTitle,
				text: answerHTML,
				icon: `$:/avatars/${username}`,
				modifier: username,
				modified: answerDate.toISOString().slice(0, 10).replace(/-/g, '') + "000000000",
				tags: stringifyList([titlePrefix + title,"2010 - Interview Answer"])
			});
		}
		tiddlers.push({
			title: titlePrefix + title,
			list: stringifyList(childTitles.reverse()),
			tags: "[[2010 - Interview Question]]"
		});
	}
}
tiddlers.push({
	title: "2010 - Interview Question",
	list: stringifyList(questions)
})
copy(JSON.stringify(tiddlers,null,4));

const commands = [
	"mkdir -p ./editions/tiddlywiki-surveys/tiddlers/2010-great-interview-project/images/"
];
for(const username in siteIconByUsername) {

	commands.push(`cp './editions/tiddlywiki-surveys/great-interview-project-2010/The great TiddlyWiki interview project_files/${siteIconByUsername[username]}' './editions/tiddlywiki-surveys/tiddlers/2010-great-interview-project/images/${username}.jpg'`);
const metafile = `title: $:/avatars/${username}
type: image/jpeg
tags: $:/tags/Avatar
modifier: ${username}
`;

commands.push(`echo "${metafile}" > './editions/tiddlywiki-surveys/tiddlers/2010-great-interview-project/images/${username}.jpg.meta'`);
}
console.log(commands.join(" && "));