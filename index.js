/* dependencies */
	const http = require("http");
	const path = require("path");
	const fs = require("fs");
	const qs = require("querystring");

/* server stuff */
	const port = 3000;
	const server = http.createServer(requestHandler);

	server.listen(port, function (error) {
		if (error) {
			console.log("server error: " + error);
		}
		else {
			console.log("listening on port: " + port);
		}
	});

/* logic */
	const processes = require("./logic/processes.js");
	const game = require("./logic/game.js");

/* routing */
	function requestHandler(request, response) {
		try {
			if (request.url !== "/favicon.ico") {
				console.log(request.method + " request to " + request.url);
			}

			var body = "";
			request.on("data", function (data) { //build the post data...
				body += data;
			});

			request.on("end", function () {
				var post = qs.parse(body) || null; //...then parse it

				switch (true) {
					case (/\/stylesheet.css/).test(request.url): //master stylesheet
						fs.readFile(__dirname + "/assets/stylesheet.css", function (error, css) {
							if (error) {
								console.log(error);
							}
							else {
								response.writeHead(200, {"Content-Type": "text/css"});
								response.end(css);
							}
						});
					break;

					case (/\/script.js/).test(request.url): //front-end javascript
						fs.readFile(__dirname + "/assets/script.js", function (error, js) {
							if (error) {
								console.log(error);
							}
							else {
								response.writeHead(200, {"Content-Type": "text/javascript"});
								response.end(js);
							}
						});
					break;

					case (/^\/$/).test(request.url): //index page
						if ((typeof post.start !== "undefined") && (post.name.length > 0)) {
							var data = game.newGame(post.name);
							processes.store("games", null, data, then);
							function then(data) {
								response.writeHead(302, {Location: "./game/" + data.id + "/1"});
								response.end();
							};
						}
						else if ((typeof post.join !== "undefined") && (post.name.length > 0) && (post.game_id.length > 0)) {
							processes.retrieve("games", {id: post.game_id}, then_1);
							function then_1(data) {
								var data = game.joinGame(data, post.name);
								if (data.id === false) {
									response.writeHead(200, {"Content-Type": "text/html"});
									response.end(processes.render("./views/index.html",data));
								}
								else {
									processes.store("games", {id: data.id}, data, then_2);
								}
							}
							function then_2(data) {
								response.writeHead(302, {Location: "./game/" + data.id + "/2"});
								response.end();
							};
						}
						else {
							response.writeHead(200, {"Content-Type": "text/html"});
							response.end(processes.render("./views/index.html",data));
						}
					break;

					case (/^\/game\/[A-Za-z0-9]{16}\/(0|1|2)$/).test(request.url): //games pages
						var game_id = String(request.url).substring(request.url.indexOf("/game/") + 6).split("/")[0];
						processes.retrieve("games", {id: game_id}, then);
						function then(data) {
							data.viewer = String(request.url).substring(request.url.indexOf("/game/") + 6).split("/")[1];
							response.writeHead(200, {"Content-Type": "text/html"});
							response.end(processes.render("./views/game.html",data));
						}
					break;

					case (/\/ajax\/game$/).test(request.url) && (request.method === "POST"): //ajax requests
						processes.retrieve("games", {id: post.game_id}, then_1);
						function then_1(data) {
							if (typeof post.player !== "undefined") {
								data = game.makeMove(data, post.player, {x: post["piece[x]"], y: post["piece[y]"]}, {x: post["target[x]"], y: post["target[y]"]});
								processes.store("games", {id: post.game_id}, data, then_2);
							}
							else {
								then_2(data);
							}
						}
						function then_2(data) {
							response.writeHead(200, {"Content-Type": "text/json"});
							response.end(JSON.stringify(data));
						}
					break;

					default: //all others --> 404
						response.writeHead(404, {"Content-Type": "text/plain"});
						response.end("404: File not found.");
					break;
				}	
			});
		}
		catch (error) {
			console.log("request/response error: " + error);
		}
	}