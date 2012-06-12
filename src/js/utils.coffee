(($) ->
  $.fn.filterByData = (key, value) ->
    if value
      return @filter(->
        $(this).data(key) is value
      )
    @filter ->
      $(this).data(key)?

  $.fn.findByData = (selector, key, value) ->
    @find(selector).filterByData key, value

  attributeFn = (j, name, value) ->
    return j.attr(name, value)  if value
    j.attr name

  $.fn.id = (id) ->
    attributeFn this, "id", id

  $.fn.href = (href) ->
    attributeFn this, "href", href

  $.fn.src = (src) ->
    attributeFn this, "src", src

  $.fn.title = (title) ->
    attributeFn this, "title", title

  $.fn.attrfor = (obj) ->
    return attributeFn(this, "for", obj.id())  if obj.id()
    attributeFn this, "for", obj

  $.fn.checked = (ischecked) ->
    return @attr("checked", "checked")  if ischecked is true
    @removeAttr "checked", "checked"  if ischecked is false

  $.fn.findByClass = (classname) ->
    @find "." + classname

  $.fn.incrementData = (key, inc) ->
    @data key, @data(key) + inc
) jQuery
String::remove = (r) ->
  @replace r, ""

String::removePrefix = (r) ->
  @remove /^bb\-/

String::last = ->
  this[@length - 1]

String::contains = (s) ->
  @indexOf(s) > -1

String::startsWith = (s) ->
  @indexOf(s) is 0