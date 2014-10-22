#!/usr/bin/env node

/*
This is invoked as a shell script by NPM when the `tiddlywiki` command is typed
*/

var idx,
	$tw = require("./boot/boot.js").TiddlyWiki();

console.log("argv", process.argv);

// if the command is --npmserve and the environment variable is not set, ignore the command
// and pass it to tiddlywiki.js. It will show a help text.
// Since the TW --serve command expects parameters at special positions every element has to be touched :/
// TODO: fix this
if (process.argv[2] == "--npmserve" && process.env.npm_package_config_serve_edition ) {
	idx = 2;
	// edition is always needed
	process.argv[idx++] = process.env.npm_package_config_serve_edition;

	// verbose check
	if (process.env.npm_package_config_verbose == "--verbose") process.argv[idx++] = process.env.npm_package_config_verbose;
	
	// parameters for the server command
	process.argv[idx++] = process.env.npm_package_config_serve_command;
	process.argv[idx++] = process.env.npm_package_config_serve_port;
	process.argv[idx++] = process.env.npm_package_config_serve_roottiddler;
	process.argv[idx++] = process.env.npm_package_config_serve_rendertype;
	process.argv[idx++] = process.env.npm_package_config_serve_servetype;
	process.argv[idx++] = process.env.npm_package_config_serve_username;
	process.argv[idx++] = process.env.npm_package_config_serve_userpw;
	process.argv[idx++] = process.env.npm_package_config_serve_host;
	process.argv[idx++] = process.env.npm_package_config_serve_pathprefix;
}

if (process.argv[2] == "--npmbuild" && process.env.npm_package_config_serve_edition ) {
	idx = 2;
	process.argv[idx++] = process.env.npm_package_config_build_edition;

	// verbose check
	if (process.env.npm_package_config_verbose == "--verbose") process.argv[idx++] = process.env.npm_package_config_verbose;

	// output is hardcoded because with the TW default behaviour is hard to find.
	// If users RTFM they'll find out, what needs to be done to change it. 
	process.argv[idx++] = process.env.npm_package_config_build_output_command;
	process.argv[idx++] = process.env.npm_package_config_build_output_dir;

	// default is build all, if no element is defined. 
	process.argv[idx++] = process.env.npm_package_config_build_command;
	if (process.env.npm_package_config_build_element) {
		process.argv[idx++] = process.env.npm_package_config_build_element;
	}
}

if (process.env.npm_package_config_verbose == "--verbose") console.log("Parameters used:\n", process.argv, "\n");

// Pass the command line arguments to the boot kernel
$tw.boot.argv = Array.prototype.slice.call(process.argv,2);

// Boot the TW5 app
$tw.boot.boot();
