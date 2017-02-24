$(document).ready(function () {
	/* load */
		var url = String(location.pathname).substring(String(location.pathname).indexOf("/game/") + 6).split("/");
			var game_id = url[0];
			var player = Number(url[1]) || 0;
			if (player) {
				var opponent = (player % 2) + 1;
			}
			else {
				var opponent = 0;
			}
		
		$(".piece[player=player_" + player + "]").addClass("selectable");
		$(".piece[player=player_" + opponent + "]").addClass("unselectable");

		var loop = setInterval(function() {
			retrieveBoard();
		}, 5000);

	/* listeners */
		$(document).on("click",".piece.selectable",function() {
			if (window.turn === player) {
				showLegal($(this));
			}
		});

		$(document).on("click",".square.legal",function() {
			if (window.turn === player) {
				makeMove($(this));
			}
		});

	/* showLegal */
		function showLegal(piece) {
			if (!$(piece).hasClass("selected")) {
				$(".piece").removeClass("selected");
				$(".square").removeClass("legal");
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
					if ((possibilities[i][0] < 0) || (possibilities[i][1] < 0) || (possibilities[i][0] > 4) || (possibilities[i][1] > 4)) {
						possibilities.splice(i,1);
						i--;
					}
					else if ($("#square_" + possibilities[i][0] + "_" + possibilities[i][1]).find(".piece").toArray().length) {
						possibilities.splice(i,1);
						i--;
					}
				}

				for (i = 0; i < possibilities.length; i++) {
					$("#square_" + possibilities[i][0] + "_" + possibilities[i][1]).addClass("legal");
				}
					
			}
			else {
				$(piece).removeClass("selected");
				$(".square").removeClass("legal");
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
				url: "/ajax/game",
				data: data,
				success: function(data) {
					window.turn = data.state.turn;
					if (typeof data.state.victor !== "undefined") {
						clearInterval(loop);
					}

					$("#round").text("round: " + data.state.round);
					$("#turn").text("whose turn: " + data.state.turn);
					$("#message").text(data.message["player_" + player] || "");
					$("#board").empty().append(drawBoard(data));

					if (data.selected["player_" + player] !== null) {
						$(".piece").addClass("unselectable");
						$("#square_" + data.selected["player_" + player].x + "_" + data.selected["player_" + player].y).find(".piece").addClass("selected").removeClass("unselectable");

						for (i = 0; i < data.jumps["player_" + player].length; i++) {
							$("#square_" + data.jumps["player_" + player][i].target.x + "_" + data.jumps["player_" + player][i].target.y).addClass("legal");
						}
					}
					else {
						$(".piece[player=player_" + player + "]").addClass("selectable");
						$(".piece[player=player_" + opponent + "]").addClass("unselectable");
					}
				}
			});
		}

	/* retrieveBoard */
		function retrieveBoard() {
			$.ajax({
				type: "POST",
				url: "/ajax/game",
				data: {game_id: game_id},
				success: function(data) {
					if (window.turn !== data.state.turn) {
						window.turn = data.state.turn;
						if (typeof data.state.victor !== "undefined") {
							clearInterval(loop);
						}

						$("#round").text("round: " + data.state.round);
						$("#turn").text("whose turn: " + data.state.turn);
						$("#message").text(data.message["player_" + player] || "");
						
						$("#board").empty().append(drawBoard(data));

						if (data.selected["player_" + player] !== null) {
							$(".piece").addClass("unselectable");
							$("#square_" + data.selected["player_" + player].x + "_" + data.selected["player_" + player].y).find(".piece").addClass("selected").removeClass("unselectable");

							for (i = 0; i < data.jumps["player_" + player].length; i++) {
								$("#square_" + data.jumps["player_" + player][i].target.x + "_" + data.jumps["player_" + player][i].target.y).addClass("legal");
							}
						}
						else {
							$(".piece[player=player_" + player + "]").addClass("selectable");
							$(".piece[player=player_" + opponent + "]").addClass("unselectable");
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
});