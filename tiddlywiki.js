#!/usr/bin/env node

/*
This is invoked as a shell script by NPM when the `tiddlywiki` command is typed
*/

var idx,
	$tw = require("./boot/boot.js").TiddlyWiki();

// console.log("Command used:\n", process.argv, "\n");

// if the command is --npm_serve and the environment variable is not set, ignore the command
// and pass it to tiddlywiki.js. It will show a help text.
// Since the TW --serve command expects parameters at special positions every element has to be touched :/
// TODO: fix this
if (process.argv[2] == "--npmserve" && process.env.npm_package_config_serve_edition ) {
	idx = 2;
	process.argv[idx++] = process.env.npm_package_config_serve_edition;
	if (process.env.npm_package_config_verbose == "--verbose") process.argv[idx++] = process.env.npm_package_config_verbose;
	process.argv[idx++] = "--server";
	process.argv[idx++] = process.env.npm_package_config_serve_port;
	process.argv[idx++] = "";
	process.argv[idx++] = "";
	process.argv[idx++] = "";
	process.argv[idx++] = "";
	process.argv[idx++] = "";
	process.argv[idx++] = process.env.npm_package_config_serve_host;
}

if (process.argv[2] == "--npmbuild" && process.env.npm_package_config_serve_edition ) {
	idx = 2;
	process.argv[idx++] = process.env.npm_package_config_build_edition;

	// output is hardcoded because with the TW default behaviour is hard to find.
	// If users RTFM they'll find out, what needs to be done to change it. 
	process.argv[idx++] = "--output";
	process.argv[idx++] = "output";

	// default is build all, if no element is defined. 
	process.argv[idx++] = "--build";
	if (process.env.npm_package_config_build_element) {
		process.argv[idx++] = process.env.npm_package_config_build_element;
	}
}

if (process.env.npm_package_config_verbose == "--verbose") console.log("Command used:\n", process.argv, "\n");

// Pass the command line arguments to the boot kernel
$tw.boot.argv = Array.prototype.slice.call(process.argv,2);

// Boot the TW5 app
$tw.boot.boot();
