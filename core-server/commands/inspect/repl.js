/*\
title: $:/core/modules/commands/inspect/repl.js
type: application/javascript
module-type: library

\*/

"use strict";

const repl = require("repl");
const util = require("util");
const{ createCompleter } = require("$:/core/modules/commands/inspect/completer.js");
const{ processOutput } = require("$:/core/modules/commands/inspect/output.js");
const{ colour, INITIAL_INSPECT_DEPTH, REPL_HISTORY_PATH } = require("$:/core/modules/commands/inspect/utils.js");

exports.startRepl = function(commandInstance) {
    let inspectDepth = INITIAL_INSPECT_DEPTH;

    function customWriter(output) {
        return util.inspect(processOutput(output), {
            colors: true,
            depth: inspectDepth
        });
    }

    const completer = createCompleter(commandInstance);

    const runtime = repl.start({
        prompt: commandInstance.params.length ? colour.txt(commandInstance.params[0],33,0,7,0) : colour.txt("$command: > ",33,0,7,0),
		useColors: true,
		ignoreUndefined: true,
		completer: completer,
		writer: customWriter
    });

	// Welcome message
	console.log("Type .help to list commands.\nAccess the TW variable space with '$tw.' \n");

    commandInstance.runtime = runtime;

    // REPL: Initialie History Setup
	runtime.setupHistory({
		filePath: REPL_HISTORY_PATH,
		size: 200,
		removeHistoryDuplicates: true
	}, err => {
		if(err) {
			console.error("Error setting up REPL history:", err);
		}
	});

	// REPL: Define .depth command
	runtime.defineCommand("depth", {
		help: "Set inspection depth. Usage: .depth <number>",
		action(input) {
			const newDepth = parseInt(input, 10);
			if(isNaN(newDepth)) {
				this.output.write("Invalid depth. Please provide a number.\n");
			} else {
				inspectDepth = newDepth;
				this.output.write(`Inspection depth set to ${inspectDepth}.\n`);
			}
			this.displayPrompt();
		}
	});

	// REPL: Define .history command
	runtime.defineCommand("history", {
		help: "Use '.history' or '.history path'",
		action(input) {
			const trimmed = input.trim().toLowerCase();

			if(trimmed === "info") {
				this.output.write(`History file can be found at: ${REPL_HISTORY_PATH}\n`);
				this.displayPrompt();
			} else {
				// Default behavior: list history
				const filteredHistory = [];
				const seenCommands = new Set();

				if(this.history) {
					for(const cmd of this.history) {
						const trimmedCmd = cmd.trim();
						if(trimmedCmd.length >= 3 && !seenCommands.has(trimmedCmd)) {
							filteredHistory.push(trimmedCmd);
							seenCommands.add(trimmedCmd);
						}
					}
				}

				if(filteredHistory.length > 0) {
					filteredHistory.forEach((cmd, index) => {
						console.log(`[${index + 1}] - ${cmd}`);
					});
				} else {
					console.log("No history available.");
				}
				this.displayPrompt(); // Show the prompt again after listing history
			}
		}
	});

	// REPL: On reset, restore $tw in the context
	runtime.on("reset", function() {
		runtime.context.$tw = $tw;
	});

	runtime.context.$tw = $tw;

    return runtime;
}
