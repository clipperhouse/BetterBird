(function() {
	setTimeout(function() {
		var m = $("<div class='module' />").css("background-color", "#fff")
			.append($("<div class='flex-module' />")
			.append($("<h3 />").css("margin-bottom", "10px").text("Saved Searches"))
			.append($("div.typeahead-items").html())); 
		var d = $("div.dashboard"); 
		$("div.mini-profile", d).after(m);
	}, 2000);
})()
