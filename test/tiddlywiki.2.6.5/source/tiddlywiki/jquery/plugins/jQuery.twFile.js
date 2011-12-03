/*
jQuery.twFile.js

jQuery plugin for loading a file and saving data to a file

Copyright (c) UnaMesa Association 2009

Triple licensed under the BSD, MIT and GPL licenses:
  http://www.opensource.org/licenses/bsd-license.php
  http://www.opensource.org/licenses/mit-license.php
  http://www.gnu.org/licenses/gpl.html
*/


(function($) {
	if(!$.twFile) {
		$.twFile = {};
	}

	$.extend($.twFile,{
		currentDriver: null,
		driverList: ["tiddlySaver", "activeX","javaLiveConnect", "mozilla"],

		// Loads the contents of a text file from the local file system
		// filePath is the path to the file in these formats:
		//    x:\path\path\path\filename - PC local file
		//    \\server\share\path\path\path\filename - PC network file
		//    /path/path/path/filename - Mac/Unix local file
		// returns the text of the file, or null if the operation cannot be performed or false if there was an error
		load: function(filePath) {
			var d = this.getDriver();
			return d ? d.loadFile(filePath) : null;
		},
		// Saves a string to a text file on the local file system
		// filePath is the path to the file in the format described above
		// content is the string to save
		// returns true if the file was saved successfully, or null if the operation cannot be performed or false if there was an error
		save: function(filePath,content) {
			var d = this.getDriver();
			return d ? d.saveFile(filePath,content) : null;
		},
		// Copies a file on the local file system
		// dest is the path to the destination file in the format described above
		// source is the path to the source file in the format described above
		// returns true if the file was copied successfully, or null if the operation cannot be performed or false if there was an error
		copy: function(dest,source) {
			var d = this.getDriver();
			if(d && d.copyFile)
				return d.copyFile(dest,source);
			else
				return null;
		},
		// Converts a local file path from the format returned by document.location into the format expected by this plugin
		// url is the original URL of the file
		// returns the equivalent local file path
		convertUriToLocalPath: function (url) {
			// Remove any location or query part of the URL
			var originalPath = url.split("#")[0].split("?")[0];
			// Convert file://localhost/ to file:///
			if(originalPath.indexOf("file://localhost/") == 0)
				originalPath = "file://" + originalPath.substr(16);
			// Convert to a native file format
			//# "file:///x:/path/path/path..." - pc local file --> "x:\path\path\path..."
			//# "file://///server/share/path/path/path..." - FireFox pc network file --> "\\server\share\path\path\path..."
			//# "file:///path/path/path..." - mac/unix local file --> "/path/path/path..."
			//# "file://server/share/path/path/path..." - pc network file --> "\\server\share\path\path\path..."
			var localPath;
			if(originalPath.charAt(9) == ":") // PC local file
				localPath = unescape(originalPath.substr(8)).replace(new RegExp("/","g"),"\\");
			else if(originalPath.indexOf("file://///") == 0) // Firefox PC network file
				localPath = "\\\\" + unescape(originalPath.substr(10)).replace(new RegExp("/","g"),"\\");
			else if(originalPath.indexOf("file:///") == 0) // Mac/UNIX local file
				localPath = unescape(originalPath.substr(7));
			else if(originalPath.indexOf("file:/") == 0) // Mac/UNIX local file
				localPath = unescape(originalPath.substr(5));
			else if(originalPath.indexOf("//") == 0) // PC network file
				localPath = "\\\\" + unescape(originalPath.substr(7)).replace(new RegExp("/","g"),"\\");
			return localPath || originalPath;
		},

		// Deferred initialization for any drivers that need it
		// returns a Deferred object so callback that executes as soon
		// as twFile is ready can be attached
		initialize: function() {
			return $.Deferred(function(dfd) {
				for(var t in drivers) {
					if(drivers[t].deferredInit)
						drivers[t].deferredInit();
				}
				// Kludge: give the <applet> some time to load
				setTimeout(dfd.resolve, 0);
			});
		},

		// Private functions

		// Returns a reference to the current driver
		getDriver: function() {
			if(this.currentDriver === null) {
				for(var t=0; t<this.driverList.length; t++) {
					if(this.currentDriver === null && drivers[this.driverList[t]].isAvailable && drivers[this.driverList[t]].isAvailable())
						this.currentDriver = drivers[this.driverList[t]];
				}
			}
			return this.currentDriver;
		}
	});

	// Automatically initialize on document.ready()
	$(function() {
		$.twFile.initialize();
	});

	// Private driver implementations for each browser

	var drivers = {};

	// Internet Explorer driver

	drivers.activeX = {
		name: "activeX",
		isAvailable: function() {
			try {
				var fso = new ActiveXObject("Scripting.FileSystemObject");
			} catch(ex) {
				return false;
			}
			return true;
		},
		loadFile: function(filePath) {
			// Returns null if it can't do it, false if there's an error, or a string of the content if successful
			try {
				var fso = new ActiveXObject("Scripting.FileSystemObject");
				var file = fso.OpenTextFile(filePath,1);
				var content = file.ReadAll();
				file.Close();
			} catch(ex) {
				//# alert("Exception while attempting to load\n\n" + ex.toString());
				return null;
			}
			return content;
		},
		createPath: function(path) {
			//# Remove the filename, if present. Use trailing slash (i.e. "foo\bar\") if no filename.
			var pos = path.lastIndexOf("\\");
			if(pos!=-1)
				path = path.substring(0,pos+1);
			//# Walk up the path until we find a folder that exists
			var scan = [path];
			try {
				var fso = new ActiveXObject("Scripting.FileSystemObject");
				var parent = fso.GetParentFolderName(path);
				while(parent && !fso.FolderExists(parent)) {
					scan.push(parent);
					parent = fso.GetParentFolderName(parent);
				}
				//# Walk back down the path, creating folders
				for(i=scan.length-1;i>=0;i--) {
					if(!fso.FolderExists(scan[i])) {
						fso.CreateFolder(scan[i]);
					}
				}
				return true;
			} catch(ex) {
			}
			return false;
		},
		copyFile: function(dest,source) {
			drivers.activeX.createPath(dest);
			try {
				var fso = new ActiveXObject("Scripting.FileSystemObject");
				fso.GetFile(source).Copy(dest);
			} catch(ex) {
				return false;
			}
			return true;
		},
		saveFile: function(filePath,content) {
			// Returns null if it can't do it, false if there's an error, true if it saved OK
			drivers.activeX.createPath(filePath);
			try {
				var fso = new ActiveXObject("Scripting.FileSystemObject");
				var file = fso.OpenTextFile(filePath,2,-1,0);
				file.Write(content);
				file.Close();
			} catch (ex) {
				return null;
			}
			return true;
		}
	};

	// Mozilla driver

	drivers.mozilla = {
		name: "mozilla",
		isAvailable: function() {
			return !!window.Components;
		},
		loadFile: function(filePath) {
			// Returns null if it can't do it, false if there's an error, or a string of the content if successful
			if(window.Components) {
				try {
					netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
					var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
					file.initWithPath(filePath);
					if(!file.exists())
						return null;
					var inputStream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
					inputStream.init(file,0x01,00004,null);
					var sInputStream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
					sInputStream.init(inputStream);
					var contents = sInputStream.read(sInputStream.available());
					sInputStream.close();
					inputStream.close();
					return contents;
				} catch(ex) {
					//# alert("Exception while attempting to load\n\n" + ex);
					return false;
				}
			}
			return null;
		},
		saveFile: function(filePath,content) {
			// Returns null if it can't do it, false if there's an error, true if it saved OK
			if(window.Components) {
				try {
					netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
					var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
					file.initWithPath(filePath);
					if(!file.exists())
						file.create(0,0664);
					var out = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
					out.init(file,0x20|0x02,00004,null);
					out.write(content,content.length);
					out.flush();
					out.close();
					return true;
				} catch(ex) {
					alert("Exception while attempting to save\n\n" + ex);
					return false;
				}
			}
			return null;
		}
	};

	// TiddlySaver driver

	drivers.tiddlySaver = {
		name: "tiddlySaver",
		deferredInit: function() {
			if(!document.applets["TiddlySaver"] && /* !$.browser.mozilla && !$.browser.msie && */ document.location.toString().substr(0,5) == "file:") {
				$(document.body).append("<applet style='position:absolute;left:-1px' name='TiddlySaver' code='TiddlySaver.class' archive='TiddlySaver.jar' width='1'height='1'></applet>");
			}
		},
		isAvailable: function() {
			var isReady = false;
			try {
				isReady = !!document.applets["TiddlySaver"] &&
						  ($.browser.msie || document.applets["TiddlySaver"].isActive) &&
						  ( document.applets["TiddlySaver"].isActive() );
			} catch (ex) {
				isReady = false;
			}
			return isReady;
		},
		loadFile: function(filePath) {
			var r;
			try {
				if(document.applets["TiddlySaver"]) {
					r = document.applets["TiddlySaver"].loadFile(javaUrlToFilename(filePath),"UTF-8");
					return (r === undefined || r === null) ? null : String(r);
				}
			} catch(ex) {
			}
			return null;
		},
		saveFile: function(filePath,content) {
			try {
				if(document.applets["TiddlySaver"])
					return document.applets["TiddlySaver"].saveFile(javaUrlToFilename(filePath),"UTF-8",content);
			} catch(ex) {
			}
			return null;
		}
	};

	// Java LiveConnect driver

	drivers.javaLiveConnect = {
		name: "javaLiveConnect",
		isAvailable: function() {
			return !!window.java && !!window.java.io && !!window.java.io.FileReader;
		},
		loadFile: function(filePath) {
			var r;
			var content = [];
			try {
				r = new java.io.BufferedReader(new java.io.FileReader(javaUrlToFilename(filePath)));
				var line;
				while((line = r.readLine()) != null)
					content.push(new String(line));
				r.close();
			} catch(ex) {
				return null;
			}
			return content.join("\n") + "\n";
		},
		saveFile: function(filePath,content) {
			try {
				var s = new java.io.PrintStream(new java.io.FileOutputStream(javaUrlToFilename(filePath)));
				s.print(content);
				s.close();
			} catch(ex) {
				return null;
			}
			return true;
		}
	};

	// Private utilities

	function javaUrlToFilename(url) {
		var f = "//localhost";
		if(url.indexOf(f) == 0)
				return url.substring(f.length);
		var i = url.indexOf(":");
		return i > 0 ? url.substring(i-1) : url;
	}

})(jQuery);

