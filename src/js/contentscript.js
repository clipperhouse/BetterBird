
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
		notify: "bb-notify",
		clear: "bb-clear"
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

	  var attributeFn = function(j, name, value) {
	  	if (value) {
	  		return j.attr(name, value)
	  	}
	  	return j.attr(name);
	  };

	  $.fn.id = function(id) {
	  	return attributeFn(this, "id", id);	  	
	  };
	  $.fn.href = function(href) {
	  	return attributeFn(this, "href", href);	  	
	  };

	  $.fn.src = function(src) {
	  	return attributeFn(this, "src", src);	  	
	  };

  	  $.fn.title = function(title) {
	  	return attributeFn(this, "title", title);	  	
	  };

  	  $.fn.for = function(obj) {
  	  	if (obj.id()) {
  	  		return attributeFn(this, "for", obj.id())
  	  	}
	  	return attributeFn(this, "for", obj);	  	
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

	  var newNotifier = function(){
	  	var s = $("<small>").addClass(bb_classnames.notify).data(bb_datanames.count, 0);
	  	return s;	  	
	  };

	  $.fn.addNotifier = function() {
	  	return this.append(newNotifier());
	  };

	  $.fn.appendNotifier = function() {
	  	return this.append(newNotifier());
	  };

	  $.fn.appendClear = function(f) {	  	
	  	if (f) {
	  		var c = $("<a>").addClass(bb_classnames.clear).text("Clear").click(function(){
	  			f();
	  			return false;
	  		});
	  		return this.append(" &nbsp; ").append(c);
	  	}
	  	return this;
	  };

	  $.fn.getNotifier = function() {
	  	if (this.isNotifier()) {
  	  		return this;
  	  	}
	  	var selector = "small." + bb_classnames.notify;
	  	var find = this.find(selector);
	  	if (find.length) {
	  		return find;
	  	}
	  	var next = this.next(selector);
	  	return next;
	  };

  	  $.fn.getNotifierCount = function() {
	  	return this.getNotifier().data(bb_datanames.count);
	  };

  	  $.fn.updateNotifier = function(count, isincrement) {
  	  	var n = this.getNotifier();
  	  	if (isincrement) {
  	  		count += n.getNotifierCount();
  	  	}
  	  	if (n.length) {
	  	  	if (count > 0) {
	  	  		return n.data(bb_datanames.count, count).text(count + " new");
	  	  	}
  	  		return n.data(bb_datanames.count, count).text("");
  	  	}
	  	return this;
	  };

  	  $.fn.incrementNotifier = function(count) {
  	  	return this.updateNotifier(count, true);
	  };

  	  $.fn.isNotifier = function() {
	  	return this.hasClass(bb_classnames.notify);
	  };

  	  $.fn.hasNotifier = function() {
	  	return this.getNotifier().length > 0;
	  };

  	  $.fn.clearNotifier = function() {
	  	return this.getNotifier().text("").data(bb_datanames.count, 0);
	  };

	  $.fn.incrementData = function(key, inc) {
	  	return this.data(key, this.data(key) + inc);
	  };
	})(jQuery);

	String.prototype.remove = function(r) { return this.replace(r, ''); };
	String.prototype.removePrefix = function(r) { return this.remove(/^bb\-/); };
	String.prototype.last = function() { return this[this.length - 1]; };

	var body = $(document.body);
	var wrapper = $("div.wrapper");
	var dashboard = $("div.dashboard", wrapper);
	var birdBlock, mentionsModule, searchModule, optionsModule;

	var regex = {
		scheme: /^http[s]?:\/\/(www\.)*/,
		trailingid: /\/[A-Z]*[\d\/]+$/gi,
		trailing: /[\/\-\.\s]$/,
		fileext: /(.html|.php|.aspx)/i,
		querystring: /\?.*$/,
		nyt: /www10\.nytimes/
	};

	var iconUrls = {
		default: chrome.extension.getURL("img/twitter_32.png"),
		notify: chrome.extension.getURL("img/twitter_32_notify.png")
	};

	var checkVersionUpdate = function (callback) {
		chrome.extension.sendRequest({ type: "check-update" }, callback);
	};

	var applyCss = function (options) {
		for (var key in options.styles) {
			bb_classnames[key] = "bb-" + key;
			body.toggleClass(bb_classnames[key], options.styles[key]);
		}
		$("div#page-node-home").show();
	};

	var abbrevUrl = function(url) {
		var parts = decodeURIComponent(url
			.remove(regex.scheme)
			.replace(regex.nyt, 'nytimes')
			.remove(regex.querystring)
			.remove(regex.fileext)
			.remove(regex.trailingid)
			.remove(regex.trailing)
			).split('/');
		if (parts.length <= 2) {
			return parts.join('/');
		}
		parts.splice(1, parts.length - 2, "…");
		parts[this.length] = parts[this.length].split('-').slice(0, 6).join("-");
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
		var h = $("<h3>").text(title).title("Hover to expand");

		var d = $("<div>").addClass(bb_classnames.content).toggle(!options.collapse[classname.removePrefix()]);
		var f = $("<div class='flex-module' />").append(h).append(d);
		var m = $("<div class='module' />").addClass(bb_classnames.module).addClass(classname).append(f);

		var img;
		if (iconurl) {
			img = $("<img>").addClass("bb-icon").src(iconurl);
			h.append(img);
		}

		m.content = d;
		m.title = h;
		m.icon = img;

		m.clearAllNotifiers = function() {
			m.content.findByClass(bb_classnames.notify).updateNotifier(0);
			updateTitleNotifier(m);
			updateBrowserIcon(true);
		};

		m.hoverIntent(
			function() {
				m.content.slideDown("fast");
			},
			function() {
				if (!h.hasNotifier() || h.getNotifierCount() == 0) {
					m.content.slideUp();
				}
			}
		);

		m.hover(
			function(){
				$(this).findByClass(bb_classnames.clear).fadeIn("fast");
			}, 
			function(){
				$(this).findByClass(bb_classnames.clear).fadeOut("fast");
			}
		);

		bb_modules.push(m);
		return m;
	};

	var updateBrowserIcon = function(notify) {
		chrome.extension.sendRequest({ type: "set-icon", notify: notify });
	};

	var updateTitleNotifiers = function(){
		var total = 0;
		bb_modules.forEach(function(module) {
			var notifier = module.title.getNotifier().first();
			if (notifier.length) {
				var count = notifier.getNotifierCount();
				if (!(module.is(":hover"))) {
					if (count) {
						module.content.slideDown();
					} else {
						module.content.slideUp();
					}
				}
				total += count;
			}
		});
	};

	var updateTitleNotifier = function (m) {
		var notifiers = m.content.findByClass(bb_classnames.notify);
		var total = 0;
		notifiers.each(function(){
			total += $(this).getNotifierCount();
		});
		var notifier = m.title.getNotifier();
		if (total > 0) {
			notifier.updateNotifier(total)
				.appendClear(m.clearAllNotifiers)
				.fadeIn("fast");
			m.icon.addClass(bb_classnames.notify).src(iconUrls.notify);
		} else {
			notifier.fadeOut("fast").updateNotifier(0);
			m.icon.removeClass(bb_classnames.notify).src(iconUrls.default);
		}
		return total;
	};

	var createSearchModule = function () {
		if (searchModule === undefined) {
			searchModule = createModule(bb_classnames.savedsearch, "Saved Searches", iconUrls.default);
			searchModule.title.appendNotifier(searchModule.clearAllNotifiers);
			searchModule.content.hide();
			birdBlock.append(searchModule);
		}
	};

	var searches = [];
	var searchesperhour = 150;
	var startSavedSearches = function () {
		createSearchModule();

		var elements = $("div.typeahead-items > ul > li > a");
		searches = $.map(elements, function (a) {
			return $(a).data("search-query");
		});

		if (searches.length) {
			searchAll();
            var searchtime = 60 * 60 * 1000 * (searches.length + 1) / searchesperhour;    // rate-limit
            setInterval(searchAll, searchtime);
		}
	};

	var searchAll = function() {
    	for (var i in searches) {
    		doSearch(searches[i]);
    	}		
	};

	var doSearch = function(q) {
		chrome.extension.sendRequest({ type: "do-search", q: q }, updateSavedSearch);
	};

	var updateSavedSearch = function (response) {
		var q = decodeURIComponent(response.query).replace('+', ' ');
		var count = response.results.length;
		var datakey = "search-query";

		var a = searchModule.content.findByData("a", datakey, q);
		if (a.length == 0) {
			a = $("<a>").data(datakey, q).href("/#!/search/" + encodeURIComponent(q)).text(q)
				.addNotifier()
				.click(function(){
					$(this).clearNotifier();
					updateTitleNotifier(searchModule);
				});
			searchModule.content.append($("<p>").append(a));
		}
		a.incrementNotifier(count);
		updateTitleNotifier(searchModule);
	};

	var mentions = [];
	var startMentions = function () {
		createMentionsModule();

		var elements = $("a.account-summary div.account-group").first();
		mentions = $.map(elements, function (a) {
			return $(a).data("screen-name");
		});

		if (mentions.length) {
			mentionsAll();
            var searchtime = 60 * 60 * 1000 * (searches.length + 1) / searchesperhour;    // rate-limit
            setInterval(mentionsAll, searchtime);
		}
	};

	var createMentionsModule = function () {
		if (mentionsModule === undefined) {
			mentionsModule = createModule(bb_classnames.mentions, "@Mentions", iconUrls.default);
			mentionsModule.title.appendNotifier();
			mentionsModule.content.hide();
			searchModule.before(mentionsModule);
		}
	};

	var updateMentions = function (response) {
		var q = decodeURIComponent(response.query).replace('+', ' ');
		var count = response.results.length;
		var datakey = "search-query";

		var a = mentionsModule.content.findByData("a", datakey, q);
		if (a.length == 0) {
			a = $("<a>").data(datakey, q).href("/#!/mentions/").text(q)
				.addNotifier()
				.click(function(){
					$(this).clearNotifier();
					updateTitleNotifier(mentionsModule);
				});
			mentionsModule.content.append($("<p>").append(a));
		}
		a.incrementNotifier(count);
		updateTitleNotifier(mentionsModule);
	};

	var mentionsAll = function() {
    	for (var i in mentions) {
    		doMentions(mentions[i]);
    	}		
	};

	var doMentions = function(q) {
		chrome.extension.sendRequest({ type: "do-search", q: q }, updateMentions);
	};

	var removeRedirects = function() {
		$("a[data-ultimate-url], a[data-expanded-url]").not("a." + bb_classnames.direct).each(function() {
			var a = $(this);
			var u = a.data("ultimate-url") || a.data("expanded-url");
			u = u.replace(regex.nyt, 'nytimes');
			a.data(bb_datanames.originalhref, $(this).href()).href(u).addClass(bb_classnames.direct);
		});
	};

	var restoreRedirects = function(){
		$("a." + bb_classnames.direct).filterByData(bb_datanames.originalhref).each(function() {
			var a = $(this);
			a.href(a.data(bb_datanames.originalhref)).removeClass(bb_classnames.direct);
		});			
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
		checkVersionUpdate(function (updated) {
			if (!updated) {
				optionsModule.content.hide();
			};
			birdBlock.append(optionsModule);
		});
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

	var wrapModules = function(){
		var trendswrapper = $("<div>").addClass("bb-wrapper-trends");
		$("div.module.trends", dashboard).wrap(trendswrapper);

		var whowrapper = $("<div>").addClass("bb-wrapper-who");
		$("div[data-component-term='user_recommendations']", dashboard).wrap(whowrapper);
	};

	var options;
	var saveOptions = function() {
		chrome.extension.sendRequest({ type: "save-options", options: options });
	};

	var hasRun = function() {
		chrome.extension.sendRequest({ type: "has-run" });
	};

	var urlinterval;

	var BetterBird = {
		Init: function() {
			clearInterval(urlinterval);

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
					}, 1500);

					if (options.savedsearches) {
						startSavedSearches();
						startMentions();
					}

					createOptionsModule();

					setInterval(updateTitleNotifiers, 2000);

					wrapModules();

				}, 1500);

				$(window).unload(function() {
				  hasRun();
				});
			});

			chrome.extension.onRequest.addListener(function(request, sender, callback) {
			    switch(request.type) {
			        case "go-home":
			            document.location.href = $("li#global-nav-home > a").href();
			            scroll(0,0);
			            break;
			        default:
			    }
			});
		}			
	};

	var isloggedin = $(document.body).is(".logged-in");
	if (isloggedin) {
		BetterBird.Init();
	}
})()
