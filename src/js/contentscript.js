
(function() {
	var bb_classnames = { 
		module: "bb-module",
		expand: "bb-expand", 
		direct: "bb-direct", 
		savedsearch: "bb-savedsearch",
		options: "bb-options",
		birdblock: "bb-birdblock",
		content: "bb-content",
		mentions: "bb-mentions",
		notify: "bb-notify"
	};

	var bb_datanames = { 
		originaltext: "bb-originaltext", 
		originalhref: "bb-originalhref",
		count: "bb-count"
	};

	(function($) {
	  $.fn.filterByData = function(key, value) {
	  	if (value) {
		  	return this.filter(function () {
				return $(this).data(key) == value;
			});  		
	  	}
	  	return this.filter(function () {
			return $(this).data(key).length > 0;
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
	  $.fn.href = function(href) {
	  	if (href) {
	  		return this.attr("href", href)
	  	}
	  	return this.attr("href");
	  };
	  $.fn.src = function(src) {
	  	if (src) {
	  		return this.attr("src", src)
	  	}
	  	return this.attr("src");
	  };
	  $.fn.title = function(title) {
	  	if (title) {
	  		return this.attr("title", title)
	  	}
	  	return this.attr("title");
	  };
	  $.fn.checked = function(ischecked) {
	  	if (ischecked === true) {
	  		return this.attr("checked", "checked");
	  	}
	  	if (ischecked === false) {
	  		return this.removeAttr("checked", "checked");
	  	}
	  };

	  $.fn.findByClass = function(classname) {
	  	return this.find("." + classname);
	  };

	  var newNotifier = function(clearonclick, onclear){
	  	var s = $("<small>").addClass(bb_classnames.notify).data(bb_datanames.count, 0);

	  	if (clearonclick) {
	  		s.click(function(){
		  		$(this).text("").data(bb_datanames.count, 0);
		  		if (onclear) {
		  			onclear();
		  		}
		  	});
	  	}
	  	return s;	  	
	  };

	  $.fn.addNotifier = function(onclear) {
	  	return this.after(newNotifier(true, onclear));
	  };
	  $.fn.appendNotifier = function(onclear) {
	  	return this.append(newNotifier(false, onclear));
	  };
	  $.fn.getNotifier = function() {
	  	var selector = "small." + bb_classnames.notify;
	  	var find = this.find(selector);
	  	if (find.length) {
	  		return find;
	  	}
	  	var next = this.next(selector);
	  	return next;
	  };
	  $.fn.incrementData = function(key, inc) {
	  	return this.data(key, this.data(key) + inc);
	  };
	})(jQuery);

	String.prototype.remove = function(r) { return this.replace(r, ''); };
	String.prototype.removePrefix = function(r) { return this.remove(/^bb\-/); };

	var body = $(document.body);
	var wrapper = $("div.wrapper");
	var dashboard = $("div.dashboard", wrapper);
	var birdBlock, mentionsModule, searchModule, optionsModule;

	var regex = {
		scheme: /^http[s]?:\/\/(www\.)*/,
		trailingid: /\/[\d\/]+$/g,
		trailing: /[\/\-\.\s]$/,
		fileext: /(.html|.php|.aspx)/i,
		querystring: /\?.*$/,
	};

	var iconUrls = {
		default: chrome.extension.getURL("img/twitter_32.png"),
		notify: chrome.extension.getURL("img/twitter_32_notify.png")
	};

	var applyCss = function (options) {
		for (var key in options.styles) {
			bb_classnames[key] = "bb-" + key;
			body.toggleClass(bb_classnames[key], options.styles[key]);
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

	var expandUrls = function() {
		$("a[data-ultimate-url], a[data-expanded-url]").not("a." + bb_classnames.expand).each(function() {
			var a = $(this);
			var u = a.data("ultimate-url") || a.data("expanded-url");
			a.data(bb_datanames.originaltext, $(this).text()).text(abbrevUrl(u)).addClass(bb_classnames.expand);
		});
	};

	var restoreUrls = function(){
		$("a." + bb_classnames.expand).filterByData(bb_datanames.originaltext).each(function() {
			var a = $(this);
			a.text(a.data(bb_datanames.originaltext)).removeClass(bb_classnames.expand);
		});			
	};

	var bb_modules = [];

	var createModule = function(classname, title, iconurl) {
		var h = $("<h3>").text(title).title("Click to expand or hide");

		var d = $("<div>").addClass(bb_classnames.content).toggle(!options.collapse[classname.removePrefix()]);
		var f = $("<div class='flex-module' />").append(h).append(d);
		var m = $("<div class='module' />").addClass(bb_classnames.module).addClass(classname).append(f);

		h.click(function(){
			d.slideToggle("fast", function () {
				options.collapse[classname.removePrefix()] = !$(this).is(":visible");
				saveOptions();
			});				
		}).addClass("pointer");

		var img;
		if (iconurl) {
			img = $("<img>").addClass("bb-icon").src(iconurl).title("Click to clear notifications").click(function(){
				m.clearAllNotifiers();
				return false;
			});
			h.append(img);
		}

		m.content = d;
		m.title = h;
		m.icon = img;

		m.updateTitleNotifier = function () {
			var notifiers = m.content.findByClass(bb_classnames.notify);
			var total = 0;
			notifiers.each(function(){
				total += $(this).data(bb_datanames.count);
			});
			var notifier = m.title.getNotifier();
			if (total > 0) {
				notifier.text(total + " new").data(bb_datanames.count, total);
				m.icon.addClass(bb_classnames.notify).src(iconUrls.notify);
			} else {
				notifier.text("").data(bb_datanames.count, 0);
				m.icon.removeClass(bb_classnames.notify).src(iconUrls.default);
			}
			updateBrowserIcon();
			return total;
		};

		m.clearAllNotifiers = function() {
			m.content.findByClass(bb_classnames.notify)
				.text("")
				.data(bb_datanames.count, 0);
			m.updateTitleNotifier();
		};

		bb_modules.push(m);
		return m;
	};

	var updateBrowserIcon = function() {
		var total = 0;
		bb_modules.forEach(function(module) {
			module.title.getNotifier().each(function() {
				total += $(this).data(bb_datanames.count);
			});
		});
		chrome.extension.sendRequest({ type: "set-icon", notify: total > 0 });
	};

	var getSavedSearches = function () {
		if (searchModule === undefined) {
			searchModule = createModule(bb_classnames.savedsearch, "Saved Searches", iconUrls.default);
			searchModule.title.appendNotifier();
			birdBlock.append(searchModule.hide());
		}

		var updateSavedSearch = function (q, response) {
			var count = response.results.length;
			var datakey = "search-query";

			var a = searchModule.content.findByData("a", datakey, q);
			if (a.length == 0) {
				a = $("<a>").data(datakey, q).href("/#!/search/" + encodeURIComponent(q)).text(q)
					.addNotifier(searchModule.updateTitleNotifier)
					.click(function(){
						$(this).getNotifier()
						.text("")
						.data(bb_datanames.count, 0);
						searchModule.updateTitleNotifier();
					});					
				searchModule.content.append($("<p>").append(a));
			}
			var notifier = a.getNotifier().incrementData(bb_datanames.count, count);
			var newcount = notifier.data(bb_datanames.count);
			if (newcount > 0) {
				notifier.text(newcount + " new");
			}
			searchModule.updateTitleNotifier();
		};

		var searches = $("div.typeahead-items > ul > li > a");
		if (searches.length > 0) {
			searches.each(function () {
				var a = $(this);
				var q = a.data("search-query");
				chrome.extension.sendRequest({ type: "do-search", q: q }, function(response) {
					updateSavedSearch(q, response);
				});
			});
			searchModule.show();
		}
		return searches.length;
	};

	var getMentions = function () {
		var datakey = "screen-name";
		if (mentionsModule === undefined) {
			mentionsModule = createModule(bb_classnames.mentions, "@Mentions", iconUrls.default);
			mentionsModule.title.appendNotifier();
			birdBlock.append(mentionsModule.hide());
		}

		var updateMentions = function (q, response) {
			var count = response.results.length;
			var a = mentionsModule.content.findByData("a", datakey, q);
			if (a.length == 0) {
				a = $("<a>").data(datakey, q).href("/#!/mentions").text(q.remove('@'))
					.addNotifier(mentionsModule.updateTitleNotifier)
					.click(function(){
						$(this).getNotifier()
						.text("")
						.data(bb_datanames.count, 0);
						searchModule.updateTitleNotifier();
					});
				mentionsModule.content.append($("<p>").append(a));
			}
			var notifier = a.getNotifier().incrementData(bb_datanames.count, count);
			var newcount = notifier.data(bb_datanames.count);
			if (newcount > 0) {
				notifier.text(newcount + " new");
			}
			mentionsModule.updateTitleNotifier();
		};

		var searches = $("a.account-summary div.account-group").first();

		if (searches.length > 0) {
			searches.each(function () {
				var d = $(this);
				var q = d.data(datakey);

				chrome.extension.sendRequest({ type: "do-search", q: q }, function(response) {
					updateMentions(q, response);
				});
			});
			mentionsModule.show();
		}
		return searches.length;
	};

	var removeRedirects = function() {
		$("a[data-ultimate-url], a[data-expanded-url]").not("a." + bb_classnames.direct).each(function() {
			var a = $(this);
			var u = a.data("ultimate-url") || a.data("expanded-url");
			a.data(bb_datanames.originalhref, $(this).href()).href(u).addClass(bb_classnames.direct);
		});
	};

	var restoreRedirects = function(){
		$("a." + bb_classnames.direct).filterByData(bb_datanames.originalhref).each(function() {
			var a = $(this);
			a.href(a.data(bb_datanames.originalhref)).removeClass(bb_classnames.direct);
		});			
	};

	var directToProfile = function(scope) {
		$("a.js-user-profile-link").removeClass("js-account-group js-action-profile js-user-profile-link");
		$("a.twitter-atreply").removeClass("twitter-atreply pretty-link");
	};

	var createOptionsModule = function() {
		optionsModule = createModule(bb_classnames.options, "Better Bird settings", chrome.extension.getURL("img/twitter_32.png"));
		
		addOptionCheckbox("expandurls", "Expand URLs", function(option) {
			if (option === true) {
				expandUrls();
				removeRedirects();
			} else {
				restoreUrls();
				restoreRedirects();
			}
		});
		addStyleOptionCheckbox("columnswitch", "Switch columns");
		addStyleOptionCheckbox("columnwide", "Widen content");
		addStyleOptionCheckbox("font", "Use serif font");
		addStyleOptionCheckbox("hidewho", "Hide “Who to follow”");
		addStyleOptionCheckbox("hidetrends", "Hide “Trends”");

		optionsModule.content.append($("<p>").append($("<small>").append("Created by ").append($("<a>").text("Matt Sherman").href("/#!/clipperhouse"))));
		birdBlock.append(optionsModule);
	};

	var addOptionCheckbox = function(optionkey, labeltext, callback) {
		var cb = $("<input type='checkbox'>")
				 .id("bb-option-" + optionkey).checked(options[optionkey])
				 .change(function() {
				 	options[optionkey] = $(this).is(":checked");
					saveOptions();
					if (callback) {
						callback(options[optionkey]);
					}
				 });
		var label = $("<label>").text(labeltext).for(cb);
		var br = $("<br>")
		
		optionsModule.content.append(cb).append(label).append(br);
	};

	var addStyleOptionCheckbox = function(optionkey, labeltext) {
		var cb = $("<input type='checkbox'>")
				 .id("bb-option-style-" + optionkey).checked(options.styles[optionkey])
				 .change(function() {
				 	options.styles[optionkey] = $(this).is(":checked");
					body.toggleClass(bb_classnames[optionkey], options.styles[optionkey]);
					saveOptions();
				 });
		var label = $("<label>").text(labeltext).for(cb);
		var br = $("<br>")
		
		optionsModule.content.append(cb).append(label).append(br);
	};

	var createBirdBlock = function() {
		birdBlock = $("<div>").addClass(bb_classnames.birdblock);
		$("div.mini-profile", dashboard).after(birdBlock);
	};

	var options;
	var saveOptions = function() {
		chrome.extension.sendRequest({ type: "save-options", options: options });
	};

	var urlinterval, searchinterval, mentionsinterval;

	var BetterBird = (function () {
		return {
			Init: function() {
				clearInterval(urlinterval);
				clearInterval(searchinterval);
				clearInterval(mentionsinterval);
				var numsearches = 0, nummentions = 0;
				var searchesperhour = 150;

				chrome.extension.sendRequest({ "type": "load-options" }, function (response) {
					options = response;
					applyCss(options);
					setTimeout(function() {					// a little time for the ajax to populate
						createBirdBlock();
						
						urlinterval = setInterval(function() {
							var stream = $("div.stream");
							if (options.expandurls) {
								expandUrls();
								removeRedirects();
							}
							if (options.directtoprofile) {
								directToProfile(stream);
							}
						}, 1500);
						if (options.mentions) {
							nummentions = getMentions();
						}
						if (options.savedsearches) {
							numsearches = getSavedSearches();
						}
						createOptionsModule();

						setTimeout(function() {
							var searchtime = 60 * 60 * 1000 * (numsearches + nummentions) / searchesperhour;	// rate-limit
							if (nummentions > 0) {
								mentionsinterval = setInterval(function(){
									getMentions();
								}, searchtime);
							}

							if (numsearches > 0) {
								searchinterval = setInterval(function(){
									getSavedSearches();
								}, searchtime);
							}
						}, 10000);

					}, 1500);

					setInterval(function() {
						$("div.module.trends").removeAttr("style");	// pesky thing comes in late with display:block
					}, 3000);
				});
			}			
		};
	})();

	var isloggedin = $(document.body).is(".logged-in");
	if (isloggedin) {
		BetterBird.Init();
	}
})()
