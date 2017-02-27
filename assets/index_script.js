$(document).ready(function () {

	/* listeners */
		$(document).on("click","#join",function() {
			$("#join").hide();
			$("#join_2").show();
		});

		$(document).on("click","#join_2:not(#game_id)",function() {
			$("#start").click();
		});

		$(document).on("click","#game_id",function(e) {
			e.stopPropagation();
		});

});