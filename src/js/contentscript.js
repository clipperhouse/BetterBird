
(function() {
	String.prototype.remove = function(r) { return this.replace(r, ''); };

	var BetterBird = (function () {
		var regex = {
			scheme: /^http[s]?:\/\/(www\.)*/,
			trailingid: /\/\d+$/g,
			trailing: /[\/\-\.\s]$/,
			fileext: /(.html|.php|.aspx)/i,
			querystring: /\?.*$/,
		};
		var classnames = { 
			expand: "bb-expand", 
			direct: "bb-direct", 
			savedsearches: "bb-saved-search"
		};
		var body = $(document.body);
		var wrapper = $("div.wrapper");
		var dashboard = $("div.dashboard", wrapper);

		var applyCss = function (options) {
			for (var key in options.styles) {
				var classname = "bb-" + key;
				body.toggleClass(classname, options.styles[key]);
			}
			wrapper.show();
		};

		var abbrevUrl = function(url) {
			var parts = decodeURIComponent(url
				.remove(regex.scheme)
				.remove(regex.querystring)
				.remove(regex.trailingid)
				.remove(regex.fileext)
				.remove(regex.trailing)
				).split('/');
			if (parts.length <= 2) {
				return parts.join('/');
			}
			parts.splice(1, parts.length - 2, "…");
			return parts.join('/');
		};

		var expandUrls = function(scope) {
			$("a[data-ultimate-url], a[data-expanded-url]", scope).not("a." + classnames.expand).each(function() {
				var a = $(this);
				var u = a.data("ultimate-url") || a.data("expanded-url");
				a.text(abbrevUrl(u)).addClass(classnames.expand);
			});
		};

		var getSavedSearches = function () {
			var module = (function () {
				var existing = $("div.module." + classnames.savedsearch).find("div.flex-module");
				if (existing.length) {
					return existing;
				}
				var f = $("<div class='flex-module' />").append($("<h3 />").css("margin-bottom", "10px").text("Saved Searches"));
				var m = $("<div class='module' />").addClass(classnames.savedsearch).css("background-color", "#fff").append(f);
				$("div.mini-profile", dashboard).after(m);
				return f;
			})();

			module.find("p").remove();

			var updateSavedSearch = function (q, count) {
				var a = module.find("a[data-search-query='" + q + "']");
				if (a.length == 0) {
					a = $("<a>").data("search-query", q).attr("href", "#!/search/" + encodeURIComponent(q));
					module.append($("<p>").append(a));
				}
				a.text(q + " (" + count + ")");
			};

			var searches = $("div.typeahead-items > ul > li > a");
			searches.each(function () {
				var a = $(this);
				var q = a.data("search-query");
				console.log(q);

				var url = "http://search.twitter.com/search.json?q=" + encodeURIComponent(q);
				$.getJSON(url, function (response) {
					updateSavedSearch(q, response.results.length);
				});
			});
			return searches.length;
		};

		var removeRedirects = function(scope) {
			$("a[data-ultimate-url], a[data-expanded-url]", scope).not("a." + classnames.direct).each(function() {
				var a = $(this);
				var u = a.data("ultimate-url") || a.data("expanded-url");
				a.attr("href", u).addClass(classnames.direct);
			});
		};

		var directToProfile = function(scope) {
			$("a.js-user-profile-link").removeClass("js-account-group js-action-profile js-user-profile-link");
			$("a.twitter-atreply").removeClass("twitter-atreply pretty-link");
		};

		var options;
		var urlinterval, searchinterval;

		return {
			Init: function() {
				clearInterval(urlinterval);
				clearInterval(searchinterval);

				chrome.extension.sendRequest({ "type": "load-options" }, function (response) {
					options = response;
					applyCss(options);
					setTimeout(function() {					// a little time for the ajax to populate
						$("div.trends").hide();
						urlinterval = setInterval(function() {
							var stream = $("div.stream");
							if (options.expandurls) {
								expandUrls(stream);
								removeRedirects(stream);
							}
							if (options.directtoprofile) {
								directToProfile(stream);
							}
						}, 1500);
						if (options.savedsearches) {
							var numsearches = getSavedSearches();
							if (numsearches > 0) {
								searchinterval = setInterval(function(){
									getSavedSearches();
								}, 60 * 60 * 1000 * numsearches / 150);
							}
						}
					}, 1500);
				});
			}			
		};
	})();

	BetterBird.Init();

	chrome.extension.onRequest.addListener(function(request) {
		switch(request) {
			case "go-home":
			  document.location.href = $("li#global-nav-home > a").attr("href");
			  $("div.new-tweets-bar").click();
			break;
			default:			  
		}
	});
})()
