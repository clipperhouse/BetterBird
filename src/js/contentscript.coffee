bb_classnames =
  module: "bb-module"
  expand: "bb-expand"
  direct: "bb-direct"
  savedsearch: "bb-savedsearch"
  options: "bb-options"
  birdblock: "bb-birdblock"
  content: "bb-content"
  mentions: "bb-mentions"
  notify: "bb-notify"
  clear: "bb-clear"

bb_datanames =
  originaltext: "bb-originaltext"
  originalhref: "bb-originalhref"
  count: "bb-count"

(($) ->
  newNotifier = ->
    $("<small>").addClass(bb_classnames.notify).data bb_datanames.count, 0

  $.fn.addNotifier = ->
    @append newNotifier()

  $.fn.appendNotifier = ->
    @append newNotifier()

  $.fn.appendClear = (f) ->
    if f
      c = $("<a>").addClass(bb_classnames.clear).text("Clear").click(->
        f()
        false
      )
      return @append(" &nbsp; ").append(c)
    this

  $.fn.getNotifier = ->
    return this  if @isNotifier()
    selector = "small." + bb_classnames.notify
    find = @find(selector)
    return find  if find.length
    @next selector

  $.fn.getNotifierCount = ->
    @getNotifier().data bb_datanames.count

  $.fn.updateNotifier = (count, isincrement) ->
    n = @getNotifier()
    count += n.getNotifierCount()  if isincrement
    if n.length
      return n.data(bb_datanames.count, count).text(count + " new")  if count > 0
      return n.data(bb_datanames.count, count).text("")
    this

  $.fn.incrementNotifier = (count) ->
    @updateNotifier count, true

  $.fn.isNotifier = ->
    @hasClass bb_classnames.notify

  $.fn.hasNotifier = ->
    @getNotifier().length > 0

  $.fn.clearNotifier = ->
    @getNotifier().text("").data bb_datanames.count, 0
) jQuery

filterRTs = (element) ->
  element["text"]? and element["text"].indexOf("RT ") isnt 0

filterUser = (username) ->
  (element) ->
    element["from_user"]? and element["from_user"] isnt username.remove("@")

body = $(document.body)
wrapper = $("div.wrapper")
dashboard = $("div.dashboard", wrapper)
birdBlock = undefined
mentionsModule = undefined
searchModule = undefined
optionsModule = undefined
regex =
  scheme: /^http[s]?:\/\/(www\.)*/
  trailingid: /\/\d+$/g
  trailing: /[\/\-\.\s]$/
  fileext: /(.html|.htm|.jpg|.php|.aspx|.story)/i
  querystring: /\?.*$/
  nyt: /www10\.nytimes/
  urlparts: /[\/\?]+/g

iconUrls =
  base: chrome.extension.getURL("img/twitter_32.png")
  notify: chrome.extension.getURL("img/twitter_32_notify.png")

checkVersionUpdate = (callback) ->
  chrome.extension.sendRequest
    type: "check-update"
  , callback

applyCss = (options) ->
  for key of options.styles
    bb_classnames[key] = "bb-" + key
    body.toggleClass bb_classnames[key], options.styles[key]
  $("div#page-node-home").show()

abbrevUrl = (url) ->
  url = decodeURIComponent(url).remove(regex.scheme)
  return url  if url.split(regex.urlparts).length <= 2
  parts = url.replace(regex.nyt, "nytimes").remove(regex.querystring).remove(regex.fileext).remove(regex.trailing).remove(regex.trailingid).split(regex.urlparts)
  return parts.join("/")  if parts.length <= 2
  parts.splice 1, parts.length - 2, "…"
  parts[@length] = parts[@length].split("-").slice(0, 6).join("-").split("_").slice(0, 6).join("_")
  parts.join "/"

expandUrls = ->
  $("a[data-ultimate-url], a[data-expanded-url]").not("a." + bb_classnames.expand).each ->
    a = $(this)
    u = (a.data("ultimate-url") or a.data("expanded-url")).replace(regex.nyt, "nytimes")
    a.data(bb_datanames.originaltext, $(this).text()).href(u).text(abbrevUrl(u)).addClass(bb_classnames.expand).removeAttr("data-ultimate-url").removeAttr "data-expanded-url"

restoreUrls = ->
  $("a." + bb_classnames.expand).filterByData(bb_datanames.originaltext).each ->
    a = $(this)
    a.text(a.data(bb_datanames.originaltext)).removeClass bb_classnames.expand

bb_modules = []
createModule = (classname, title, iconurl) ->
  h = $("<h3>").text(title).title("Hover to expand")
  d = $("<div>").addClass(bb_classnames.content).toggle(not options.collapse[classname.removePrefix()])
  f = $("<div class='flex-module' />").append(h).append(d)
  m = $("<div class='module' />").addClass(bb_classnames.module).addClass(classname).append(f)
  img = undefined
  if iconurl
    img = $("<img>").addClass("bb-icon").src(iconurl)
    h.append img
  m.content = d
  m.title = h
  m.icon = img
  m.clearAllNotifiers = ->
    m.content.findByClass(bb_classnames.notify).updateNotifier 0
    updateTitleNotifier m
    updateBrowserIcon true

  m.hoverIntent (->
    m.content.slideDown "fast"
  ), ->
    m.content.slideUp()  if not h.hasNotifier() or h.getNotifierCount() is 0

  m.hover (->
    $(this).findByClass(bb_classnames.clear).fadeIn "fast"
  ), ->
    $(this).findByClass(bb_classnames.clear).fadeOut "fast"

  bb_modules.push m
  m

updateBrowserIcon = (notify) ->
  chrome.extension.sendRequest
    type: "set-icon"
    notify: notify

updateTitleNotifiers = ->
  total = 0
  bb_modules.forEach (module) ->
    notifier = module.title.getNotifier().first()
    if notifier.length
      count = notifier.getNotifierCount()
      unless module.is(":hover")
        if count
          module.content.slideDown()
        else
          module.content.slideUp()
      total += count

updateTitleNotifier = (m) ->
  notifiers = m.content.findByClass(bb_classnames.notify)
  total = 0
  notifiers.each ->
    total += $(this).getNotifierCount()

  notifier = m.title.getNotifier()
  if total > 0
    notifier.updateNotifier(total).appendClear(m.clearAllNotifiers).fadeIn "fast"
    m.icon.addClass(bb_classnames.notify).src iconUrls.notify
  else
    notifier.fadeOut("fast").updateNotifier 0
    m.icon.removeClass(bb_classnames.notify).src iconUrls.base
  total

createSearchModule = ->
  searchModule = createModule(bb_classnames.savedsearch, "Saved Searches", iconUrls.base)
  searchModule.title.appendNotifier searchModule.clearAllNotifiers
  searchModule.hide()
  birdBlock.append searchModule

searches = []
searchesperhour = 150
typeahead = undefined

startSavedSearches = ->
  $("#search-query").focus().blur()
  createSearchModule()
  pollTypeahead()

pollTypeahead = -> 
  typeahead = $(".typeahead-searches[data-search-query]")
  return searchAll() if typeahead.length > 0
  setTimeout pollTypeahead, 1000

updateSearches = ->
  elements = $("a[data-search-query]", typeahead)
  searches = $.map elements, (a) ->
    $(a).data "search-query"  

searchAll = ->
  updateSearches()
  searches.forEach doSearch
  searchModule.show() if searches.length
  searchtime = 60 * 60 * 1000 * (searches.length + 1) / searchesperhour
  setTimeout searchAll, searchtime

doSearch = (q) ->
  chrome.extension.sendRequest
    type: "do-search"
    q: q
  , updateSavedSearch

updateSavedSearch = (response) ->
  q = decodeURIComponent(response.query).replace("+", " ")
  count = response.results.filter(filterRTs).length
  datakey = "search-query"
  a = searchModule.content.findByData("a", datakey, q)
  if a.length is 0
    a = $("<a>").data(datakey, q).href("/#!/search/realtime/" + encodeURIComponent(q)).text(q).addNotifier().click(->
      $(this).clearNotifier()
      updateTitleNotifier searchModule
    )
    searchModule.content.append $("<p>").append(a)
  a.incrementNotifier count
  updateTitleNotifier searchModule

mentions = []
startMentions = ->
  createMentionsModule()
  elements = $("a.account-summary div.account-group").first()
  mentions = $.map(elements, (a) ->
    "@" + $(a).data("screen-name")
  )
  if mentions.length
    mentionsAll()
    searchtime = 60 * 60 * 1000 * (searches.length + 1) / searchesperhour
    setInterval mentionsAll, searchtime

createMentionsModule = ->
  mentionsModule = createModule(bb_classnames.mentions, "Mentions", iconUrls.base)
  mentionsModule.title.appendNotifier()
  mentionsModule.content.hide()
  searchModule.before mentionsModule

updateMentions = (response) ->
  q = decodeURIComponent(response.query).replace("+", " ")
  count = response.results.filter(filterRTs).filter(filterUser(q)).length
  datakey = "search-query"
  a = mentionsModule.content.findByData("a", datakey, q)
  if a.length is 0
    a = $("<a>").data(datakey, q).href("/#!/mentions/").text(q).addNotifier().click(->
      $(this).clearNotifier()
      updateTitleNotifier mentionsModule
    )
    mentionsModule.content.append $("<p>").append(a)
  a.incrementNotifier count
  updateTitleNotifier mentionsModule

mentionsAll = ->
  mentions.forEach doMentions

doMentions = (q) ->
  chrome.extension.sendRequest
    type: "do-search"
    q: q
  , updateMentions

removeRedirects = ->
  $("a[data-ultimate-url], a[data-expanded-url]").not("a." + bb_classnames.direct).each ->
    a = $(this)
    u = a.data("ultimate-url") or a.data("expanded-url")
    u = u.replace(regex.nyt, "nytimes")
    a.data(bb_datanames.originalhref, $(this).href()).href(u).addClass bb_classnames.direct

restoreRedirects = ->
  $("a." + bb_classnames.direct).filterByData(bb_datanames.originalhref).each ->
    a = $(this)
    a.href(a.data(bb_datanames.originalhref)).removeClass bb_classnames.direct

createOptionsModule = ->
  optionsModule = createModule(bb_classnames.options, "Better Bird settings", chrome.extension.getURL("img/twitter_32.png"))
  addOptionCheckbox "expandurls", "Expand URLs", (option) ->
    if option is true
      expandUrls()
      removeRedirects()
    else
      restoreUrls()
      restoreRedirects()

  addStyleOptionCheckbox "columnswitch", "Switch columns"
  addStyleOptionCheckbox "columnwide", "Widen content"
  addStyleOptionCheckbox "font", "Use serif font"
  addStyleOptionCheckbox "hidediscover", "Hide #Discover"
  addStyleOptionCheckbox "hidepromoted", "Hide Promoted tweets"
  addStyleOptionCheckbox "hidewho", "Hide “Who to follow”"
  addStyleOptionCheckbox "hidetrends", "Hide “Trends”"
  optionsModule.content.append $("<p>").append($("<small>").append("Created by ").append($("<a>").text("Matt Sherman").href("/#!/clipperhouse")))
  checkVersionUpdate (updated) ->
    optionsModule.content.hide()  unless updated
    birdBlock.append optionsModule

addOptionCheckbox = (optionkey, labeltext, callback) ->
  cb = $("<input type='checkbox'>").id("bb-option-" + optionkey).checked(options[optionkey]).change(->
    options[optionkey] = $(this).is(":checked")
    saveOptions()
    callback options[optionkey]  if callback
  )
  label = $("<label>").text(labeltext).attrfor(cb)
  br = $("<br>")
  optionsModule.content.append(cb).append(label).append br

addStyleOptionCheckbox = (optionkey, labeltext) ->
  cb = $("<input type='checkbox'>").id("bb-option-style-" + optionkey).checked(options.styles[optionkey]).change(->
    options.styles[optionkey] = $(this).is(":checked")
    body.toggleClass bb_classnames[optionkey], options.styles[optionkey]
    saveOptions()
  )
  label = $("<label>").text(labeltext).attrfor(cb)
  br = $("<br>")
  optionsModule.content.append(cb).append(label).append br

createBirdBlock = ->
  birdBlock = $("<div>").addClass(bb_classnames.birdblock)
  $("div.mini-profile", dashboard).after birdBlock

wrapModules = ->
  trendswrapper = $("<div>").addClass("bb-wrapper-trends")
  $("div.module.trends", dashboard).wrap trendswrapper
  whowrapper = $("<div>").addClass("bb-wrapper-who")
  $("div[data-component-term='user_recommendations']", dashboard).wrap whowrapper

options = undefined
saveOptions = ->
  chrome.extension.sendRequest
    type: "save-options"
    options: options

hasRun = ->
  chrome.extension.sendRequest type: "has-run"

urlinterval = undefined
BetterBird = Init: ->
  clearInterval urlinterval
  chrome.extension.sendRequest
    type: "load-options", (response) ->
      options = response
      applyCss options
      setTimeout (->
        createBirdBlock()
        urlinterval = setInterval(->
          stream = $("div.stream")
          if options.expandurls
            expandUrls()
            removeRedirects()
        , 1500)
        if options.savedsearches
          startSavedSearches()
          startMentions()
        createOptionsModule()
        setInterval updateTitleNotifiers, 2000
        wrapModules()
      ), 1500
      $(window).unload ->
        hasRun()

  chrome.extension.onRequest.addListener (request, sender, callback) ->
    switch request.type
      when "go-home"
        document.location.href = $("li#global-nav-home > a").href()
        scroll 0, 0
      else

BetterBird.Init()  if $(document.body).is(".logged-in")
