(function() {
	var scheme = /^http[s]?:\/\/(www\.)*/;
	var fileext = /(.html|.php|.aspx)/i;
	var querystring = /\?.*$/;
	var endids = /\/\d+$/g;
	var stream = $("div.stream");

	var abbrevurl = function(u) {
		var parts = u.replace(scheme, '').replace(endids, '').replace(fileext, '').replace(querystring, '').split('/');
		if (parts.length <= 2) {
			return parts.join('/');
		}
		var u2 = parts[0] + "/…/" + parts[parts.length - 1];
		return u2;
	};

	var seturls = function(){
		$("a[data-ultimate-url]", stream).not(".set-url").each(function(){
			var a = $(this);
			var u = a.data("ultimate-url");
			a.attr("href", u);
			$(this).text(abbrevurl(u));
			a.addClass("set-url");
		});
	};

	setTimeout(function() {
		var m = $("<div class='module' />").css("background-color", "#fff")
			.append($("<div class='flex-module' />")
			.append($("<h3 />").css("margin-bottom", "10px").text("Saved Searches"))
			.append($("div.typeahead-items").html())); 
		var d = $("div.dashboard"); 
		$("div.mini-profile", d).after(m);
		$("div.trends").hide();
		$("div[data-component-term='user_recommendations'] h3").text("Whom to follow");
		$("ul.stats > li").last().prependTo($("ul.stats"));
		seturls();
		setInterval(seturls, 3000);
	}, 1500);
})()
