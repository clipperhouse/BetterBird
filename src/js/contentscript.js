(function($) {
  $.fn.filterByData = function(key, value) {
  	return this.filter(function () {
		return $(this).data(key) == value;
	});
  };
  $.fn.findByData = function(selector, key, value) {
  	return this.find(selector).filterByData(key, value);
  };
  $.fn.id = function(id) {
  	return this.attr("id", id);
  };
  $.fn.for = function(cb) {
  	return this.attr("for", cb.attr("id"));
  };
  $.fn.checked = function(ischecked) {
  	if (ischecked === true) {
  		return this.attr("checked", "checked");
  	}
  	if (ischecked === false) {
  		return this.removeAttr("checked", "checked");
  	}
  };
})(jQuery);

String.prototype.remove = function(r) { return this.replace(r, ''); };

(function() {

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
			savedsearch: "bb-saved-search",
			options: "bb-options",
			birdblock: "bb-birdblock",
		};

		var body = $(document.body);
		var wrapper = $("div.wrapper");
		var dashboard = $("div.dashboard", wrapper);
		var birdBlock, searchModule, optionsModule;

		var applyCss = function (options) {
			for (var key in options.styles) {
				classnames[key] = "bb-" + key;
				body.toggleClass(classnames[key], options.styles[key]);
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

		var createModule = function(classname, title, iconurl) {
			var h = $("<h3 />").css("margin-bottom", "10px").text(title);
			if (iconurl) {
				h.prepend($("<img>").addClass("bb-icon").attr("src", iconurl));
			}
			var f = $("<div class='flex-module' />").append(h);
			var m = $("<div class='module' />").addClass(classname).css("background-color", "#fff").append(f);
			m.content = f;
			m.title = h;
			return m;
		};

		var getSavedSearches = function () {
			if (searchModule === undefined) {
				searchModule = createModule(classnames.savedsearch, "Saved Searches", chrome.extension.getURL("img/twitter_32.png"));
				birdBlock.append(searchModule);
			}

			var updateSavedSearch = function (q, count) {
				var datakey = "search-query";
				var a = searchModule.content.findByData("a", datakey, q);
				if (a.length == 0) {
					a = $("<a>").data(datakey, q).attr("href", "#!/search/" + encodeURIComponent(q));
					searchModule.content.append($("<p>").append(a));
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

		var createOptionsModule = function() {
			optionsModule = createModule(classnames.options, "Better Bird settings", chrome.extension.getURL("img/twitter_32.png"));

			addStyleOptionCheckbox("columnswitch", "Switch columns");
			addStyleOptionCheckbox("columnwide", "Widen content");

			birdBlock.append(optionsModule);
		};

		var addStyleOptionCheckbox = function(optionkey, labeltext, iconurl) {
			var cb = $("<input type='checkbox'>")
					 .id("bb-option-" + optionkey).checked(options.styles[optionkey])
					 .change(function() {
					 	options.styles[optionkey] = $(this).is(":checked");
						body.toggleClass(classnames[optionkey], options.styles[optionkey]);
						saveOptions();
					 });
			var label = $("<label>").text(labeltext).for(cb);
			var br = $("<br>")
			
			optionsModule.content.append(cb).append(label).append(br);
		};

		var createBirdBlock = function() {
			birdBlock = $("<div>").addClass(classnames.birdblock);
			$("div.mini-profile", dashboard).after(birdBlock);
		};

		var options;
		var saveOptions = function() {
			chrome.extension.sendRequest({ type: "save-options", options: options }, function() {
				console.log("Saved options");
			});
		};

		var urlinterval, searchinterval;

		return {
			Init: function() {
				clearInterval(urlinterval);
				clearInterval(searchinterval);

				chrome.extension.sendRequest({ "type": "load-options" }, function (response) {
					options = response;
					applyCss(options);
					setTimeout(function() {					// a little time for the ajax to populate
						createBirdBlock();
						
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
						createOptionsModule();
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
