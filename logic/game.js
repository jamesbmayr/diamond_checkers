/* dependencies */
	const processes = require("../logic/processes.js");

/* newGame */
	function newGame(player_1) {
		try {
			var data = {
				id: processes.randomString(16),
				players: {
					player_1: player_1,
					player_2: null
				},
				state: {
					time_start: new Date().getTime(),
					last_play: null,
					playing: false,
					round: 0,
					turn: 0,
				},
				message: {
					player_1: "waiting for player 2 to join...",
					player_2: "waiting for you to exist..."
				},
				selected: {
					player_1: null,
					player_2: null
				},
				jumps: {
					player_1: null,
					player_2: null
				},
				board: {}
			}
			
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) {
					
					if ((x + y) % 2 === 1) {
						var color = "black";
					}
					else {
						var color = "white";
					}

					if ((x + y) < 4) {
						var player = 1;
					}
					else if ((x + y) > 4) {
						var player = 2;
					}
					else {
						var player = 0;
					}

					data.board[x + "," + y] = {
						x: x,
						y: y,
						color: color,
						player: player
					}
				}
			}

			return data;
		}
		catch (error) {
			console.log(error.name);
		}
	}

/* joinGame */
	function joinGame(data, player_2) {
		if (data.players.player_2 !== null) {
			data = {};
			data = {
				id: false,
				message: "can't join this game"
			}
		}
		else {
			data.players.player_2 = player_2;
			data.state.playing = true;
			data.state.round = 1;
			data.state.turn = 1;
			data.message.player_1 = "your turn!";
			data.message.player_2 = "waiting for opponent...";
		}

		return data;
	}

/* drawBoard */
	function drawBoard(data) {
		var board = "";
		for (var y = 0; y < 5; y++) {
			var row = "<div class='row'>";
			
			for (var x = 0; x < 5; x++) {
				if (data.board[x + "," + y].player > 0) {
					var piece = "<div class='piece' player='player_" + data.board[x + "," + y].player + "'></div>";
				}
				else {
					var piece = "";
				}

				var square = "<div class='square' id='square_" + x + "_" + y + "' color='" + data.board[x + "," + y].color + "'>" + piece + "</div>";

				row += square;
			}

			row += "</div>";
			board += row;
		}

		return board;
	}

/* makeMove */
	function makeMove(data, actor, piece, target) {
		var player = Number(data.state.turn);
		console.log("player: " + player);
		var opponent = (player % 2) + 1;
		console.log("opponent: " + opponent);
		
		if (Number(actor) !== player) { //not your turn
			data.message["player_" + actor] = "illegal move: not your turn";
			return data;
		}
		else if (data.board[piece.x + "," + piece.y].player !== player) { //opponent piece
			data.message["player_" + actor] = "illegal move: not your piece";
			return data;
		}
		else if (data.board[target.x + "," + target.y].player) { //occupied square
			data.message["player_" + actor] = "illegal move: occupied square";
			return data;
		}
		else {
			var jumps = findJumps(data, player, findPieces(data, player));

			switch (true) {
				//adjacent move
				case ((Number(target.x) === Number(piece.x) + 1) && (Number(target.y) === Number(piece.y))):
				case ((Number(target.x) === Number(piece.x) - 1) && (Number(target.y) === Number(piece.y))):
				case ((Number(target.x) === Number(piece.x)) && (Number(target.y) === Number(piece.y) + 1)):
				case ((Number(target.x) === Number(piece.x)) && (Number(target.y) === Number(piece.y) - 1)):
					if (jumps.length) {
						data.message["player_" + actor] = "illegal move: must make a jump";
						return data;
					}
					else {
						data.board[piece.x + "," + piece.y].player = 0;
						data.board[target.x + "," + target.y].player = player;
						data.state.last_play = new Date().getTime();
						data.state.turn = opponent;
						data.selected["player_" + player] = null;
						data.jumps["player_" + player] = null;
						if (data.state.turn === 1) {
							data.state.round++;
						}

						console.log("turn: " + data.state.turn);
						
						data.message["player_" + actor] = "piece moved to adjacent square - waiting...";
						data.message["player_" + opponent] = "your turn!";
						data = checkEnd(data);

						console.log("turn: " + data.state.turn);
						return data;
					}
				break;

				//jump 2 squares
				case ((Number(target.x) === Number(piece.x) + 2) && (Number(target.y) === Number(piece.y))):
				case ((Number(target.x) === Number(piece.x) - 2) && (Number(target.y) === Number(piece.y))):
				case ((Number(target.x) === Number(piece.x)) && (Number(target.y) === Number(piece.y) + 2)):
				case ((Number(target.x) === Number(piece.x)) && (Number(target.y) === Number(piece.y) - 2)):
					var between = {};
						between.x = (Number(target.x) + Number(piece.x)) / 2;
						between.y = (Number(target.y) + Number(piece.y)) / 2;
					
					if (data.board[between.x + "," + between.y].player !== opponent) {
						data.message["player_" + actor] = "illegal move: jump is not over opponent";
						return data;
					}
					else {
						data.board[piece.x + "," + piece.y].player = 0;
						data.board[between.x + "," + between.y].player = 0;
						data.board[target.x + "," + target.y].player = player;
						
						var jumps = findJumps(data, player, [{x: target.x, y: target.y}]);

						if (jumps.length) {
							data.selected["player_" + player] = {
								x: target.x,
								y: target.y
							}
							data.jumps["player_" + player] = jumps;
							data.message["player_" + actor] = "piece jumped over opponent - keep jumping";
							data.message["player_" + opponent] = "opponent is jump-chaining - waiting...";
						}
						else {
							data.state.last_play = new Date().getTime();
							data.state.turn = opponent;
							data.selected["player_" + player] = null;
							data.jumps["player_" + player] = null;
							if (data.state.turn === 1) {
								data.state.round++;
							}
							data.message["player_" + actor] = "piece jumped over opponent - waiting...";
							data.message["player_" + opponent] = "your turn!";
						}

						data = checkEnd(data);
						return data;
					}
				break;

				//all other moves
				default:
					data.message["player_" + actor] = "illegal move: unknown";
					return data;
				break;
			}
		}
	}

/* findJumps */
	function findJumps(data, player, pieces) {
		var opponent = (player % 2) + 1;
		var jumps = [];

		for (i = 0; i < pieces.length; i++) {
			var targets = [
				{x: Number(pieces[i].x) + 2, y: Number(pieces[i].y)},
				{x: Number(pieces[i].x) - 2, y: Number(pieces[i].y)},
				{x: Number(pieces[i].x), y: Number(pieces[i].y) + 2},
				{x: Number(pieces[i].x), y: Number(pieces[i].y) - 2}
			];

			for (j = 0; j < targets.length; j++) {
				if ((Number(targets[j].x) > -1) && (Number(targets[j].y) > -1) && (Number(targets[j].x) < 5) && (Number(targets[j].y) < 5)) {
					var between = {
						x: ((Number(targets[j].x) + Number(pieces[i].x)) / 2),
						y: ((Number(targets[j].y) + Number(pieces[i].y)) / 2)
					}

					if ((data.board[between.x + "," + between.y].player === opponent) && (data.board[targets[j].x + "," + targets[j].y].player === 0)) {
						jumps.push({
							piece: {
								x: pieces[i].x,
								y: pieces[i].y
							},
							target: {
								x: targets[j].x,
								y: targets[j].y
							}
						});
					}
				}
			}
		}

		return jumps;
	}

/* findPieces */
	function findPieces(data, player) {
		var pieces = [];
		var keys = Object.keys(data.board);

		for (var i = 0; i < keys.length; i++) {
			if (data.board[keys[i]].player === player) {
				pieces.push({
					x: data.board[keys[i]].x,
					y: data.board[keys[i]].y
				});
			}
		}

		return pieces;
	}

/* checkEnd */
	function checkEnd(data) {
		if (!findPieces(data,1).length) {
			data.state.playing = false;
			data.state.turn = 0;
			data.state.victor = 2;

			data.selected.player_1 = null;
			data.selected.player_2 = null;
			data.jumps.player_1 = null;
			data.jumps.player_2 = null;
			data.message.player_1 = "you lose!";
			data.message.player_2 = "you win!";
		}
		else if (!findPieces(data,2).length) {
			data.state.playing = false;
			data.state.turn = 0;
			data.state.victor = 1;
			
			data.selected.player_1 = null;
			data.selected.player_2 = null;
			data.jumps.player_1 = null;
			data.jumps.player_2 = null;
			data.message.player_2 = "you lose!";
			data.message.player_1 = "you win!";
		}
		else if (data.board["0,0"].player === 2) {
			data.state.playing = false;
			data.state.turn = 0;
			data.state.victor = 2;

			data.selected.player_1 = null;
			data.selected.player_2 = null;
			data.jumps.player_1 = null;
			data.jumps.player_2 = null;
			data.message.player_1 = "you lose!";
			data.message.player_2 = "you win!";
		}
		else if (data.board["4,4"].player === 1) {
			data.state.playing = false;
			data.state.turn = 0;
			data.state.victor = 1;

			data.selected.player_1 = null;
			data.selected.player_2 = null;
			data.jumps.player_1 = null;
			data.jumps.player_2 = null;
			data.message.player_2 = "you lose!";
			data.message.player_1 = "you win!";
		}

		return data;
	}

/* exports */
	module.exports.newGame = newGame;
	module.exports.joinGame = joinGame;
	module.exports.makeMove = makeMove;
	module.exports.drawBoard = drawBoard;
	module.exports.findPieces = findPieces;
	module.exports.findJumps = findJumps;
	module.exports.checkEnd = checkEnd;
	