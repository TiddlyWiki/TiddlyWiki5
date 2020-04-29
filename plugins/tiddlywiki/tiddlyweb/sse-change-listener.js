const { ServerSentEvents } = require("$:/core/modules/server/server-sent-events.js");
/** @type {Record<any, {
 *   request: import("http").IncomingMessage, 
 *   state, 
 *   emit: (event: string, data: string) => void, 
 *   end: () => void
 * }[]>} */
const wikis = {};
function setupWiki(wiki) {
  wikis[state.wiki] = [];
  state.wiki.addEventListener("change", (changes) => {
    wikis[state.wiki].forEach(({ request, state, emit, end }) => {
      emit("change", JSON.stringify(changes));
    });
  });
}
const events = new ServerSentEvents("test", (request, state, emit, end) => {
  if (!wikis[state.wiki]) setupWiki(state.wiki);
  wikis[state.wiki].push({ request, state, emit, end });
});
module.exports = events.getExports();
