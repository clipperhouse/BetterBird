(function () {
	(function($) {
	  $.fn.filterByData = function(key, value) {
	  	if (value) {
		  	return this.filter(function () {
				return $(this).data(key) == value;
			});  		
	  	}
	  	return this.filter(function () {
			return $(this).data(key) != null;
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

	  $.fn.incrementData = function(key, inc) {
	  	return this.data(key, this.data(key) + inc);
	  };
	})(jQuery);

	String.prototype.remove = function(r) { return this.replace(r, ''); };
	String.prototype.removePrefix = function(r) { return this.remove(/^bb\-/); };
	String.prototype.last = function() { return this[this.length - 1]; };
	String.prototype.contains = function(s) { return this.indexOf(s) > -1; };
	String.prototype.startsWith = function(s) { return this.indexOf(s) == 0; };
})();