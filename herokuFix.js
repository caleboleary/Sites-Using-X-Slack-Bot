exports.fixit = function() {
	// fixing heroku sleep problem
		var handle, http, request, server, strobe;
		http = require('http');
		request = require('request');
		strobe = function() {
			return request('http://sites-using-bot.herokuapp.com/', function(e, r, b) {});
		};
		(function() {
			setInterval(strobe, 25 * 60 * 1000);
			return console.log("I am up!!");
		})();
		handle = function(req, res) {
			return res.end("42");
		};
		server = http.createServer(handle);
		server.listen(process.env.PORT || 5000);
	// fixing heroku sleep problem
};