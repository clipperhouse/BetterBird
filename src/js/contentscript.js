
(function() {
	String.prototype.remove = function(r) { return this.replace(r, ''); };
	var betterBird = function () {
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
			savedsearch: "bb-saved-search", 
			columnswitch: "bb-column-switch",
			columnwide: "bb-column-wide",
			fontgeorgia: "bb-fontgeorgia",
			fontverdana: "bb-fontverdana",
		};
		var body = $(document.body);
		var wrapper = $("div.wrapper");
		var dashboard = $("div.dashboard", wrapper);
		var options;
		var interval;

		var applyCss = function (options){
			if (options.columnswitch) { 
				body.addClass(classnames.columnswitch);
			}
			if (options.columnwide) { 
				body.addClass(classnames.columnwide);
			}
			if (options.fontgeorgia) { 
				body.addClass(classnames.fontgeorgia);
			}
			if (options.fontverdana) { 
				body.addClass(classnames.fontverdana);
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

		return {
			Init: function(){
				clearInterval(interval);

				chrome.extension.sendRequest({ "type": "load-options" }, function (options) {
					console.log(options);
					applyCss(options);
					setTimeout(function() {
						$("div.trends").hide();
						interval = setInterval(function() {
							var stream = $("div.stream");
							if (options.expandurls) {
								BetterBird.ExpandUrls(stream);
								BetterBird.RemoveRedirects(stream);
							}
							if (options.directtoprofile) {
								BetterBird.DirectToProfile(stream);
							}
						}, 1500);
						if (options.savedsearches) {
							BetterBird.GetSavedSearches();
						}
					}, 1500);
				});
			},
			ExpandUrls: function(scope) {
				$("a[data-ultimate-url], a[data-expanded-url]", scope).not("a." + classnames.expand).each(function() {
					var a = $(this);
					var u = a.data("ultimate-url") || a.data("expanded-url");
					a.text(abbrevUrl(u)).addClass(classnames.expand);
				});
			},
			RemoveRedirects: function(scope) {
				$("a[data-ultimate-url], a[data-expanded-url]", scope).not("a." + classnames.direct).each(function() {
					var a = $(this);
					var u = a.data("ultimate-url") || a.data("expanded-url");
					a.attr("href", u).addClass(classnames.direct);
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
			},
			DirectToProfile: function(scope){
				$("a.js-user-profile-link").removeClass("js-account-group js-action-profile js-user-profile-link");
				$("a.twitter-atreply").removeClass("twitter-atreply pretty-link");
			}
		};
	};

	var BetterBird = betterBird();
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
