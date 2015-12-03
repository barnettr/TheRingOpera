function positionOffscreen(id){
    $(id).addClassName('offscreen-positioned');
}

var PopOver = Class.create({
    initialize: function(sElements, options) {

        this.els = $$(sElements);
        this.options = Object.extend({
            wrapper: 'event-popover',
            inlineContent: false, // if not false, expects id of element
            eventType: 'mouseover',
            marginLeft: 10,
            marginTop: -45,
            minWidth: 500,
            animate: true,
            animationDuration: 0.3,
            outsideClick: true, // should the popover close when user clicks outside of the box?
            onOpen: 'popover:open',
            onClose: 'popover:close'
        }, options || {});

        if (Prototype.Browser.IE) {
            this.options.animate = false; // IE is not fancy enough for animations
        }

        this.create();

        for (var i = 0; i < this.els.length; i++) {
            this.els[i].observe(this.options.eventType, this._position.bindAsEventListener(this));
            this.els[i].observe("mouseout", this.closeDelay.bindAsEventListener(this));
        }
        $("event-popover").observe(this.options.eventType, this.cancelClose.bindAsEventListener(this));
        $("event-popover").observe("mouseout", this.closeDelay.bindAsEventListener(this));
    },

    cancelClose: function() {
        clearTimeout(this.closeTimer);
    },

    create: function() {
        // create popover wrapper and attach it to the body
        var eventWrapper = new Element('div', { 'id': this.options.wrapper });
        document.body.appendChild(eventWrapper);
        var wrapper = $(this.options.wrapper);
        wrapper.setStyle('position: absolute');
        wrapper.hide();
        // add the rest of the elements
        var hd = "<div class='hd'></div>";
        var bd = "<div class='bd1'><div class='bd2'><div class='bd3'></div></div></div>";
        var ft = "<div class='ft'><div class='aux'></div></div>";
        var closer = "<div class='pop-closer'></div>";
        var indicator = "<div class='pop-indicator'></div>";
        wrapper.insert(hd + bd + ft + closer + indicator);
        if (this.options.inlineContent != false) {
            this._insert();
        }
        wrapper.down('div.pop-closer').observe('click', this.close.bindAsEventListener(this));
    },

    _insert: function() {
        if (this.options.inlineContent == false || this.options.inlineContent == null) {
            return;
        }
        var dupe = $(this.options.inlineContent).cloneNode(true);
        dupe.id = this.options.inlineContent + '-pop';
        dupe.show();
        $(this.options.wrapper).down('div.bd3').insert(dupe);
    },

    _position: function(e) {
        this.cancelClose();
        var el = e.element();
        var elWidth = el.getWidth() + this.options.marginLeft; // width + margin
        var wrapper = $(this.options.wrapper);
        var offset = el.cumulativeOffset()[0] + elWidth + wrapper.getWidth();
        var indicator = $(this.options.wrapper).down('div.pop-indicator');
        indicator.removeClassName("right");
        indicator.removeClassName("left");
        // is there enough viewport space to add the popover to the right of the opener?
        if ((document.viewport.getWidth() >= this.options.minWidth) && (document.viewport.getWidth() <= offset)) {
            var left = -(wrapper.getWidth() + this.options.marginLeft);
            indicator.addClassName("right");
        }
        else {
            var left = elWidth;
            indicator.addClassName("left");
        }

        //wrapper.clonePositionIE(el, {setWidth: false, setHeight: false, offsetLeft: left, offsetTop: -20});
        // IE throws an error when using clonePosition within a table... very sad. Work-around:
        this.clonePosition(wrapper, el, { setWidth: false, setHeight: false, offsetLeft: left, offsetTop: this.options.marginTop });
        // all set? let's display the popover...
        this.open(el);
    },

    open: function(el) {
        if ($(this.options.wrapper)) {
            if (this.options.animate === true) {
                var toWidth = $(this.options.wrapper).getWidth();
                this.appear = new Effect.Appear(this.options.wrapper, {
                    duration: this.options.animationDuration,
                    beforeStart: function() {
                        el.fire(this.options.onOpen);
                    } .bind(this),
                    afterFinish: function() {
                        sIFR_staff_picks();
                    }
                });
            }
            else {
                $(this.options.wrapper).show();
                el.fire(this.options.onOpen);
            }
        }
        if (this.options.outsideClick === true) {
            Event.observe(document, 'click', this.__Click.bindAsEventListener(this));
        }
    },

    __Click: function(e) {
        var el = e.element();
        if (el.hasClassName('pop-closer') === true) {
            return;
        }
        else {
            // descendantOf fails with dynamically created elements
            var els = e.element().ancestors();

            for (var i = 0; i < els.length; i++) {
                if (els[i] == $(this.options.wrapper)) {
                    var flag = 1;
                }
            }

            if (flag !== 1) {
                this.close();
            }
        }
    },

    close: function() {
        if ($(this.options.wrapper)) {
            if (this.options.animate === true) {
                this.fade = new Effect.Fade(this.options.wrapper, { duration: this.options.animationDuration / 2 });
            }
            else {
                $(this.options.wrapper).hide();
            }
        }
        Event.stopObserving(document, 'click', this.close, true);
        // add original content to target header on close
        if (this.options.targetHeader) {
            $(this.options.targetHeader).update('<h4>events</h4>');
        }
    },

    closeDelay: function() {
        this.closeTimer = setTimeout(function() {
            if ($(this.options.wrapper)) {
                if (this.options.animate === true) {
                    this.fade = new Effect.Fade(this.options.wrapper, { duration: this.options.animationDuration / 2 });
                }
                else {
                    $(this.options.wrapper).hide();
                }
            }
            Event.stopObserving(document, 'click', this.close, true);
            // add original content to target header on close
            if (this.options.targetHeader) {
                $(this.options.targetHeader).update('<h4>events</h4>');
            }
        } .bind(this), 500);
    },

    clonePosition: function(element, source) {
        element = $(element);
        source = $(source);
        var s = element.style,
		  options = Object.extend({
		      setLeft: true,
		      setTop: true,
		      setWidth: true,
		      setHeight: true,
		      offsetTop: 0,
		      offsetLeft: 0
		  }, arguments[2] || {});

        // set element border, padding, and dimensions
        // before calculating any element offsets
        if (options.setHeight || options.setWidth) {
            var subtract = {},
			 dims = Element.getDimensions(source);
            if (options.setHeight)
                subtract.height = ['borderTopWidth', 'paddingTop', 'borderBottomWidth', 'paddingBottom'];
            if (options.setWidth)
                subtract.width = ['borderLeftWidth', 'paddingLeft', 'borderRightWidth', 'paddingRight'];
            for (var i in subtract) {
                element.style[i] = subtract[i].inject(dims[i], function(amount, style) {
                    var value = parseFloat(Element.getStyle(element, style)) || 0;
                    s[style] = value + 'px';
                    return amount -= value;
                }) + 'px';
            }
        }
        // bail if skipping setLeft and setTop
        if (!options.setLeft && !options.setTop)
            return element;

        // clear margins
        if (options.setLeft) s.marginLeft = '0px';
        if (options.setTop) s.marginTop = '0px';

        // find page position of source
        var p = Element.cumulativeOffset(source),
		  delta = [0, 0],
		  position = Element.getStyle(element, 'position');

        if (position === 'relative') {
            // clear element coords before getting
            // the viewportOffset because Opera
            // will fumble the calculations if
            // you try to subtract the coords after
            if (options.setLeft) s.left = '0px';
            if (options.setTop) s.top = '0px';
            // store element offsets so we can subtract them later
            delta = Element.cumulativeOffset(element);
        }

        if (options.setLeft)
            s.left = (p[0] - delta[0] + options.offsetLeft) + 'px';
        if (options.setTop)
            s.top = (p[1] - delta[1] + options.offsetTop) + 'px';

        return element;
    }
});

var EventPopOver = Class.create(PopOver, {
	initialize: function($super, sElements, options) {
		$super(sElements, options);
		
		// overload options
		this.options = Object.extend({
			target: 'results',
			targetHeader: 'results-header'
		}, this.options);
		
		// add additional elements
		this.build();

      document.observe("popover:open", this._ajax.bindAsEventListener(this));
      
	},
	
	build: function() {
		// create wrappers 
		var wrapper = $(this.options.wrapper);
		wrapper.down('div.bd3').insert('<div id="' + this.options.targetHeader + '"><h4>event</h4></div><div id="'+ this.options.target + '"></div>');
		
		// create additional elements
		var header = $(this.options.targetHeader);
		var body = $(this.options.target);
		var top = this.options.target + "-top";
		// TODO: DELETE THESE LINES, CLOSER NOW SET IN POPOVER CLASS
		// header.insert('<span id="pop-close"></span>');
		// $('pop-close').observe('click', this.close.bindAsEventListener(this));
		body.insert('<div id="' + top + '"><h3></h3></div>');
		$(top).insert('<dl id="details"><span id="genreSpan"><dt>Genre:</dt><dd id="genre">N/A</dd></span></dl>');
		$('details').insert('<span id="timeSpan"><dt>Time:</dt><dd id="time">N/A</dd></span>');
		$('details').insert('<span id="priceSpan"><dt>Price:</dt><dd id="price">N/A</dd></span>');
		$(top).insert('<ul id="event-icons"></ul>');
		body.insert('<img id="thumbnail" src="' + window.rootVirtual + '/_img/td/misc/pop-no-image.jpg" alt="no image" />');
		body.insert('<p id="description">Lorem ipsum</p>');
		body.insert('<a href="$" class="btn-event-details" id="event-details"><span>Event Details</span></a>');
		body.insert('<ul id="media-icons"></ul>');
		body.insert('<div class="clear"></div>'); // just in case
	},
	
	_ajax: function(e) {
		e.stop();
		var el = e.findElement('a');
		var data = el.href.split('.aspx?date=');
		var path = data[0].substring(data[0].indexOf('/Calendar/Events/'));
		var date = data[1];
		var Scope = this;
		new Ajax.Request(window.ajaxPath, {
         method: 'get',
         parameters: {
             'path': path.toJSON(),
             'date': date.toJSON()
         },
         requestHeaders: { 'Content-Type': 'application/json' },
         onSuccess: function(transport) {
			var json = transport.responseText.evalJSON(true);
			Scope.jsonHandler(json);									
         }
     });		
	},
	
	jsonHandler: function (json) {
		//console.log(json);
		var resultsHeader = $(this.options.targetHeader);
		resultsHeader.down('h4').update("a " + json.Venue.Name + " event");
		
		var results = $(this.options.target);
		results.down('h3').update(json.Title);
		
		// add thumbnail
		if (json.ImageGuid != null)
		{
		    $('thumbnail').src = "getattachment/" + json.ThumbnailGuid + "/.aspx";
		    $('thumbnail').alt = json.Title;
		}
		else
		{
		    $('thumbnail').src = window.rootVirtual + "/_img/td/misc/pop-no-image.jpg";
		    $('thumbnail').alt = "no image";
		}
		
		// loop through genres
		if (json.Genres.length > 0)
		{
		    var genresOutput = new Array();
		    for (var i = 0; i < json.Genres.length; i++) {
			    genresOutput.push(json.Genres[i].Name);
		    }
		    // add genres
		    $('genre').update(genresOutput.join(", "));
		    $('genreSpan').style.display = '';
		}
		else
		{
		    $('genreSpan').style.display = 'none';
		}
		
		// loop through performances
		var timeOutput = "";
		var href = "";
		var call = "<span id=\"call\">Call for availability 206.838.4333</span>";
		if (json.Performances.length > 0)
		{
		    if (json.Performances[0].IsPastEvent == true || json.Performances[0].IsForSale == false)
		    {
                timeOutput += "<span>" + json.Performances[0].TimeString + " (" + json.Performances[0].Age.Name + ")" + "</span>";
		    }
		    else if (json.Performances[0].CallForAvailability)
		    {
    		    timeOutput += "<span>" + json.Performances[0].TimeString + " (" + json.Performances[0].Age.Name + ")" + "</span>" + call;
		    }
		    else
		    {
	            href = "calendar/event-ticket-options.aspx?eventNodeID=" + json.NodeId + "&performanceID=" + json.Performances[0].ID;
		        timeOutput += "<span>" + "<a href=" + href + ">" + json.Performances[0].TimeString + "</a> (" + json.Performances[0].Age.Name + ")" + "</span>";
		    }

	        for (var i = 1; i < json.Performances.length; i++)
	        {
		        if (json.Performances[i].IsPastEvent == true || json.Performances[0].IsForSale == false)
		        {
		            timeOutput += "<span class='second-time'>" + json.Performances[i].TimeString + " (" + json.Performances[i].Age.Name + ")" + "</span>";
		        }
		        else if (json.Performances[i].CallForAvailability)
		        {
    		        timeOutput += "<span class='second-time'>" + json.Performances[i].TimeString + " (" + json.Performances[i].Age.Name + ")" + "</span>" + call;
		        }
		        else
		        {
		            href = "calendar/event-ticket-options.aspx?eventNodeID=" + json.NodeId + "&performanceID=" + json.Performances[i].ID;
		            timeOutput += "<span class='second-time'>" + "<a href=" + href + ">" + json.Performances[i].TimeString + "</a> (" + json.Performances[i].Age.Name + ")" + "</span>";
		        }
	        }
		    // add time(s)
		    $('time').update(timeOutput);
		    $('timeSpan').style.display = '';
		}
		else
		{
		    $('timeSpan').style.display = 'none';
		}

		// add price
		if (json.Price != '')
		{
		    $('price').update(json.Price);
		    $('priceSpan').style.display = '';
		}
		else
		{
		    $('priceSpan').style.display = 'none';
		}
		
		// add description
		$('description').update(json.ShortDescription.replace('\r\n', '<br />'));

        // add event details link
        $('event-details').href = json.Url.replace('~/', '');
		
		// delete old event icons
		$('event-icons').update();
		if (json.IsNewBooking == true) {
			$('event-icons').insert('<li id="booking" title="New Booking">New booking</li>');
		}
		if (json.IsRecommended == true) {
			$('event-icons').insert('<li id="recommended" title="Recommended">Recommended</li>');
		}
		if (json.IsReturningFavorite == true) {
			$('event-icons').insert('<li id="favorite" title="Returning favorite">Returning favorite</li>');
		}
		if (json.IsSellingFast == true) {
			$('event-icons').insert('<li id="selling" title="Selling fast">Selling fast</li>');
		}
										
		// delete old media icons
		$('media-icons').update();
		if (json.HasAudio == true) {
			$('media-icons').insert('<li id="audio" title="Has audio{">Has audio</li>');
		}
		if (json.HasVideo == true) {
			$('media-icons').insert('<li id="video" title="Has video">Has video</li>');
		}
		
		// remove old clear divs
		/*var clear = results.select('div.clear');
		for (var j = 0; j < clear.length; j++) {
			//clear[i].remove();
		}*/
		//results.insert('<div class="clear"></div>');
		
		new Draggable(this.options.wrapper); // super unnecessary
		if (resultsHeader.down('h4').hasClassName("sIFR-replaced") == true) {
			resultsHeader.down('h4').removeClassName("sIFR-replaced");
		}
		sIFR_ajax_calendar();
	}
});

var InPlaceInputLabel = Class.create({
	initialize: function(sInputID) {
		this.input = $(sInputID);
		this.lbl = $$('label[for='+ sInputID +']')[0];
		if (this.input && this.lbl) {
			this.lbl.addClassName('overlay');
			this.input.setAttribute('label',this.lbl.innerHTML.strip());
			if (this.input.getAttribute('type') == 'password') {
				this.ispassword = true;
				this.input.setAttribute('ispassword','true');
				this.input.setAttribute('type','text');
			}
			this.form = this.input.up('form');
			
			Event.observe(this.input,'focus',this.__Focus.bindAsEventListener(this));
			Event.observe(this.input,'blur',this.__Blur.bindAsEventListener(this));
			Event.observe(this.form,'submit',this.__Submit.bindAsEventListener(this));

	    	this.updateLabel();

		}
	},
	/**
	 * Hides the 'label' text for the field, if the text has not changed
	 */
	hideLabel: function() {
		if (this.input.value.strip() == this.input.getAttribute('label')) {
			this.input.value = ''; // removes label text
			this.input.removeClassName('label');
			if (this.ispassword) {
				this.input.setAttribute('type','password');
			}
		}
	},
	/**
	 * Sets the value of the label to the LABEL text, if no other value is in place.
	 */
	updateLabel: function() {
	    if (this.input.value.strip().length == 0) {
			this.input.value = this.input.getAttribute('label');
			this.input.addClassName('label');
			if (this.ispassword) {
				this.input.setAttribute('type','text');
			}
	    }
	},
	__Focus: function(e) {
		this.hideLabel();
	},
	__Blur: function(e) {
		this.updateLabel();
	},
	__Submit: function(e) {
		this.hideLabel();
	}
});

var PopOverAdjuster = Class.create({
	// add "hover" functionality to IE6... position pop over better
	initialize: function(sElement){
		var opener = $$(sElement);
		
		for (var i = 0; i < opener.length; i++) {
			opener[i].observe('mouseover', this.__MouseOver.bindAsEventListener(this));
			opener[i].observe('mouseout', this.__MouseOut.bindAsEventListener(this));
			opener[i].observe('click', this.__MouseOver.bindAsEventListener(this));   
		}
	},
	
	__MouseOver: function(e) {
		e.stop();
		var opener = e.element();
		var target = opener.next('div.hours-wrapper');
		target.addClassName('on');
		this._adjust(opener, target);
	},
	
	__MouseOut: function(e) {
		var target = e.element().next('div.hours-wrapper').removeClassName('on');
		target.setStyle("left: -50000px"); 
	},
	
	_adjust: function (opener, target) {
		var width = opener.getWidth() + 6; // width + padding
		var top = - (target.getHeight() / 2);
		target.clonePosition(opener, {setWidth: false, setHeight: false, offsetLeft: width, offsetTop: top});
		var indicatorPos = (target.getHeight() + target.offsetTop) - 11;
		target.down('div.indicator').setStyle('top: ' + indicatorPos + 'px');
	}
});

//var NavAdjuster = Class.create({
//	initialize: function(sElement) {
//		// Let's do some magic to see if there's an "-on" class on any of the childnodes	
//		var onArray = $(sElement).childElements().grep(new Selector("li[class$='-on']"));
//		// there should only be one item highlighted at a time... if there are more, something's off. Let's only grab the first element.
//		// Now, see if there's a UL in it
//		if (onArray.length > 0) {
//			var child = onArray[0].down("ul");
//			var childHeight = child.getHeight();

//			// add childHeight to current wrapper height
//			var wrapper = $(sElement).up("div");
//			var wrapperHeight = wrapper.getHeight() + childHeight;
//			wrapper.setStyle('height:' + wrapperHeight + 'px');
//			$(sElement).addClassName("multi");
//		}
//	}
//});


/* Popups */
/*
 *
 * @className PopUps 
 * @author POP webdev [tw]
 * @version 0.1
 * @classDescription PopUps is a class to call window.open of a link's href if the user has js. 
 * @param elPopups {Array}	Array of desired A or other element to create popup
 * @param hDefaultWinOptions {Object} hash of default window options/specifications
 * @return {Object}	Returns a new  object.
 * This class depends on Prototype v1.6.
 * Individual links can override any of the window specifications by providing an object literal within it's rel attribute.
 * Example usage:
 * <a class="popup" href="http://www.google.com">popup</a>
 * <a class="popup" href="http://www.google.com" rel="{windowName:'mySpecificName1', windowPosition:'center'}">popup</a>
 * <div _popup="{url: 'http://www.google.com', winOptions: {windowName:'mySpecificName2', windowPosition:'top-right'}}">popup</div>
 * new PopUps('a.popup', {windowName: 'a_default_window_name', windowPosition: 'top-left'});
*/
var PopUps = Class.create({
	initialize: function (elPopups, hDefaultWinOptions) {
		// create a default options hash
		this.defaultOptions = $H({
			width: 550,
			height: 435,
			//windowPosition: 'center', //['top-left'|'top-center'|'top-right'|'center'|'bottom-left'|'bottom-center'|'bottom-right]
			//left:  #,					// DIY left position of the window
			//top:  #,					// DIY top position of the window
			hOffset: 100,					// Horizontal offset
			vOffset: 100,					// Vertical offset
			location: 'no',
			menubar: 'no',
			status: 'no',
			toolbar: 'no',
			scrollbars: 'no',
			resizable: 'no',
			fullscreen: 'no',			// Display the window in theater mode?
			channelmode: 'no',			// Display the browser in full-screen mode? (must also be in theater mode)
			titlebar: 'no',
			windowName: 'Floorplan'
		}).update(hDefaultWinOptions);
		var linkEventHandle = this.__LinkClick.bindAsEventListener(this);
		var elementEventHandle = this.__ElementClick.bindAsEventListener(this);
		elPopups.each(function(el){
			el.observe('click', (el.nodeName == 'A') ? linkEventHandle : elementEventHandle);
		});
	},

	__LinkClick: function (e){
		var el = Event.findElement(e, 'a');
 		var url = el.readAttribute('href');
 		var instanceOptions;
 		if(el.readAttribute('rel')){
 			instanceOptions = $H(el.readAttribute('rel').evalJSON());
 		}
		e.preventDefault();
		this.openWindow(url, instanceOptions);
	},
	
	__ElementClick: function (e){
		var el = e.element();
		var params = el.readAttribute('_popup').evalJSON();
 		var url = el.readAttribute('_popup');
 		var instanceOptions;
 		if(params.winOptions){
 			instanceOptions = $H(params.winOptions);
 		}
		this.openWindow(params.url, instanceOptions);
	},	
	
	openWindow: function(url, instanceWinOptions){
		// Merge specific options hash set in the rel with default options
		var options = (instanceWinOptions) ? this.defaultOptions.merge($H(instanceWinOptions)) : this.defaultOptions.clone();
		// position the window if specified
		if(options.get('windowPosition')){
			var pos = options.unset('windowPosition');	
			var left, top;
			var availHeight = screen.availHeight, availWidth = screen.availWidth;
			var popupHeight = options.get('height'), popupWidth = options.get('width');
			var vOffset = options.get('vOffset'), hOffset = options.get('hOffset');
			switch(pos){
				case 'top-left': 
					top = 0 + vOffset;
					left = 0 + hOffset;
					break;
				case 'top-center': 
					top = 0 + vOffset;
					left = ((availWidth - popupWidth)/2) + hOffset;
					break;
				case 'top-right': 
					top = 0 + vOffset;
					left = availWidth - (popupWidth + hOffset);
					break;
				case 'center': 
					top = ((availHeight - popupHeight)/2) + vOffset;
					left = ((availWidth - popupWidth)/2) + hOffset;
					break;
				case 'bottom-left': 
					top = availHeight - (popupHeight + vOffset);
					left = 0 + hOffset;
					break;
				case 'bottom-center': 
					top = availHeight - (popupHeight + vOffset);
					left = ((availWidth - popupWidth)/2) + hOffset;
					break;
				case 'bottom-right': 
					top = availHeight - (popupHeight + vOffset);
					left = availWidth - (popupWidth + hOffset);
					break;
			}
			options.set('top', top);
			options.set('left', left);
		}
		var win = window.open(url, escape(options.unset('windowName')), options.invoke('join', '=').join(','));
		if (window.focus) {
			win.focus()
		}
	}
});

document.observe("dom:loaded", function() {
	// remove nojs classes
	var nojs = $$('.nojs');
	for (var i = 0; i < nojs.length; i++) {
		nojs[i].removeClassName('nojs');
		nojs[i].hide();
	}
	var popAdjust = new PopOverAdjuster("a.hours");
	//var adjust = new NavAdjuster("CMSListMenu2");
	var oLabel = new InPlaceInputLabel('ctl00_ctl00_ctl00_MainContent_MainContent_uxSearch');
	var oLabel2 = new InPlaceInputLabel('ctl00_ctl00_ctl00_ctl00_MainContent_MainContent_uxSearch');
	var olLabel = new InPlaceInputLabel('ctl00_ctl00_ctl00_MainContent_MainContent_SectionHeader_ctl00_uxSearch');
	if ($$('body.calendar').length > 0) {
		var event = new EventPopOver('a.data-hover');
		var staffPick = new PopOver('a.staff-picks', {inlineContent: 'staff-picks', wrapper: 'pop-staff-pick', onOpen: 'staff:open', onClose: 'staff-close', marginTop: -33, marginLeft: 0});
	}
	popUps = new PopUps($$('.popup'), {windowName: 'defaultWindowName', windowPosition: 'top-left'});
});

/* Alternating colors in table rows, plus padding left for first td */
 function tableStyle() {
     // find the tables
     tables=document.getElementsByTagName('table');
         // loop through the tables and find the tr's
         for(i=0; i<tables.length; i++){
             rows=tables[i].getElementsByTagName('tr');
             // loop through tr's
             for(j=0;j<rows.length;j++){
                 // only do stuff if it's not the table head, identified by class
                 if( rows[j].className !== 'head'){
                         // look for the first td and give it some class
                         cells=rows[j].getElementsByTagName('td');
                         cells[0].className=cells[0].className + ' first';
                         // modulus magic will tell us if the row is odd or even
                         mod = j%2;
                         // if it's even, give it some class
                         if(mod==0){
                             rows[j].className=rows[j].className + ' altRow';
				}
			}
		}
	}
}