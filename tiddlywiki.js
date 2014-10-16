#!/usr/bin/env node

/*
This is invoked as a shell script by NPM when the `tiddlywiki` command is typed
*/

var $tw = require("./boot/boot.js").TiddlyWiki();

// console.log("Command used:\n", process.argv, "\n");

// if the command is --npm_serve and the environment variable is not set, ignore the command
// and pass it to tiddlywiki.js. It will show a help text. 
if (process.argv[2] == "--npm_serve" && process.env.npm_package_config_serve_edition ) {

	process.argv[2] =	process.env.npm_package_config_serve_edition;
	process.argv[3] =	process.env.npm_package_config_serve_command;
	process.argv[4] =	process.env.npm_package_config_serve_port;
	process.argv[5] =	process.env.npm_package_config_serve_roottiddler;
	process.argv[6] =	process.env.npm_package_config_serve_rendertype;
	process.argv[7] =	process.env.npm_package_config_serve_servetype;
	process.argv[8] =	process.env.npm_package_config_serve_username;
	process.argv[9] =	process.env.npm_package_config_serve_userpw;
	process.argv[10] =	process.env.npm_package_config_serve_host;
	process.argv[11] =	process.env.npm_package_config_serve_pathprefix;
}

if (process.argv[2] == "--npm_build" && process.env.npm_package_config_serve_edition ) {
    var pe_output = process.env.npm_package_config_build_output_command,
        pe_element = process.env.npm_package_config_build_element,
        idx = 2;

    process.argv[idx++] = process.env.npm_package_config_build_edition;
    
	if (pe_output) process.argv[idx++] = process.env.npm_package_config_build_output_command;
	if (pe_output) process.argv[idx++] = process.env.npm_package_config_build_output_dir;

    process.argv[idx++] = process.env.npm_package_config_build_command;
	if (pe_element) process.argv[idx++] = process.env.npm_package_config_build_element;
}

if (process.env.npm_package_config_verbose == "--verbose") console.log("Command used:\n", process.argv, "\n");

// Pass the command line arguments to the boot kernel
$tw.boot.argv = Array.prototype.slice.call(process.argv,2);

// Boot the TW5 app
$tw.boot.boot();
