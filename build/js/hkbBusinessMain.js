// JavaScript Document

;(function () {
	'use strict';

	/**
	 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
	 *
	 * @codingstandard ftlabs-jsv2
	 * @copyright The Financial Times Limited [All Rights Reserved]
	 * @license MIT License (see LICENSE.txt)
	 */

	/*jslint browser:true, node:true*/
	/*global define, Event, Node*/


	/**
	 * Instantiate fast-clicking listeners on the specified layer.
	 *
	 * @constructor
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	function FastClick(layer, options) {
		var oldOnClick;

		options = options || {};

		/**
		 * Whether a click is currently being tracked.
		 *
		 * @type boolean
		 */
		this.trackingClick = false;


		/**
		 * Timestamp for when click tracking started.
		 *
		 * @type number
		 */
		this.trackingClickStart = 0;


		/**
		 * The element being tracked for a click.
		 *
		 * @type EventTarget
		 */
		this.targetElement = null;


		/**
		 * X-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartX = 0;


		/**
		 * Y-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartY = 0;


		/**
		 * ID of the last touch, retrieved from Touch.identifier.
		 *
		 * @type number
		 */
		this.lastTouchIdentifier = 0;


		/**
		 * Touchmove boundary, beyond which a click will be cancelled.
		 *
		 * @type number
		 */
		this.touchBoundary = options.touchBoundary || 10;


		/**
		 * The FastClick layer.
		 *
		 * @type Element
		 */
		this.layer = layer;

		/**
		 * The minimum time between tap(touchstart and touchend) events
		 *
		 * @type number
		 */
		this.tapDelay = options.tapDelay || 200;

		/**
		 * The maximum time for a tap
		 *
		 * @type number
		 */
		this.tapTimeout = options.tapTimeout || 700;

		if (FastClick.notNeeded(layer)) {
			return;
		}

		// Some old versions of Android don't have Function.prototype.bind
		function bind(method, context) {
			return function() { return method.apply(context, arguments); };
		}


		var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
		var context = this;
		for (var i = 0, l = methods.length; i < l; i++) {
			context[methods[i]] = bind(context[methods[i]], context);
		}

		// Set up event handlers as required
		if (deviceIsAndroid) {
			layer.addEventListener('mouseover', this.onMouse, true);
			layer.addEventListener('mousedown', this.onMouse, true);
			layer.addEventListener('mouseup', this.onMouse, true);
		}

		layer.addEventListener('click', this.onClick, true);
		layer.addEventListener('touchstart', this.onTouchStart, false);
		layer.addEventListener('touchmove', this.onTouchMove, false);
		layer.addEventListener('touchend', this.onTouchEnd, false);
		layer.addEventListener('touchcancel', this.onTouchCancel, false);

		// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
		// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
		// layer when they are cancelled.
		if (!Event.prototype.stopImmediatePropagation) {
			layer.removeEventListener = function(type, callback, capture) {
				var rmv = Node.prototype.removeEventListener;
				if (type === 'click') {
					rmv.call(layer, type, callback.hijacked || callback, capture);
				} else {
					rmv.call(layer, type, callback, capture);
				}
			};

			layer.addEventListener = function(type, callback, capture) {
				var adv = Node.prototype.addEventListener;
				if (type === 'click') {
					adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
						if (!event.propagationStopped) {
							callback(event);
						}
					}), capture);
				} else {
					adv.call(layer, type, callback, capture);
				}
			};
		}

		// If a handler is already declared in the element's onclick attribute, it will be fired before
		// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
		// adding it as listener.
		if (typeof layer.onclick === 'function') {

			// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
			// - the old one won't work if passed to addEventListener directly.
			oldOnClick = layer.onclick;
			layer.addEventListener('click', function(event) {
				oldOnClick(event);
			}, false);
			layer.onclick = null;
		}
	}

	/**
	* Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
	*
	* @type boolean
	*/
	var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;

	/**
	 * Android requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;


	/**
	 * iOS requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;


	/**
	 * iOS 4 requires an exception for select elements.
	 *
	 * @type boolean
	 */
	var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


	/**
	 * iOS 6.0-7.* requires the target element to be manually derived
	 *
	 * @type boolean
	 */
	var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);

	/**
	 * BlackBerry requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;

	/**
	 * Determine whether a given element requires a native click.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element needs a native click
	 */
	FastClick.prototype.needsClick = function(target) {
		switch (target.nodeName.toLowerCase()) {

		// Don't send a synthetic click to disabled inputs (issue #62)
		case 'button':
		case 'select':
		case 'textarea':
			if (target.disabled) {
				return true;
			}

			break;
		case 'input':

			// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
			if ((deviceIsIOS && target.type === 'file') || target.disabled) {
				return true;
			}

			break;
		case 'label':
		case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
		case 'video':
			return true;
		}

		return (/\bneedsclick\b/).test(target.className);
	};


	/**
	 * Determine whether a given element requires a call to focus to simulate click into element.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
	 */
	FastClick.prototype.needsFocus = function(target) {
		switch (target.nodeName.toLowerCase()) {
		case 'textarea':
			return true;
		case 'select':
			return !deviceIsAndroid;
		case 'input':
			switch (target.type) {
			case 'button':
			case 'checkbox':
			case 'file':
			case 'image':
			case 'radio':
			case 'submit':
				return false;
			}

			// No point in attempting to focus disabled inputs
			return !target.disabled && !target.readOnly;
		default:
			return (/\bneedsfocus\b/).test(target.className);
		}
	};


	/**
	 * Send a click event to the specified element.
	 *
	 * @param {EventTarget|Element} targetElement
	 * @param {Event} event
	 */
	FastClick.prototype.sendClick = function(targetElement, event) {
		var clickEvent, touch;

		// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
		if (document.activeElement && document.activeElement !== targetElement) {
			document.activeElement.blur();
		}

		touch = event.changedTouches[0];

		// Synthesise a click event, with an extra attribute so it can be tracked
		clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);

		clickEvent.forwardedTouchEvent = true;
		targetElement.dispatchEvent(clickEvent);
	};

	FastClick.prototype.determineEventType = function(targetElement) {

		//Issue #159: Android Chrome Select Box does not open with a synthetic click event
		if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
			return 'mousedown';
		}

		return 'click';
	};


	/**
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.focus = function(targetElement) {
		var length;

		// Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
		if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
			length = targetElement.value.length;
			targetElement.setSelectionRange(length, length);
		} else {
			targetElement.focus();
		}
	};


	/**
	 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
	 *
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.updateScrollParent = function(targetElement) {
		var scrollParent, parentElement;

		scrollParent = targetElement.fastClickScrollParent;

		// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
		// target element was moved to another parent.
		if (!scrollParent || !scrollParent.contains(targetElement)) {
			parentElement = targetElement;
			do {
				if (parentElement.scrollHeight > parentElement.offsetHeight) {
					scrollParent = parentElement;
					targetElement.fastClickScrollParent = parentElement;
					break;
				}

				parentElement = parentElement.parentElement;
			} while (parentElement);
		}

		// Always update the scroll top tracker if possible.
		if (scrollParent) {
			scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
		}
	};


	/**
	 * @param {EventTarget} targetElement
	 * @returns {Element|EventTarget}
	 */
	FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {

		// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
		if (eventTarget.nodeType === Node.TEXT_NODE) {
			return eventTarget.parentNode;
		}

		return eventTarget;
	};


	/**
	 * On touch start, record the position and scroll offset.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchStart = function(event) {
		var targetElement, touch, selection;

		// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
		if (event.targetTouches.length > 1) {
			return true;
		}

		targetElement = this.getTargetElementFromEventTarget(event.target);
		touch = event.targetTouches[0];

		if (deviceIsIOS) {

			// Only trusted events will deselect text on iOS (issue #49)
			selection = window.getSelection();
			if (selection.rangeCount && !selection.isCollapsed) {
				return true;
			}

			if (!deviceIsIOS4) {

				// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
				// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
				// with the same identifier as the touch event that previously triggered the click that triggered the alert.
				// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
				// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
				// Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
				// which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
				// random integers, it's safe to to continue if the identifier is 0 here.
				if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
					event.preventDefault();
					return false;
				}

				this.lastTouchIdentifier = touch.identifier;

				// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
				// 1) the user does a fling scroll on the scrollable layer
				// 2) the user stops the fling scroll with another tap
				// then the event.target of the last 'touchend' event will be the element that was under the user's finger
				// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
				// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
				this.updateScrollParent(targetElement);
			}
		}

		this.trackingClick = true;
		this.trackingClickStart = event.timeStamp;
		this.targetElement = targetElement;

		this.touchStartX = touch.pageX;
		this.touchStartY = touch.pageY;

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			event.preventDefault();
		}

		return true;
	};


	/**
	 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.touchHasMoved = function(event) {
		var touch = event.changedTouches[0], boundary = this.touchBoundary;

		if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
			return true;
		}

		return false;
	};


	/**
	 * Update the last position.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchMove = function(event) {
		if (!this.trackingClick) {
			return true;
		}

		// If the touch has moved, cancel the click tracking
		if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
			this.trackingClick = false;
			this.targetElement = null;
		}

		return true;
	};


	/**
	 * Attempt to find the labelled control for the given label element.
	 *
	 * @param {EventTarget|HTMLLabelElement} labelElement
	 * @returns {Element|null}
	 */
	FastClick.prototype.findControl = function(labelElement) {

		// Fast path for newer browsers supporting the HTML5 control attribute
		if (labelElement.control !== undefined) {
			return labelElement.control;
		}

		// All browsers under test that support touch events also support the HTML5 htmlFor attribute
		if (labelElement.htmlFor) {
			return document.getElementById(labelElement.htmlFor);
		}

		// If no for attribute exists, attempt to retrieve the first labellable descendant element
		// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
		return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
	};


	/**
	 * On touch end, determine whether to send a click event at once.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchEnd = function(event) {
		var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

		if (!this.trackingClick) {
			return true;
		}

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			this.cancelNextClick = true;
			return true;
		}

		if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
			return true;
		}

		// Reset to prevent wrong click cancel on input (issue #156).
		this.cancelNextClick = false;

		this.lastClickTime = event.timeStamp;

		trackingClickStart = this.trackingClickStart;
		this.trackingClick = false;
		this.trackingClickStart = 0;

		// On some iOS devices, the targetElement supplied with the event is invalid if the layer
		// is performing a transition or scroll, and has to be re-detected manually. Note that
		// for this to function correctly, it must be called *after* the event target is checked!
		// See issue #57; also filed as rdar://13048589 .
		if (deviceIsIOSWithBadTarget) {
			touch = event.changedTouches[0];

			// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
			targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
			targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
		}

		targetTagName = targetElement.tagName.toLowerCase();
		if (targetTagName === 'label') {
			forElement = this.findControl(targetElement);
			if (forElement) {
				this.focus(targetElement);
				if (deviceIsAndroid) {
					return false;
				}

				targetElement = forElement;
			}
		} else if (this.needsFocus(targetElement)) {

			// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
			// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
			if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
				this.targetElement = null;
				return false;
			}

			this.focus(targetElement);
			this.sendClick(targetElement, event);

			// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
			// Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
			if (!deviceIsIOS || targetTagName !== 'select') {
				this.targetElement = null;
				event.preventDefault();
			}

			return false;
		}

		if (deviceIsIOS && !deviceIsIOS4) {

			// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
			// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
			scrollParent = targetElement.fastClickScrollParent;
			if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
				return true;
			}
		}

		// Prevent the actual click from going though - unless the target node is marked as requiring
		// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
		if (!this.needsClick(targetElement)) {
			event.preventDefault();
			this.sendClick(targetElement, event);
		}

		return false;
	};


	/**
	 * On touch cancel, stop tracking the click.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.onTouchCancel = function() {
		this.trackingClick = false;
		this.targetElement = null;
	};


	/**
	 * Determine mouse events which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onMouse = function(event) {

		// If a target element was never set (because a touch event was never fired) allow the event
		if (!this.targetElement) {
			return true;
		}

		if (event.forwardedTouchEvent) {
			return true;
		}

		// Programmatically generated events targeting a specific element should be permitted
		if (!event.cancelable) {
			return true;
		}

		// Derive and check the target element to see whether the mouse event needs to be permitted;
		// unless explicitly enabled, prevent non-touch click events from triggering actions,
		// to prevent ghost/doubleclicks.
		if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

			// Prevent any user-added listeners declared on FastClick element from being fired.
			if (event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			} else {

				// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
				event.propagationStopped = true;
			}

			// Cancel the event
			event.stopPropagation();
			event.preventDefault();

			return false;
		}

		// If the mouse event is permitted, return true for the action to go through.
		return true;
	};


	/**
	 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
	 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
	 * an actual click which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onClick = function(event) {
		var permitted;

		// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
		if (this.trackingClick) {
			this.targetElement = null;
			this.trackingClick = false;
			return true;
		}

		// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
		if (event.target.type === 'submit' && event.detail === 0) {
			return true;
		}

		permitted = this.onMouse(event);

		// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
		if (!permitted) {
			this.targetElement = null;
		}

		// If clicks are permitted, return true for the action to go through.
		return permitted;
	};


	/**
	 * Remove all FastClick's event listeners.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.destroy = function() {
		var layer = this.layer;

		if (deviceIsAndroid) {
			layer.removeEventListener('mouseover', this.onMouse, true);
			layer.removeEventListener('mousedown', this.onMouse, true);
			layer.removeEventListener('mouseup', this.onMouse, true);
		}

		layer.removeEventListener('click', this.onClick, true);
		layer.removeEventListener('touchstart', this.onTouchStart, false);
		layer.removeEventListener('touchmove', this.onTouchMove, false);
		layer.removeEventListener('touchend', this.onTouchEnd, false);
		layer.removeEventListener('touchcancel', this.onTouchCancel, false);
	};


	/**
	 * Check whether FastClick is needed.
	 *
	 * @param {Element} layer The layer to listen on
	 */
	FastClick.notNeeded = function(layer) {
		var metaViewport;
		var chromeVersion;
		var blackberryVersion;
		var firefoxVersion;

		// Devices that don't support touch don't need FastClick
		if (typeof window.ontouchstart === 'undefined') {
			return true;
		}

		// Chrome version - zero for other browsers
		chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (chromeVersion) {

			if (deviceIsAndroid) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// Chrome 32 and above with width=device-width or less don't need FastClick
					if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}

			// Chrome desktop doesn't need FastClick (issue #15)
			} else {
				return true;
			}
		}

		if (deviceIsBlackBerry10) {
			blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

			// BlackBerry 10.3+ does not require Fastclick library.
			// https://github.com/ftlabs/fastclick/issues/251
			if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// user-scalable=no eliminates click delay.
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// width=device-width (or less than device-width) eliminates click delay.
					if (document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}
			}
		}

		// IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
		if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		// Firefox version - zero for other browsers
		firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (firefoxVersion >= 27) {
			// Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896

			metaViewport = document.querySelector('meta[name=viewport]');
			if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') !== -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
				return true;
			}
		}

		// IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
		// http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
		if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		return false;
	};


	/**
	 * Factory method for creating a FastClick object
	 *
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	FastClick.attach = function(layer, options) {
		return new FastClick(layer, options);
	};


	if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {

		// AMD. Register as an anonymous module.
		define(function() {
			return FastClick;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = FastClick.attach;
		module.exports.FastClick = FastClick;
	} else {
		window.FastClick = FastClick;
	}
}());


	//优化iphone点击速度
window.addEventListener('load', function() {
  FastClick.attach(document.body);
}, false);



//增加active事件
document.addEventListener('touchstart',function(){},false);

/**
 * Created by ZHUANGYI on 2017/7/14.
 */
/**
 * Created by ZHUANGYI on 2017/7/14.
 */
var browser = {
    os: function () {
        var u = navigator.userAgent;
        return {// 操作系统
            linux: !!u.match(/\(X11;( U;)? Linux/i), // Linux
            windows: !!u.match(/Windows/i), // Windows
            android: !!u.match(/Android/i), // Android
            iOS: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), // iOS
        };
    }(),
    device: function () {
        var u = navigator.userAgent;
        return {// 设备
            mobile: !!u.match(/AppleWebKit/i), // mobile
            iPhone: !!u.match(/iPhone/i), // iPhone
            iPad: !!u.match(/iPad/i), // iPad
        };
    }(),
    supplier: function () {
        var u = navigator.userAgent;
        return {// 浏览器类型
            qq: !!u.match(/QQ\/\d+/i), // QQ
            wechat: !!u.match(/MicroMessenger/i), // WeChat
            weixin: u.match(/MicroMessenger/i) == 'MicroMessenger',
            ios: u.indexOf('_JFiOS') > -1,
            android: u.indexOf('_jfAndroid') > -1,
            mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
        };

    }(),
    language: (navigator.browserLanguage || navigator.language).toLowerCase(),

    androidVersion: function () {//判断安卓版本
        var userAgent = navigator.userAgent;
        var index = userAgent.indexOf("Android");
        if (index >= 0) {
            return parseFloat(userAgent.slice(index + 8));

        }
    }(),

    IosVersion: function () {//ios版本
        var str = navigator.userAgent.toLowerCase();
        var ver = str.match(/cpu iphone os (.*?) like mac os/);
        if (!ver) {

            return -1;

        } else {

            return ver[1].replace(/_/g, ".");
        }
    }()
    //browser.supplier.wechat
};

var windowBanEvent = {

    bundling: function () {

        var _self = this;
        //$(window).bind('click touchstart touchmove touchend ', _self.Canceling);//绑定禁止事件

        var allEvent = ['click', 'touchstart', 'touchmove', 'touchend'];

        for (var i = 0; i < allEvent.length; i++) {

            document.body.addEventListener(allEvent[i], _self.Canceling, false);

            addEventListener(allEvent[i], _self.Canceling, false)

        }

    },

    unbundling: function () {

        var _self = this;

        var allEvent = ['click', 'touchstart', 'touchmove', 'touchend'];

        for (var i = 0; i < allEvent.length; i++) {

            document.body.removeEventListener(allEvent[i], _self.Canceling, false);

            removeEventListener(allEvent[i], _self.Canceling, false)

        }

        //$(window).unbind('click touchstart touchmove touchend ', _self.Canceling);//解除绑定事件


    },

    Canceling: function (evt) {

        var evt = evt || window.event; //阻止事件

        if (evt.preventDefault) {

            evt.preventDefault();

            evt.stopPropagation();

        }
        else {

            evt.returnValue = false;

            evt.cancelBubble = true;

        }

    }

};

/**
 * Created by ZHUANGYI on 2017/8/22.
 */


var jfAutoPlay = {

    'jfVariable': {

        'XPosition': 0,                                                                                             //存储第一个手指x轴位置，需刷新

        'isChange': 0,                                                                                              //判断是否往哪里移动，1后退，2前进，其他值不动，需刷新

        'setInterMove1000': 0,                                                                                      //存储循环

        'timer': 5000,                                                                                              //平滑过渡间隔时间

        'ifPosition': 0,                                                                                            //储存两张图片的左右状态

        'lastStance': 0,                                                                                            //上次触摸的位置

        'isThreeEle': true,                                                                                           //是否是三个或者以上元素

        'isTwoEle': false,                                                                                           //是否两个元素

        'canMove':true,                                                                                                //是否可以移动

        'isAndroidVersion4': false                                                                                    //是不是安卓四及其以下系统

    },

    jfAutoPlayInit: function () {

        /*增加点点*/
        var thisFatherEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_autoplay_images')[0];//父元素，主要移动该元素

        var thisAllTagA = thisFatherEle.getElementsByTagName('a');                                                  //包含img的a

        var thisPaginationEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_pagination')[0];//光标

        var screenWidth = document.body.clientWidth;                                                               //屏幕宽度

        thisFatherEle.className = 'jf_autoplay_images';//预设 防止闪屏

        jfAutoPlay.jfVariable.isAndroidVersion4 = !browser.supplier.wechat && browser.androidVersion && browser.androidVersion < 5;                  //安卓系统

        if (
            0
            &&
            jfAutoPlay.jfVariable.isAndroidVersion4) {                                                                  //安卓4.4以下 ，

            var allImages = thisFatherEle.getElementsByTagName('img');

            for (var i = 0; i < allImages.length; i++) {//固定图片高度

                allImages[i].style.width = screenWidth + 'px';

                allImages[i].style.height = (screenWidth / 750 * 277) + 'px'
            }

            if(thisAllTagA.length==2){//两张图片时显示错位

                thisFatherEle.style.whiteSpace='nowrap';

                thisAllTagA[1].style.marginLeft='-3px'

            }

        }

        if (thisAllTagA.length == 2) {//预设是几个元素，默认为三个以上

            jfAutoPlay.jfVariable.isThreeEle = false;
            jfAutoPlay.jfVariable.isTwoEle = true;

        }
        else if (thisAllTagA.length == 1) {

            jfAutoPlay.jfVariable.isThreeEle = false;
            jfAutoPlay.jfVariable.isTwoEle = false;

        }

        if (jfAutoPlay.jfVariable.isTwoEle || jfAutoPlay.jfVariable.isThreeEle) {//两个以上的图片再加点

            for (var i = 0; i < thisAllTagA.length; i++) {

                var newSpan = document.createElement('span');                                                           //新建一个span元素

                thisPaginationEle.appendChild(newSpan);                                                                 //多少个图片 添加多少个span

            }

            jfAutoPlay.paginationChange(0);                                                                             //默认选中第一个点点

        }

        /*预设图片的显示模式*/

        thisAllTagA[0].className = 'show';                                                                          //第一张为显示

        var thisEle = document.getElementsByClassName('jf_homepage_autoplay')[0];

        /*增加监听*/

        if (jfAutoPlay.jfVariable.isThreeEle) {                                                                              //三张以及以上，此方法通过移动三个子元素

            thisAllTagA[1].className = 'after';                                                                         //第二张为后面一张

            thisAllTagA[thisAllTagA.length - 1].className = 'before';                                                   //最后一张为前一张

            jfAutoPlay.jfVariable.setInterMove1000 = setInterval(jfAutoPlay.jfAutoPlayRight, jfAutoPlay.jfVariable.timer);//页面读取后开始轮播

            thisEle.addEventListener('touchstart', jfAutoPlay.jfAutoStart, false);//添加touchstrat事件

            thisEle.addEventListener('touchmove', jfAutoPlay.jfAutoMove, false);

            thisEle.addEventListener('touchend', jfAutoPlay.jfAutoEnd, false);

        }

        else if (jfAutoPlay.jfVariable.isTwoEle) {                                                                          //两张，此方法通过移动父元素

            for (var i = 0; i < thisAllTagA.length; i++) {

                thisFatherEle.getElementsByTagName('a')[i].getElementsByTagName('img')[0].style.width = screenWidth + 'px';  //每个img的宽度 = 屏幕宽度

                thisAllTagA[i].style.width = screenWidth + 'px';                                                             //每个img的宽度 = 屏幕宽度

            }

            thisFatherEle.style.width = (screenWidth * (thisAllTagA.length)) + 'px';                                    //该元素的总宽度 = 图片数量 * 屏幕宽度

            thisAllTagA[1].className = 'show';                                                                          //第二张为显示

            thisEle.addEventListener('touchstart', jfAutoPlay.jfAutoStart, false);//添加touchstrat事件

            /*jfAutoPlay.jfAddEvent();                                                                                    //添加move 和 end 事件*/

            thisEle.addEventListener('touchmove', jfAutoPlay.jfAutoMove, false);

            thisEle.addEventListener('touchend', jfAutoPlay.jfAutoEnd, false);

            jfAutoPlay.jfVariable.setInterMove1000 = setInterval(jfAutoPlay.jfAutoPlayTwoAll, jfAutoPlay.jfVariable.timer);//页面读取后开始轮播

        }
        else {//默认一张不动

        }

    },

    jfAddEvent: function () {                                                                                       //添加move 和 end 事件

        jfAutoPlay.jfVariable.canMove=true;

        /*        var thisEle = document.getElementsByClassName('jf_homepage_autoplay')[0];

         thisEle.addEventListener('touchmove', jfAutoPlay.jfAutoMove, false);

         thisEle.addEventListener('touchend', jfAutoPlay.jfAutoEnd, false);*/

    },

    jfRemoveEvent: function () {                                                                                     //卸载move 和 end 事件

        jfAutoPlay.jfVariable.canMove=false;
        /*
         var thisEle = document.getElementsByClassName('jf_homepage_autoplay')[0];

         thisEle.removeEventListener('touchmove', jfAutoPlay.jfAutoMove, false);

         thisEle.removeEventListener('touchend', jfAutoPlay.jfAutoEnd, false);*/

    },

    jfAutoStart: function (event) {      //当图片上触摸事件开始时，停止轮播

        var thisFatherEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_autoplay_images')[0];//父元素，主要移动该元素

        clearInterval(jfAutoPlay.jfVariable.setInterMove1000);                                                      //触摸开始时，停下循环轮播

        jfAutoPlay.jfVariable.XPosition = jfAutoPlay.jfVariable.lastStance = event.touches[0].clientX;              //预设第一次触摸点和最后一次触摸点

        var thisShowEle = thisFatherEle.getElementsByClassName('show')[0];

        if (thisShowEle.className.indexOf('delay') < 0 && jfAutoPlay.jfVariable.isThreeEle) {  //触摸时没有delay样式的话&&三个元素以上的情况，添加该样式

            thisShowEle.className += ' delay';                                                                        //消除平滑过渡的效果

            thisFatherEle.getElementsByClassName('after')[0].className += ' delay';

            thisFatherEle.getElementsByClassName('before')[0].className += ' delay';

        }
        else {//两个元素

            thisFatherEle.style.transition = 'transform 0s';

            thisFatherEle.style.webkitTransition = '-webkit-transform 0s';

        }

    },
//判断是否处于ios的setTimeout失效状态
    iosMoveDebug:function (_this) {


        if(_this.className.indexOf('after')>-1&&_this.className.indexOf('delay')>-1&&_this.getAttribute('style').indexOf('-100%')>-1&&_this.offsetLeft>1&&browser.os.iOS){

            this.isIosBug=true;

            var thisShowEleIndex=0;

            var farEle=document.getElementsByClassName('jf_autoplay_images')[0].getElementsByTagName('a');

            for(var i=0;i<farEle.length;i++){

                if(farEle[i]==_this){

                    thisShowEleIndex=i;

                }

                farEle[i].className='delay';

            }

            if(thisShowEleIndex==0){

                _this.className='show delay';

                farEle[thisShowEleIndex+1].className='after delay';

                farEle[farEle.length-1].className='before delay';

            }

            else if(thisShowEleIndex==farEle.length-1){

                _this.className='show delay';

                farEle[0].className='after delay';

                farEle[thisShowEleIndex-1].className='before delay';

            }

            else{

                _this.className='show delay';

                farEle[thisShowEleIndex+1].className='after delay';

                farEle[thisShowEleIndex-1].className='before delay';

            }

            for(var i=0;i<farEle.length;i++){

                farEle[i].setAttribute('style','');

            }

            jfAutoPlay.jfAddEvent();                                                                            //再加监听

        }


    },

    jfAutoMove: function (event) {      //当图片上触摸事件开始时，停止轮播

        jfAutoPlay.iosMoveDebug(event.target.parentNode);                                                               //判断a标签

        if(jfAutoPlay.jfVariable.canMove) {

            var screenWidth = document.body.clientWidth;                                                               //屏幕宽度

            windowBanEvent.bundling();                                                                                  //触摸时禁止其他页面事件

            var XThisPosition = event.touches[0].clientX;                                                               //此时触摸的x值

            if (XThisPosition - jfAutoPlay.jfVariable.XPosition > screenWidth / 3 || XThisPosition - jfAutoPlay.jfVariable.lastStance > 6) {//移动距离大于三分之一或者移动速度大于6

                jfAutoPlay.jfVariable.isChange = 1;                                                                     //后退

            }

            else if (XThisPosition - jfAutoPlay.jfVariable.XPosition < -screenWidth / 3 || XThisPosition - jfAutoPlay.jfVariable.lastStance < -6) {//移动距离大于三分之一或者移动速度大于6

                jfAutoPlay.jfVariable.isChange = 2;                                                                     //前进

            }

            else {

                jfAutoPlay.jfVariable.isChange = 0;                                                                     //恢复原位，停止不动

            }

            var thisFatherEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_autoplay_images')[0];//父元素，主要移动该元素

            if (jfAutoPlay.jfVariable.isThreeEle) {//三个元素以上的情况,移动

                thisFatherEle.getElementsByClassName('show')[0].style.transform = 'translate3d(' + (XThisPosition - jfAutoPlay.jfVariable.XPosition) + 'px,0,0)'; //此时的元素

                thisFatherEle.getElementsByClassName('show')[0].style.webkitTransform = 'translate3d(' + (XThisPosition - jfAutoPlay.jfVariable.XPosition) + 'px,0,0)';

                thisFatherEle.getElementsByClassName('after')[0].style.transform = 'translate3d(' + (XThisPosition - jfAutoPlay.jfVariable.XPosition) + 'px,0,0)';//下一个元素

                thisFatherEle.getElementsByClassName('after')[0].style.webkitTransform = 'translate3d(' + (XThisPosition - jfAutoPlay.jfVariable.XPosition) + 'px,0,0)';

                thisFatherEle.getElementsByClassName('before')[0].style.transform = 'translate3d(' + (XThisPosition - jfAutoPlay.jfVariable.XPosition) + 'px,0,0)';//上一个元素

                thisFatherEle.getElementsByClassName('before')[0].style.webkitTransform = 'translate3d(' + (XThisPosition - jfAutoPlay.jfVariable.XPosition) + 'px,0,0)';


            }
            else {//两种情况，移动，需要当心边缘抵抗

                var thisPosition = XThisPosition - jfAutoPlay.jfVariable.XPosition;

                if (!jfAutoPlay.jfVariable.ifPosition) {

                    if (thisPosition <= 0) {
                        thisFatherEle.style.transform = 'translate3d(' + thisPosition + 'px,0,0)';

                        thisFatherEle.style.webkitTransform = 'translate3d(' + thisPosition + 'px,0,0)'
                    }
                    else {
                        thisFatherEle.style.transform = 'translate3d(' + thisPosition / 4 + 'px,0,0)';//边缘抵抗为移动的四分之一

                        thisFatherEle.style.webkitTransform = 'translate3d(' + thisPosition / 4 + 'px,0,0)'
                    }
                }
                else {

                    if (thisPosition >= 0) {

                        thisFatherEle.style.transform = 'translate3d(' + (thisPosition - screenWidth) + 'px,0,0)';

                        thisFatherEle.style.webkitTransform = 'translate3d(' + (thisPosition - screenWidth) + 'px,0,0)'

                    }

                    else {

                        thisFatherEle.style.transform = 'translate3d(' + (thisPosition / 4 - screenWidth) + 'px,0,0)';

                        thisFatherEle.style.webkitTransform = 'translate3d(' + (thisPosition / 4 - screenWidth) + 'px,0,0)'

                    }
                }
            }

            jfAutoPlay.jfVariable.lastStance = XThisPosition;                                                           //存储这次触摸位置，供下次使用

        }

    },

    jfAutoEnd: function (event) {        //当图片上触摸事件结束时，继续轮播

        if(jfAutoPlay.jfVariable.canMove) {

            var thisFatherEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_autoplay_images')[0];//父元素，主要移动该元素

            var thisShowEle = thisFatherEle.getElementsByClassName('show')[0];

            var thisAfterEle = thisFatherEle.getElementsByClassName('after')[0];

            if (jfAutoPlay.jfVariable.isThreeEle) {//三个元素以上的情况

                var thisBeforeEle = thisFatherEle.getElementsByClassName('before')[0];

                thisShowEle.className = thisShowEle.className.replace(' delay', '');                                         //消除平滑过渡的效果

                thisAfterEle.className = thisAfterEle.className.replace(' delay', '');

                thisBeforeEle.className = thisBeforeEle.className.replace(' delay', '');

            }

            if (jfAutoPlay.jfVariable.isChange == 2 && jfAutoPlay.jfVariable.isThreeEle) {//三个元素以上的情况 向右

                jfAutoPlay.jfAutoPlayRight();

            }

            else if (jfAutoPlay.jfVariable.isChange == 2) {//两个元素的情况 向右

                jfAutoPlay.jfAutoPlayTwoRight();

            }
            else if (jfAutoPlay.jfVariable.isChange == 1 && jfAutoPlay.jfVariable.isThreeEle) {//三个元素以上的情况 向左

                jfAutoPlay.jfAutoPlayLeft();

            }
            else if (jfAutoPlay.jfVariable.isChange == 1) {//两个元素的情况 向左

                jfAutoPlay.jfAutoPlayTwoLeft();

            }

            else {

                if (jfAutoPlay.jfVariable.isThreeEle) {

                    thisShowEle.style.transform = '';
                    thisShowEle.style.webkitTransform = ''; //此时的元素

                    thisAfterEle.style.transform = '';
                    thisAfterEle.style.webkitTransform = '';  //下一个元素

                    thisBeforeEle.style.transform = '';

                    thisBeforeEle.style.webkitTransform = '';      //上一个元素

                }
                else {

                    thisFatherEle.style.transition = '';
                    thisFatherEle.style.webkitTransition = '';

                    if (!jfAutoPlay.jfVariable.ifPosition) {

                        thisFatherEle.style.transform = '';
                        thisFatherEle.style.webkitTransform = ''

                    }
                    else {

                        var screenWidth = document.body.clientWidth;

                        thisFatherEle.style.transform = 'translate3d(-' + screenWidth + 'px,0,0)';

                        thisFatherEle.style.webkitTransform = 'translate3d(-' + screenWidth + 'px,0,0)';

                    }


                }

                thisShowEle.addEventListener('transitionend', transitionMoveEndFn, false);                              //绑定平滑过渡后的方法

                thisShowEle.addEventListener('webkitTransitionEnd', transitionMoveEndFn, false);

                thisFatherEle.addEventListener('transitionend', transitionMoveEndFn, false);                              //绑定平滑过渡后的方法

                thisFatherEle.addEventListener('webkitTransitionEnd', transitionMoveEndFn, false);

                function transitionMoveEndFn() {

                    windowBanEvent.unbundling();                                                                        //解绑

                    thisShowEle.removeEventListener('transitionend', transitionMoveEndFn, false);                       //绑定平滑过渡后的方法

                    thisShowEle.removeEventListener('webkitTransitionEnd', transitionMoveEndFn, false);

                    thisFatherEle.removeEventListener('transitionend', transitionMoveEndFn, false);                       //绑定平滑过渡后的方法

                    thisFatherEle.removeEventListener('webkitTransitionEnd', transitionMoveEndFn, false);

                }

            }

            if (jfAutoPlay.jfVariable.isThreeEle) {//三个元素以上的情况

                jfAutoPlay.jfVariable.setInterMove1000 = setInterval(jfAutoPlay.jfAutoPlayRight, jfAutoPlay.jfVariable.timer);//加轮播循环

            }
            else {//三个元素以上的情况
                jfAutoPlay.jfVariable.setInterMove1000 = setInterval(jfAutoPlay.jfAutoPlayTwoAll, jfAutoPlay.jfVariable.timer);//开始轮播
            }

            jfAutoPlay.jfVariable.isChange = jfAutoPlay.jfVariable.XPosition = jfAutoPlay.jfVariable.lastStance = 0;    //初始化动态值

            windowBanEvent.unbundling();                                                                                 //解绑

        }

    },

    jfAutoPlayTwoAll: function () {

        if (!jfAutoPlay.jfVariable.ifPosition) {

            jfAutoPlay.jfAutoPlayTwoRight();

        }
        else {

            jfAutoPlay.jfAutoPlayTwoLeft();

        }

    },

    jfAutoPlayTwoRight: function () {

        var thisFatherEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_autoplay_images')[0];//父元素，主要移动该元素

        var screenWidth = document.body.clientWidth;                                                               //屏幕宽度

        thisFatherEle.style.transition = '';

        thisFatherEle.style.webkitTransition = '';

        thisFatherEle.style.transform = 'translate3d(-' + screenWidth + 'px,0,0)';

        thisFatherEle.style.webkitTransform = 'translate3d(-' + screenWidth + 'px,0,0)';

        jfAutoPlay.jfVariable.ifPosition = 1;

        jfAutoPlay.paginationChange(1);

    },

    jfAutoPlayTwoLeft: function () {

        var thisFatherEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_autoplay_images')[0];//父元素，主要移动该元素

        thisFatherEle.style.transition = '';
        thisFatherEle.style.webkitTransition = '';

        thisFatherEle.style.transform = '';
        thisFatherEle.style.webkitTransform = '';

        jfAutoPlay.jfVariable.ifPosition = 0;

        jfAutoPlay.paginationChange(0);

    },


    jfAutoPlayRight: function () {//向右移动

        jfAutoPlay.jfRemoveEvent();

        var thisFatherEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_autoplay_images')[0];//父元素，主要移动该元素

        var thisAllTagA = thisFatherEle.getElementsByTagName('a');                                                      //包含img的a

        var thisBeforeEle = thisFatherEle.getElementsByClassName('before')[0];                                         //前一个元素

        var thisShowEle = thisFatherEle.getElementsByClassName('show')[0];                                              //此时的元素

        var thisAfterEle = thisFatherEle.getElementsByClassName('after')[0];                                            //下一个元素



        if (!jfAutoPlay.jfVariable.isAndroidVersion4) {//非安卓4.4以下系统

            thisShowEle.className = thisShowEle.className.replace(' delay', ' move');                                       //此时的元素向后平滑过渡

            thisShowEle.style.transform = 'translate3d(-100%, 0, 0)';
            thisShowEle.style.webkitTransform = 'translate3d(-100%, 0, 0)';

            thisAfterEle.className = thisAfterEle.className.replace(' delay', ' move');                                     //下个元素向后平滑过渡

            thisAfterEle.style.transform = 'translate3d(-100%, 0, 0)';
            thisAfterEle.style.webkitTransform = 'translate3d(-100%, 0, 0)';

            thisShowEle.addEventListener('transitionend', transitionEndFn, false);                                          //绑定平滑过渡后的方法

            thisShowEle.addEventListener('webkitTransitionEnd', transitionEndFn, false);

            jfAutoPlay.isMove=true;

            function transitionEndFn() {

                if(jfAutoPlay.isMove) {

                    if(jfAutoPlay.isIosBug&&browser.os.iOS) {

                        jfAutoPlay.isMove = false;

                        jfAutoPlay.isIosBug=false;

                        setTimeout(function () {

                            jfAutoPlay.isMove = true;

                        }, 500);

                    }



                    thisShowEle.className += ' delay';                                                                          //消除平滑过渡的效果

                    thisAfterEle.className += ' delay';

                    setTimeout(function () {

                        thisBeforeEle.className = '';                                                                             //前一个元素隐藏

                        thisShowEle.className = 'before delay';                                                                  //将此时这个元素变成上一个元素

                        thisShowEle.style.transform = '';
                        thisShowEle.style.webkitTransform = '';

                        thisAfterEle.className = 'show delay ';                                                                  //此时下一个元素变成这个元素

                        thisAfterEle.style.transform = '';
                        thisAfterEle.style.webkitTransform = '';

                        for (var i = 0, switchI = 0; i < thisAllTagA.length; i++) {                                         //遍历寻找下一个元素

                            if (thisAllTagA[i] == thisAfterEle) {                                                           //找到那个元素

                                switchI = 1;

                                jfAutoPlay.paginationChange(i);                                                             //小圆点跳到那个点

                            }
                            else if (switchI && thisAllTagA[i].tagName == 'A') {

                                break;                                                                                       //获取i的值

                            }

                        }


                        if (i != thisAllTagA.length) {                                                                         //如果没有找到，说明下一个元素在第一个

                            thisAllTagA[i].className = 'after delay';

                        }
                        else {

                            thisAllTagA[0].className = 'after delay';                                                      //如果找到，说明下一个元素就是i的位置

                        }

                        thisShowEle.removeEventListener('transitionend', transitionEndFn);                                  //移除平滑过渡

                        thisShowEle.removeEventListener('webkitTransitionEnd', transitionEndFn);

                        for (var i = 0; i < thisAllTagA.length; i++) {

                            thisAllTagA[i].style.transform = '';

                            thisAllTagA[i].style.webkitTransform = '';//清空style值

                        }

                        jfAutoPlay.jfAddEvent();                                                                            //再加监听



                    }, 100)

                }
            }

        }

        else {//安卓4.4以下系统，取消平滑过渡效果
            thisBeforeEle.className = '';                                                                             //前一个元素隐藏

            thisShowEle.className = 'before delay';                                                                  //将此时这个元素变成上一个元素

            thisShowEle.style.transform = '';
            thisShowEle.style.webkitTransform = '';

            thisAfterEle.className = 'show delay ';                                                                  //此时下一个元素变成这个元素

            thisAfterEle.style.transform = '';
            thisAfterEle.style.webkitTransform = '';

            for (var i = 0, switchI = 0; i < thisAllTagA.length; i++) {                                         //遍历寻找下一个元素

                if(thisAllTagA[i].style) {
                    thisAllTagA[i].removeAttribute('style');
                }
                if (thisAllTagA[i] == thisAfterEle) {                                                           //找到那个元素

                    switchI = 1;

                    jfAutoPlay.paginationChange(i);                                                             //小圆点跳到那个点
                }
                else if (switchI && thisAllTagA[i].tagName == 'A') {

                    break;                                                                                       //获取i的值

                }
            }

            if (i != thisAllTagA.length) {                                                                         //如果没有找到，说明下一个元素在第一个

                thisAllTagA[i].className = 'after delay';

            }

            else {

                thisAllTagA[0].className = 'after delay ';                                                      //如果找到，说明下一个元素就是i的位置

            }

            jfAutoPlay.jfAddEvent();                                                                            //再加监听

        }

    },
    jfAutoPlayLeft: function () {//向左移动

        jfAutoPlay.jfRemoveEvent();

        var thisFatherEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_autoplay_images')[0];//父元素，主要移动该元素

        var thisAllTagA = thisFatherEle.getElementsByTagName('a');                                                      //包含img的a

        var thisBeforeEle = thisFatherEle.getElementsByClassName('before')[0];                                         //前一个元素

        var thisShowEle = thisFatherEle.getElementsByClassName('show')[0];                                              //此时的元素

        var thisAfterEle = thisFatherEle.getElementsByClassName('after')[0];                                            //下一个元素

        if (!jfAutoPlay.jfVariable.isAndroidVersion4) {//非安卓4.4以下系统

            thisShowEle.className = thisShowEle.className.replace(' delay', ' move_left');                                        //此时的元素向后平滑过渡

            thisShowEle.style.transform = 'translate3d(100%, 0, 0)';

            thisShowEle.style.webkitTransform = 'translate3d(100%, 0, 0)';

            thisBeforeEle.className = thisBeforeEle.className.replace(' delay', ' move_left');                                   //下个元素向后平滑过渡

            thisBeforeEle.style.transform = 'translate3d(100%, 0, 0)';
            thisBeforeEle.style.webkitTransform = 'translate3d(100%, 0, 0)';

            thisShowEle.addEventListener('transitionend', transitionEndFn, false);                                          //绑定平滑过渡后的方法

            thisShowEle.addEventListener('webkitTransitionEnd', transitionEndFn, false);

            function transitionEndFn() {

                thisShowEle.className += ' delay';                                                                          //消除平滑过渡的效果

                thisBeforeEle.className += ' delay';

                setTimeout(function () {

                    thisAfterEle.className = '';                                                                             //前一个元素隐藏

                    thisShowEle.className = 'after delay';                                                                  //将此时这个元素变成上一个元素

                    thisShowEle.style.transform = '';
                    thisShowEle.style.webkitTransform = '';

                    thisBeforeEle.className = 'show delay';                                                                  //此时下一个元素变成这个元素

                    thisBeforeEle.style.transform = '';
                    thisBeforeEle.style.webkitTransform = '';


                    for (var i = thisAllTagA.length - 1, switchI = 0; i >= 0; i--) {                                         //遍历寻找下一个元素

                        if (thisAllTagA[i] == thisBeforeEle) {

                            switchI = 1;

                            jfAutoPlay.paginationChange(i);

                        }
                        else if (switchI && thisAllTagA[i].tagName == 'A') {

                            break;                                                                                       //获取i的值

                        }

                    }

                    if (i != -1) {                                                                                        //如果没有找到，说明下一个元素在第一个

                        thisAllTagA[i].className = 'before delay';

                    }
                    else {

                        thisAllTagA[thisAllTagA.length - 1].className = 'before delay';                                   //如果找到，说明下一个元素就是i的位置

                    }

                    thisShowEle.removeEventListener('transitionend', transitionEndFn);                                  //移除平滑过渡

                    thisShowEle.removeEventListener('webkitTransitionEnd', transitionEndFn);

                    for (var i = 0; i < thisAllTagA.length; i++) {

                        thisAllTagA[i].style.transform = '';
                        thisAllTagA[i].style.webkitTransform = '';

                    }

                    jfAutoPlay.jfAddEvent();                                                                            //加监听


                }, 100)


            }
        }

        else {//安卓4.4以下系统，取消平滑过渡效果
            thisAfterEle.className = '';                                                                             //前一个元素隐藏

            thisShowEle.className = 'after delay';                                                                  //将此时这个元素变成上一个元素

            thisShowEle.style.transform = '';
            thisShowEle.style.webkitTransform = '';

            thisBeforeEle.className = 'show delay';                                                                  //此时下一个元素变成这个元素

            thisBeforeEle.style.transform = '';
            thisBeforeEle.style.webkitTransform = '';

            for (var i = thisAllTagA.length - 1, switchI = 0; i >= 0; i--) {                                         //遍历寻找下一个元素

                if(thisAllTagA[i].style) {
                    thisAllTagA[i].removeAttribute('style');
                }
                if (thisAllTagA[i] == thisBeforeEle) {                                                           //找到那个元素

                    switchI = 1;

                    jfAutoPlay.paginationChange(i);                                                             //小圆点跳到那个点
                }
                else if (switchI && thisAllTagA[i].tagName == 'A') {

                    break;                                                                                       //获取i的值

                }
            }

            if (i != -1) {                                                                                        //如果没有找到，说明下一个元素在第一个

                thisAllTagA[i].className = 'before delay';

            }
            else {

                thisAllTagA[thisAllTagA.length - 1].className = 'before delay';                                   //如果找到，说明下一个元素就是i的位置

            }

            jfAutoPlay.jfAddEvent();                                                                            //再加监听

        }

    },
    paginationChange: function (thisChangeI) {

        var thisPaginationEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_pagination')[0];//光标

        var thisPaginationSpan = thisPaginationEle.getElementsByTagName('span');                                        //所有的小点点

        for (var i = 0; i < thisPaginationSpan.length; i++) {

            thisPaginationSpan[i].removeAttribute('class');                                                         //清除所有点点的样式，以便重新写

        }

        var activePag;                                                                                             //增加点点选中时的样式

        if (thisChangeI >= thisPaginationSpan.length) {                                                             //翻动时（最后一张到最后一张）的debug

            activePag = 0;

        }

        else {

            activePag = thisChangeI;                                                                                //到哪张，就移动哪张

        }

        thisPaginationSpan[activePag].className = 'active';                                                         //此时这点点被选中
    },

    jfCarouselInit: function () {                                                                                   //初始化

        //window.addEventListener('load', function () {

        jfAutoPlay.jfAutoPlayInit();

        //});

    }

};