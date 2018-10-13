#!/usr/bin/env node

/*
A socket server that listens on a host/port for connections and reverses the order of incoming text

	reverser.js <port> <host>

This utility is provided as an example of using an external task that doesn't have any prior knowledge of
TiddlyWiki. Like many Unix utilities, it just reads and writes to a socket.

*/

var net = require("net"),
	port = parseInt(process.argv[2] || "",10) || 8081, // Port
	host = process.argv[3] || "127.0.0.1"; // Host

var server = net.createServer({
	allowHalfOpen: true
});

server.listen(port,host);

server.on("connection", function(sock) {
	console.log("CONNECTED: " + sock.remoteAddress +":"+ sock.remotePort);
	// Trap errors
	sock.on("error",function(e) {
		console.log("ERROR: " + e);
	});
	// Read data until the end
	var chunks = [];
	sock.on("data",function(data) {
		console.log("DATA " + sock.remoteAddress + ": " + data);
		chunks.push(data.toString());
	});
	sock.on("end",function() {
		console.log("END")
		// Write the data back to the socket
		sock.write(reverse(chunks.join("")));
		sock.end();		
	});
	sock.on("close", function(data) {
		console.log("CLOSED: " + sock.remoteAddress +" "+ sock.remotePort);
	});
});

function reverse(str) {
	return str.split("").reverse().join("");
}

