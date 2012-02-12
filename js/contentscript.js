
(function() {
	var betterBird = function () {  
		var scheme = /^http[s]?:\/\/(www\.)*/;
		var fileext = /(.html|.php|.aspx)/i;
		var querystring = /\?.*$/;
		var trailingid = /\/\d+$/g;
		var trailing = /[\/\-\.]$/;
		return {  
			AbbrevUrl: function(u) {
				var parts = decodeURIComponent(u.replace(scheme, '').replace(trailingid, '').replace(fileext, '').replace(querystring, '').replace(trailing, ''))
							 .split('/');
				if (parts.length <= 2) {
					return parts.join('/');
				}
				var u2 = parts[0] + "/…/" + parts[parts.length - 1];
				return u2;
			},
			SetUrls: function(scope) {
				$("a[data-ultimate-url]", scope).not(".set-url").each(function() {
					var a = $(this);
					var u = a.data("ultimate-url");
					a.attr("href", u)
					 .text(BetterBird.AbbrevUrl(u))
					 .addClass("set-url");
				});
			}
		};
	};

	var BetterBird = betterBird();
	var stream = $("div.stream");
	
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
	}, 1500);

	setInterval(function() {
		BetterBird.SetUrls(stream);
	}, 1200);
})()
