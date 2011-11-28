/*
Various static utility functions.

This file is a bit of a dumping ground; the expectation is that most of these functions will be refactored.
*/

var utils = exports;

// Pad a string to a certain length with zeros
utils.zeroPad = function(n,d)
{
	var s = n.toString();
	if(s.length < d)
		s = "000000000000000000000000000".substr(0,d-s.length) + s;
	return s;
};

// Convert a date to local YYYYMMDDHHMM string format
utils.convertToLocalYYYYMMDDHHMM = function(date)
{
	return date.getFullYear() + utils.zeroPad(date.getMonth()+1,2) + utils.zeroPad(date.getDate(),2) + utils.zeroPad(date.getHours(),2) + utils.zeroPad(date.getMinutes(),2);
};

// Convert a date to UTC YYYYMMDDHHMM string format
utils.convertToYYYYMMDDHHMM = function(date)
{
	return date.getUTCFullYear() + utils.zeroPad(date.getUTCMonth()+1,2) + utils.zeroPad(date.getUTCDate(),2) + utils.zeroPad(date.getUTCHours(),2) + utils.zeroPad(date.getUTCMinutes(),2);
};

// Convert a date to UTC YYYYMMDD.HHMMSSMMM string format
utils.convertToYYYYMMDDHHMMSSMMM = function(date)
{
	return date.getUTCFullYear() + utils.zeroPad(date.getUTCMonth()+1,2) + utils.zeroPad(date.getUTCDate(),2) + "." + utils.zeroPad(date.getUTCHours(),2) + utils.zeroPad(date.getUTCMinutes(),2) + utils.zeroPad(date.getUTCSeconds(),2) + utils.zeroPad(date.getUTCMilliseconds(),3) +"0";
};

// Create a date from a UTC YYYYMMDDHHMM format string
utils.convertFromYYYYMMDDHHMM = function(d)
{
	d = d?d.replace(/[^0-9]/g, ""):"";
	return utils.convertFromYYYYMMDDHHMMSSMMM(d.substr(0,12));
};

// Create a date from a UTC YYYYMMDDHHMMSS format string
utils.convertFromYYYYMMDDHHMMSS = function(d)
{
	d = d?d.replace(/[^0-9]/g, ""):"";
	return utils.convertFromYYYYMMDDHHMMSSMMM(d.substr(0,14));
};

// Create a date from a UTC YYYYMMDDHHMMSSMMM format string
utils.convertFromYYYYMMDDHHMMSSMMM = function(d)
{
	d = d ? d.replace(/[^0-9]/g, "") : "";
	return new Date(Date.UTC(parseInt(d.substr(0,4),10),
			parseInt(d.substr(4,2),10)-1,
			parseInt(d.substr(6,2),10),
			parseInt(d.substr(8,2)||"00",10),
			parseInt(d.substr(10,2)||"00",10),
			parseInt(d.substr(12,2)||"00",10),
			parseInt(d.substr(14,3)||"000",10)));
};

// Convert & to "&amp;", < to "&lt;", > to "&gt;" and " to "&quot;"
utils.htmlEncode = function(s)
{
	return s.replace(/&/mg,"&amp;").replace(/</mg,"&lt;").replace(/>/mg,"&gt;").replace(/\"/mg,"&quot;");
};

// Convert "&amp;" to &, "&lt;" to <, "&gt;" to > and "&quot;" to "
utils.htmlDecode = function(s)
{
	return s.replace(/&lt;/mg,"<").replace(/&gt;/mg,">").replace(/&quot;/mg,"\"").replace(/&amp;/mg,"&");
};

// Adapted from async.js, https://github.com/caolan/async
// Creates a queue of tasks for an asyncronous worker function with a specified maximum number of concurrent operations.
// 	q = utils.queue(function(taskData,callback) {
//		fs.readFile(taskData.filename,"uft8",function(err,data) {
//			callback(err,data);
//		});
//  });
// 	q.push(taskData,callback) is used to queue a new task
utils.queue = function(worker, concurrency) {
    var workers = 0;
    var q = {
        tasks: [],
        concurrency: concurrency,
        push: function (data, callback) {
            q.tasks.push({data: data, callback: callback});
            process.nextTick(q.process);
        },
        process: function () {
            if (workers < q.concurrency && q.tasks.length) {
                var task = q.tasks.shift();
                workers += 1;
                worker(task.data, function () {
                    workers -= 1;
                    if (task.callback) {
                        task.callback.apply(task, arguments);
                    }
                    q.process();
                });
            }
        },
        length: function () {
            return q.tasks.length;
        },
        running: function () {
            return workers;
        }
    };
    return q;
};
