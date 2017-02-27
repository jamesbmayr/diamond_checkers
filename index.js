/* dependencies */
	const http = require("http");
	const path = require("path");
	const fs = require("fs");
	const qs = require("querystring");

/* server stuff */
	const port = 3000;
	const server = http.createServer(requestHandler);

	server.listen(process.env.PORT || 3000, function (error) {
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
				var routes = String(request.url).split("/");

				switch (true) {
					case (/\/icon.png$/).test(request.url): //icon
						fs.readFile(__dirname + "/assets/icon.png", function (error, image) {
							if (error) {
								console.log(error);
							}
							else {
								response.writeHead(200, {"Content-Type": "image/png"});
								response.end(image);
							}
						});
					break;

					case (/\/index_stylesheet.css$/).test(request.url): //index stylesheet
						fs.readFile(__dirname + "/assets/index_stylesheet.css", function (error, css) {
							if (error) {
								console.log(error);
							}
							else {
								response.writeHead(200, {"Content-Type": "text/css"});
								response.end(css);
							}
						});
					break;

					case (/\/game_stylesheet.css$/).test(request.url): //game stylesheet
						fs.readFile(__dirname + "/assets/game_stylesheet.css", function (error, css) {
							if (error) {
								console.log(error);
							}
							else {
								response.writeHead(200, {"Content-Type": "text/css"});
								response.end(css);
							}
						});
					break;

					case (/\/index_script.js$/).test(request.url): //index front-end javascript
						fs.readFile(__dirname + "/assets/index_script.js", function (error, js) {
							if (error) {
								console.log(error);
							}
							else {
								response.writeHead(200, {"Content-Type": "text/javascript"});
								response.end(js);
							}
						});
					break;

					case (/\/game_script.js$/).test(request.url): //game front-end javascript
						fs.readFile(__dirname + "/assets/game_script.js", function (error, js) {
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
						console.log(JSON.stringify(post));
						if ((typeof post.start !== "undefined") && ((typeof post.game_id === "undefined") || (post.game_id.length === 0))) {
							console.log("starting game...");
							var data = game.newGame("player_1");
							processes.store("games", null, data, then);
							function then(data) {
								if (data) {
									response.writeHead(302, {Location: "./" + data.id + "/1"});
									response.end();
								}
								else {
									response.writeHead(400, {"Content-Type": "text/plain"});
									response.end("400: Bad request.");
								}
							};
						}
						else if ((typeof post.start !== "undefined") && (typeof post.game_id !== "undefined") && (post.game_id.length > 0)) {
							console.log("joining game...");
							processes.retrieve("games", {id: post.game_id}, then_1);
							function then_1(data) {
								var data = game.joinGame(data,"player_2");
								if (data.id === false) {
									response.writeHead(200, {"Content-Type": "text/html"});
									response.end(processes.render("./views/index.html",data));
								}
								else {
									processes.store("games", {id: data.id}, data, then_2);
								}
							}
							function then_2(data) {
								if (data) {
									response.writeHead(302, {Location: "./" + data.id + "/2"});
									response.end();
								}
								else {
									response.writeHead(400, {"Content-Type": "text/plain"});
									response.end("400: Bad request.");
								}
							};
						}
						else {
							console.log("just viewing home page...");
							response.writeHead(200, {"Content-Type": "text/html"});
							response.end(processes.render("./views/index.html",null));
						}
					break;

					case ((/^\/[A-Za-z0-9]{16}\//).test(request.url) && ((typeof routes[2] === "undefined") || (!(/^(0|1|2)$/).test(routes[2])))): //game page without viewer
						response.writeHead(302, {Location: "../../../../" + routes[1] + "/0"});
						response.end();
					break;

					case (/^\/[A-Za-z0-9]{16}\/(0|1|2)$/).test(request.url): //games pages
						var game_id = routes[1];
						processes.retrieve("games", {id: game_id}, then);
						function then(data) {
							if (data) {
								data.viewer = routes[2];
								console.log("viewer:" + data.viewer);
								response.writeHead(200, {"Content-Type": "text/html"});
								response.end(processes.render("./views/game.html",data));
							}
							else {
								response.writeHead(302, {Location: "../../../../"});
								response.end();
							}
						}
					break;

					case (/\/ajax$/).test(request.url) && (request.method === "POST"): //ajax requests
						processes.retrieve("games", {id: post.game_id}, then_1);
						function then_1(data) {
							if ((data) && (typeof post.player !== "undefined")) {
								data = game.makeMove(data, post.player, {x: post["piece[x]"], y: post["piece[y]"]}, {x: post["target[x]"], y: post["target[y]"]});
								processes.store("games", {id: post.game_id}, data, then_2);
							}
							else {
								then_2(data);
							}
						}
						function then_2(data) {
							if (data) {
								response.writeHead(200, {"Content-Type": "text/json"});
								response.end(JSON.stringify(data));
							}
							else {
								response.writeHead(400, {"Content-Type": "text/plain"});
								response.end("400: Bad request.");
							}
						}
					break;

					// default: //all others --> 404
					// 	response.writeHead(404, {"Content-Type": "text/plain"});
					// 	response.end("404: File not found.");
					// break;

					default: //redirect to index
						response.writeHead(302, {Location: "../../../../"});
						response.end();
					break;
				}	
			});
		}
		catch (error) {
			console.log("request/response error: " + error);
		}
	}