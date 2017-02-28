/* dependencies */
	const processes = require("../logic/processes.js");

/* newGame */
	function newGame(player_1) {
		try {
			var data = {
				id: processes.randomString(4),
				players: {
					player_1: player_1,
					player_2: null
				},
				state: {
					time_start: new Date().getTime(),
					last_play: null,
					last_piece: {
						x: null,
						y: null
					},
					playing: false,
					round: 0,
					turn: 0,
				},
				message: {
					player_1: "waiting for player 2 to join <div id='newgame_id'></div>",
					player_2: "waiting for you to exist - join <div id='newgame_id'></div>"
				},
				selected: {
					player_1: null,
					player_2: null
				},
				legal: {
					player_1: null,
					player_2: null
				},
				highlighted: {
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

					if ((x + y) === 0) {
						var player = 0;
						var color = "blue";
					}
					if ((x + y) === 8) {
						var player = 0;
						var color = "red";
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
		if ((typeof data === "undefined") || (data === null)) {
			data = {
				id: false,
				message: "can't find that game!"
			}
		}
		else if (data.players.player_2 !== null) {
			data = {};
			data = {
				id: false,
				message: "can't join this game - already has 2 players"
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
					if ((Number(data.state.last_piece.x) === x) && (Number(data.state.last_piece.y) === y)) {
						var last = " highlighted";
					}
					else {
						var last = "";
					}
					var piece = "<div class='piece" + last + "' player='player_" + data.board[x + "," + y].player + "'></div>";
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
		var opponent = (player % 2) + 1;
		
		if (Number(actor) !== player) { //not your turn
			data.message["player_" + actor] = "illegal move: not your turn";
			return data;
		}
		else if (data.board[piece.x + "," + piece.y].player !== player) { //opponent piece
			data.message["player_" + player] = "illegal move: not your piece";
			return data;
		}
		else if (data.board[target.x + "," + target.y].player) { //occupied square
			data.message["player_" + player] = "illegal move: occupied square";
			return data;
		}
		else if (((Number(target.x) === 0) && (Number(target.y) === 0) && (player === 1)) || ((Number(target.x) === 4) && (Number(target.y) === 4) && (player === 2))) { //home square
			data.message["player_" + player] = "illegal move: can't go into home square";
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
						data.message["player_" + player] = "illegal move: jumps available to make";
						return data;
					}
					else {
						data.board[piece.x + "," + piece.y].player = 0;
						data.board[target.x + "," + target.y].player = player;
						data.state.last_play = new Date().getTime();
						data.state.turn = opponent;
						data.state.last_piece = {
							x: target.x,
							y: target.y
						}
						
						data.selected["player_" + player] = null;
						data.legal["player_" + player] = null;
						if (data.state.turn === 1) {
							data.state.round++;
						}

						data.highlighted["player_" + player] = [{piece: {x: target.x, y: target.y}}];
						data.message["player_" + player] = "piece moved to adjacent square - waiting...";
						
						opponent_jumps = findJumps(data, opponent, findPieces(data, opponent));
						if (opponent_jumps.length) {
							opponent_jumps.push({piece:{x: target.x, y: target.y}});
							data.highlighted["player_" + opponent] = opponent_jumps;
							data.message["player_" + opponent] = "your turn! jumps available...";
						}
						else {
							data.highlighted["player_" + opponent] = [{piece: {x: target.x, y: target.y}}];
							data.message["player_" + opponent] = "your turn!";
						}
						
						data = checkEnd(data);
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
						data.message["player_" + player] = "illegal move: jump is not over opponent";
						return data;
					}
					else {
						data.board[piece.x + "," + piece.y].player = 0;
						data.board[between.x + "," + between.y].player = 0;
						data.board[target.x + "," + target.y].player = player;
						
						var jumps = findJumps(data, player, [{x: target.x, y: target.y}]);

						if (jumps.length) {
							data.state.last_piece = {
								x: target.x,
								y: target.y
							};

							data.selected["player_" + player] = {
								x: target.x,
								y: target.y
							};
							data.legal["player_" + player] = jumps;

							data.highlighted["player_" + player] = [{piece: {x: target.x, y: target.y}}];
							data.highlighted["player_" + opponent] = [{piece:{x: target.x, y: target.y}}];

							data.message["player_" + player] = "piece jumped over opponent - keep jumping";
							data.message["player_" + opponent] = "opponent is jump-chaining - waiting...";
						}
						else {
							data.state.last_play = new Date().getTime();
							data.state.turn = opponent;
							data.state.last_piece = {
								x: target.x,
								y: target.y
							}
							data.selected["player_" + player] = null;
							data.legal["player_" + player] = null;
							if (data.state.turn === 1) {
								data.state.round++;
							}

							data.highlighted["player_" + player] = [{piece: {x: target.x, y: target.y}}];
							data.message["player_" + player] = "piece jumped over opponent - waiting...";

							opponent_jumps = findJumps(data, opponent, findPieces(data, opponent));
							if (opponent_jumps.length) {
								opponent_jumps.push({piece:{x: target.x, y: target.y}});
								data.highlighted["player_" + opponent] = opponent_jumps;
								data.message["player_" + opponent] = "your turn! jumps available...";
							}
							else {
								data.highlighted["player_" + opponent] = [{piece: {x: target.x, y: target.y}}];
								data.message["player_" + opponent] = "your turn!";
							}
						}

						data = checkEnd(data);
						return data;
					}
				break;

				//all other moves
				default:
					data.message["player_" + player] = "illegal move: unknown";
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
				if (((Number(targets[j].x) === 0) && (Number(targets[j].y) === 0) && (Number(player) === 1)) || ((Number(targets[j].x) === 4) && (Number(targets[j].y) === 4) && (Number(player) === 2))) {
					//home square
				}
				else if ((Number(targets[j].x) > -1) && (Number(targets[j].y) > -1) && (Number(targets[j].x) < 5) && (Number(targets[j].y) < 5)) {
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
			data.legal.player_1 = null;
			data.legal.player_2 = null;
			data.highlighted.player_1 = null;
			data.highlighted.player_2 = null;			

			data.message.player_1 = "you lose! <a id='again' href='../../'>play again?</a>";
			data.message.player_2 = "you win! <a id='again' href='../../'>play again?</a>";
		}
		else if (!findPieces(data,2).length) {
			data.state.playing = false;
			data.state.turn = 0;
			data.state.victor = 1;
			
			data.selected.player_1 = null;
			data.selected.player_2 = null;
			data.legal.player_1 = null;
			data.legal.player_2 = null;
			data.highlighted.player_1 = null;
			data.highlighted.player_2 = null;

			data.message.player_1 = "you win! <a id='again' href='../../'>play again?</a>";
			data.message.player_2 = "you lose! <a id='again' href='../../'>play again?</a>";
		}
		else if (data.board["0,0"].player === 2) {
			data.state.playing = false;
			data.state.turn = 0;
			data.state.victor = 2;

			data.selected.player_1 = null;
			data.selected.player_2 = null;
			data.legal.player_1 = null;
			data.legal.player_2 = null;
			data.highlighted.player_1 = null;
			data.highlighted.player_2 = null;

			data.message.player_1 = "you lose! <a id='again' href='../../'>play again?</a>";
			data.message.player_2 = "you win! <a id='again' href='../../'>play again?</a>";
		}
		else if (data.board["4,4"].player === 1) {
			data.state.playing = false;
			data.state.turn = 0;
			data.state.victor = 1;

			data.selected.player_1 = null;
			data.selected.player_2 = null;
			data.legal.player_1 = null;
			data.legal.player_2 = null;
			data.highlighted.player_1 = null;
			data.highlighted.player_2 = null;

			data.message.player_1 = "you win! <a id='again' href='../../'>play again?</a>";
			data.message.player_2 = "you lose! <a id='again' href='../../'>play again?</a>";
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
	