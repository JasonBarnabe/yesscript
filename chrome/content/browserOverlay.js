var yesScriptBrowserOverlay = {

	sites: [],
	panel: null,
	get button() {
		return document.getElementById("yesscript-button");
	},

	init: function() {
		yesScriptBrowserOverlay.panel = document.getElementById("yesscript-panel");
		//update the status...
		//when a document begins loading
		gBrowser.addProgressListener(yesScriptBrowserOverlay); 
		//when the active tab changes
		gBrowser.tabContainer.addEventListener("TabSelect", yesScriptBrowserOverlay.updateStatus, false);
		//when the pref changes
		yesScriptCommon.updateCallbacks.push(yesScriptBrowserOverlay.updateStatus);
		//right now
		yesScriptBrowserOverlay.updateStatus();

		var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).QueryInterface(Components.interfaces.nsIPrefBranch);
		switch (prefService.getIntPref("extensions.yesscript.firstRun")) {
			case 0:
				// add to nav bar
				var navbar = document.getElementById("nav-bar");
				var button = document.getElementById("yesscript-button");
				if (navbar && !button) {
					var newCurrentSet = navbar.currentSet.split(",").concat(["yesscript-button"]).join(",");
					navbar.currentSet = newCurrentSet; // for immediate display
					navbar.setAttribute("currentset", newCurrentSet); // for persisting
					document.persist(navbar.id, "currentset");
					try {
						BrowserToolboxCustomizeDone(true);
					} catch (e) {
						Components.utils.reportError(e);
					}
				}
				prefService.setIntPref("extensions.yesscript.firstRun", 1);
		}
	},

	//nsIWebProgress stuff
	QueryInterface: function(aIID) {
		if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
		    aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
		    aIID.equals(Components.interfaces.nsISupports))
			return this;
		throw Components.results.NS_NOINTERFACE; 
	},
	onLocationChange: function(progress, request, uri) {
		//if it's the current tab that changed, update the status
		if (uri && uri.spec == content.document.location.href) {
			yesScriptBrowserOverlay.updateStatus();
		}
	},
	onStateChange: function() {},
  onProgressChange: function() {},
	onStatusChange: function() {},
	onSecurityChange: function() {},
	onLinkIconAvailable: function() {},

	onPageLoad: function(aEvent) {
		if (aEvent.originalTarget == content.document) {
			yesScriptBrowserOverlay.updateStatus();
		}
	},

	updateStatus: function() {
		var blacklisted = yesScriptCommon.isBlacklisted(content.document.location.href) != null;
		var key = blacklisted ? "blacklisted" : "notBlacklisted";
		if (yesScriptBrowserOverlay.panel) {
			yesScriptBrowserOverlay.panel.setAttribute("src", blacklisted ? "chrome://yesscript/skin/black.png" : "chrome://yesscript/skin/ok.png");
			yesScriptBrowserOverlay.panel.setAttribute("tooltiptext", yesScriptCommon.strings.getFormattedString(key, [yesScriptCommon.getSiteString(content.document.location.href)]));
			yesScriptBrowserOverlay.panel.setAttribute("blacklisted", blacklisted);
		} else if (yesScriptBrowserOverlay.button) {
			yesScriptBrowserOverlay.button.setAttribute("tooltiptext", yesScriptCommon.strings.getFormattedString(key, [yesScriptCommon.getSiteString(content.document.location.href)]));
			yesScriptBrowserOverlay.button.setAttribute("blacklisted", blacklisted);
		}
	},

	toggle: function() {
		if (yesScriptBrowserOverlay.panel) {
			yesScriptCommon.blacklist(content.document.location.href, !(yesScriptBrowserOverlay.panel.getAttribute("blacklisted") == "true"));
		} else if (yesScriptBrowserOverlay.button) {
			yesScriptCommon.blacklist(content.document.location.href, !(yesScriptBrowserOverlay.button.getAttribute("blacklisted") == "true"));
		}
	}

}

window.addEventListener("load", yesScriptBrowserOverlay.init, false);
