
(function() {
	var betterBird = function () {  
		var scheme = /^http[s]?:\/\/(www\.)*/;
		var fileext = /(.html|.php|.aspx)/i;
		var querystring = /\?.*$/;
		var trailingid = /\/\d+$/g;
		var trailing = /[\/\-\.]$/;
		var classnames = { expand: "bb-expand", direct: "bb-direct" };
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
			ExpandUrls: function(scope) {
				$("a[data-ultimate-url]", scope).not("a." + classnames.expand).each(function() {
					var a = $(this);
					var u = a.data("ultimate-url");
					a.attr("href", u)
					 .text(BetterBird.AbbrevUrl(u))
					 .addClass(classnames.expand).addClass(classnames.direct);
				});
			},
			RemoveRedirects: function(scope) {
				$("a[data-expanded-url]", scope).not("a." + classnames.direct).each(function() {
					var a = $(this);
					var u = a.data("expanded-url");
					a.attr("href", u).addClass(classnames.direct);
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
	}, 1500);

	setInterval(function() {
		BetterBird.ExpandUrls(stream);
		BetterBird.RemoveRedirects(stream);
	}, 1200);

	chrome.extension.onRequest.addListener(function(request) {
		document.location.href = $("li#global-nav-home > a").attr("href");
	});
})()
