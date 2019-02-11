/* dependencies */
	const fs = require("fs");
	const game = require("./game");
	const db = {
		games: {}
	}

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
		var set = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		var output = "";

		for (i = 0; i < length; i++) {
			output += (set[Math.floor(Math.random() * set.length)]);
		}

		return output;
	}

/* store data */
	function store(table, search, data, callback) {
		if ((search === null) && (data !== null)) { //create
			if (!data.id) {
				data.id = randomString(4)
			}

			db[table][data.id] = data
			callback(data)
		}
		else if ((search !== null) && (data !== null)) { //update
			if (search.id) {
				db[table][search.id] = data
				callback(data)
			}
			else {
				callback(false)
			}
		}
		else if ((search !== null) && (data === null)) { //remove
			if (search.id && data[table][search.id]) {
				delete data[table][search.id]
				callback(true)
			}
			else {
				callback(false)
			}
		}
	}

/* retrieve data */
	function retrieve(table, search, callback) {
		if (search.id) {
			if (db[table][search.id]) {
				callback(db[table][search.id])
			}
			else {
				callback(null)
			}
		}
		else {
			callback(null)
		}
	}

/* exports */
	module.exports.render = render;
	module.exports.randomString = randomString;
	module.exports.store = store;
	module.exports.retrieve = retrieve;
