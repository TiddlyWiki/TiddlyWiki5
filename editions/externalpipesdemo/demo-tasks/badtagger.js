#!/usr/bin/env node

/*
A socket server that listens on a host/port for connections and suggests tags for the incoming text

	badtagger.js <port> <host>

This utility is provided as an example of using an external task that doesn't have any prior knowledge of
TiddlyWiki. Like many Unix utilities, it just reads and writes to a socket.

*/

var net = require("net"),
	port = parseInt(process.argv[2] || "",10) || 8081, // Port
	host = process.argv[3] || "127.0.0.1"; // Host

var server = net.createServer();

server.listen(port,host);

server.on("connection", function(sock) {
	console.log("CONNECTED: " + sock.remoteAddress +":"+ sock.remotePort);
	// Trap errors
	sock.on("error",function(e) {
		console.log("ERROR: " + e);
	});
	// Read data until the end
	var accumulator = Buffer.alloc(0);
	sock.on("data",function(data) {
		console.log("DATA " + sock.remoteAddress + ": " + data.length);
		accumulator = Buffer.concat([accumulator,Buffer.from(data)]);
		while(accumulator.length > 4) {
			var length = accumulator.readInt32BE(0);
			if(accumulator.length >= (length + 4)) {
				if(length < 1) {
					throw "ERROR: Incoming message length field is less than 1";
				}
				var type = accumulator.readUInt8(4),
					dataLength = length - 1,
					data = accumulator.toString("latin1",5,dataLength + 5);
				accumulator = accumulator.slice(length + 4);
				// Recase it
console.log("MESSAGE",length,type);
				var suggestedTags = Buffer.from(suggestTags(data),"latin1");
				// Send it back
				var lengthBytes = Buffer.alloc(4);
				lengthBytes.writeUInt32BE(suggestedTags.length + 1,0)
console.log("RESPONSE",1,suggestedTags.length)
				sock.write(lengthBytes);
				var typeByte = Buffer.alloc(1);
				typeByte.writeUInt8(1,0);
				sock.write(typeByte);
				sock.write(suggestedTags);
			} else {
				break;
			}
		}
	});
	sock.on("end",function() {
		console.log("END")
		sock.end();		
	});
	sock.on("close", function(data) {
		console.log("CLOSED: " + sock.remoteAddress +" "+ sock.remotePort);
	});
});

function suggestTags(str) {
	var tags = [];
	if(/e/mi.test(str)) {
		tags.push("elephant");		
	}
	if(/s/mi.test(str)) {
		tags.push("snake");		
	}
	if(/c/mi.test(str)) {
		tags.push("cow");
	}
	return tags.join("\n");
}
