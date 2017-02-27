$(document).ready(function () {
	/* load */
		var game_id = $("#board").attr("game-id");
		var player = Number($("#board").attr("player"));
		if (player) {
			var opponent = (player % 2) + 1;
		}
		else {
			var opponent = 0;
		}
		
		$(".piece[player=player_" + player + "]").addClass("selectable");
		$("#newgame_id").text(" " + game_id);

		var loop = setInterval(function() {
			var turn = Number($("#board").attr("turn"));
			retrieveBoard();
		}, 5000);

	/* listeners */
		$(document).on("click",".piece.selectable",function() {
			if (turn === player) {
				showLegal($(this));
			}
		});

		$(document).on("click",".square.legal",function() {
			if (turn === player) {
				makeMove($(this));
			}
		});

	/* showLegal */
		function showLegal(piece) {
			if (!$(piece).hasClass("selected")) {
				$(".piece").removeClass("selected");
				$(".square").removeClass("legal").attr("player",null);
				$(piece).addClass("selected");

				var coordinates = $(piece).closest(".square").attr("id").replace("square_","").split("_");
					var x = Number(coordinates[0]);
					var y = Number(coordinates[1]);

				var jumps = [[x + 2,y],[x - 2, y],[x,y + 2],[x, y - 2]];

				for (i = 0; i < jumps.length; i++) {
					if (!$("#square_" + ((x + jumps[i][0]) / 2) + "_" + ((y + jumps[i][1]) / 2)).find(".piece[player=player_" + opponent + "]").toArray().length) {
						jumps.splice(i,1);
						i--;
					}
				}

				var adjacents = [[x + 1,y],[x - 1, y],[x,y + 1],[x, y - 1]];
				var possibilities = adjacents.concat(jumps);

				for (i = 0; i < possibilities.length; i++) {
					if (((possibilities[i][0] === 0) && (possibilities[i][1] === 0) && (player === 1)) || ((possibilities[i][0] === 4) && (possibilities[i][1] === 4) && (player === 2))) { //home square
						possibilities.splice(i,1);
						i--;
					}
					else if ((possibilities[i][0] < 0) || (possibilities[i][1] < 0) || (possibilities[i][0] > 4) || (possibilities[i][1] > 4)) { //outside of the board
						possibilities.splice(i,1);
						i--;
					}
					else if ($("#square_" + possibilities[i][0] + "_" + possibilities[i][1]).find(".piece").toArray().length) { //occupied square
						possibilities.splice(i,1);
						i--;
					}
				}

				for (i = 0; i < possibilities.length; i++) {
					$("#square_" + possibilities[i][0] + "_" + possibilities[i][1]).addClass("legal").attr("player","player_" + player);
				}
					
			}
			else {
				$(piece).removeClass("selected");
				$(".square").removeClass("legal").attr("player",null);
			}
		}
	
	/* makeMove */
		function makeMove(square) {
			var target_coordinates = $(square).attr("id").replace("square_","").split("_");
			var piece_coordinates = $(".piece.selected").closest(".square").attr("id").replace("square_","").split("_");
			var data = {
				game_id: game_id,
				player: player,
				piece: {
					x: Number(piece_coordinates[0]),
					y: Number(piece_coordinates[1])
				},
				target: {
					x: Number(target_coordinates[0]),
					y: Number(target_coordinates[1])
				}
			};

			$.ajax({
				type: "POST",
				url: "/ajax",
				data: data,
				success: function(data) {
					if (typeof data.state.victor !== "undefined") {
						clearInterval(loop);
					}

					$("#message").html(data.message["player_" + player] || "");
					$("#board").attr("turn", data.state.turn).attr("round", data.state.round).empty().append(drawBoard(data));
					turn = Number($("#board").attr("turn"));
					
					if (data.selected["player_" + player] !== null) {
						$("#square_" + data.selected["player_" + player].x + "_" + data.selected["player_" + player].y).find(".piece").addClass("selected");

						for (i = 0; i < data.jumps["player_" + player].length; i++) {
							$("#square_" + data.jumps["player_" + player][i].target.x + "_" + data.jumps["player_" + player][i].target.y).addClass("legal").attr("player","player_" + player);
						}
					}
					else {
						$(".piece[player=player_" + player + "]").addClass("selectable");
					}
				}
			});
		}

	/* retrieveBoard */
		function retrieveBoard() {
			$.ajax({
				type: "POST",
				url: "/ajax",
				data: {game_id: game_id},
				success: function(data) {
					if (Number($("#board").attr("turn")) !== data.state.turn) {
						if (typeof data.state.victor !== "undefined") {
							clearInterval(loop);
						}
						
						$("#message").html(data.message["player_" + player] || "");
						$("#board").attr("turn", data.state.turn).attr("round", data.state.round).empty().append(drawBoard(data));
						turn = Number($("#board").attr("turn"));

						if ((typeof data.selected["player_" + player] !== "undefined") && (data.selected["player_" + player] !== null)) {
							$("#square_" + data.selected["player_" + player].x + "_" + data.selected["player_" + player].y).find(".piece").addClass("selected");

							for (i = 0; i < data.jumps["player_" + player].length; i++) {
								$("#square_" + data.jumps["player_" + player][i].target.x + "_" + data.jumps["player_" + player][i].target.y).addClass("legal").attr("player","player_" + player);
							}
						}
						else {
							$(".piece[player=player_" + player + "]").addClass("selectable");
						}
					}
				}
			});
		}

	/* drawBoard */
		function drawBoard(data) {
			var board = "";
			for (var y = 0; y < 5; y++) {
				var row = "<div class='row'>";
				
				for (var x = 0; x < 5; x++) {
					if ((data.state.last_piece.x === x) && (data.state.last_piece.y === y)) {
						var last = " last";
					}
					else {
						var last = "";
					}

					if (data.board[x + "," + y].player > 0) {
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
});