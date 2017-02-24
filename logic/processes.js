/* dependencies */
	const fs = require("fs");
	const mongo = require("mongodb").MongoClient;
	var database;
	try {
		database = "mongodb://localhost:27017/diamond_checkers";
	}
	catch (error) {
		database = "mongodb://" + process.env.MLABS_USERNAME + ":" + process.env.MLABS_PASSWORD + "@" + process.env.MLABS_URL;
	}
	const game = require("./game");

/* render html */
	function render(file, data) {
		const html = {};
		html.original = fs.readFileSync(file).toString();
		html.array = html.original.split(/<%|%>/);
		
		for (html.count = 0; html.count < html.array.length; html.count++) {
			//console.log("chunk " + html.count + ": " + (html.array[html.count]).replace(/\t/g,"").replace(/\n/g,""));

			if (html.count % 2 === 1) {
				console.log("evaluating chunk " + html.count + "...");
				try {
					html.temp = eval(html.array[html.count]);
				}
				catch (error) {
					html.temp = "";
					console.log(error.name);
				}
				//console.log("now: " + html.temp);
				html.array[html.count] = html.temp;
			}
		}
		return html.array.join("");
	}

/* random string */
	function randomString(length) {
		var set = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		var output = "";

		for (i = 0; i < length; i++) {
			output += (set[Math.floor(Math.random() * set.length)]);
		}

		return output;
	}

/* store data */
	function store(table, search, data, callback) {
		mongo.connect(database, function(error, db) {
			if (error) {
				console.log(error);
			}			
			else {			
				if ((search === null) && (data !== null)) { //create
					db.collection(table).insert(data, function (error, result) {
						if (error) {
							console.log(error);
						}
						else {
							callback(result.ops[0]);
						}
					});
				}
				else if ((search !== null) && (data !== null)) { //update
					db.collection(table).update(search, data, function (error, result) {
						if (error) {
							console.log(error);
						}
						else {
							callback(data);
						}
					});
				}
				else if ((search !== null) && (data === null)) { //remove
					db.collection(table).remove(search, function (error, result) {
						if (error) {
							console.log(error);
						}
						else {
							callback(result);
						}
					});
				}
			}
			db.close();
		});
	}

/* retrieve data */
	function retrieve(table, search, callback) {
		mongo.connect(database, function(error, db) {
			if (error) {
				console.log(error);
			}
			else {	
				db.collection(table).findOne(search, function (error, result) {
					if (error) {
						console.log(error);
					}
					else {
						callback(result);
					}
				});
			}
			db.close();
		});
	}

/* exports */
	module.exports.render = render;
	module.exports.randomString = randomString;
	module.exports.store = store;
	module.exports.retrieve = retrieve;
