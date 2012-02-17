
(function() {
	var betterBird = function () {  
		var scheme = /^http[s]?:\/\/(www\.)*/;
		var fileext = /(.html|.php|.aspx)/i;
		var querystring = /\?.*$/;
		var trailingid = /\/\d+$/g;
		var trailing = /[\/\-\.]$/;
		var classnames = { expand: "bb-expand", direct: "bb-direct", savedsearch: "bb-saved-search" };
		var dashboard = $("div.dashboard"); 

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
					a.attr("href", u)
					 .text(BetterBird.AbbrevUrl(u))
					 .addClass(classnames.direct);
				});
			},
			GetSavedSearches: function () {
				var updateSavedSearch = function (a, count) {
					a.text(a.text() + " (" + count + ")");
					getSavedSearchModule().append($("<p>").append(a));
				};

				var getSavedSearchModule = function () {
					var existing = $("div.module." + classnames.savedsearch).find("div.flex-module");
					if (existing.length) {
						return existing;
					}
					var f = $("<div class='flex-module' />").append($("<h3 />").css("margin-bottom", "10px").text("Saved Searches"));
					var m = $("<div class='module' />").addClass(classnames.savedsearch).css("background-color", "#fff").append(f);
					$("div.mini-profile", dashboard).after(m);
					return f;
				};

				getSavedSearchModule().find("p").remove();

				var searches = $("div.typeahead-items > ul > li > a");
				searches.each(function () {
					var a = $(this).clone();
					var q = a.data("search-query");
					var url = "http://search.twitter.com/search.json?q=" + encodeURIComponent(q);
					$.getJSON(url, function (response) {
						updateSavedSearch(a, response.results.length);
					});
				});
				return searches.length;
			}
		};
	};

	var BetterBird = betterBird();
	
	setTimeout(function() {
		$("div.trends").hide();
		setInterval(function() {
			var stream = $("div.stream");
			BetterBird.ExpandUrls(stream);
			BetterBird.RemoveRedirects(stream);
		}, 1200);
		BetterBird.GetSavedSearches();
	}, 1500);


	chrome.extension.onRequest.addListener(function(request) {
		switch(request) {
			case "go-home":
			  document.location.href = $("li#global-nav-home > a").attr("href");
			  break;
			default:			  
		}
	});
})()
