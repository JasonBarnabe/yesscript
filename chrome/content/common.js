var yesScriptCommon = {

	sites: [],
	prefs: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("capability.policy."),
	io: Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService),
	prompts: Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService),
	panel: null,
	updateCallbacks: [],
	strings: null,
  unicodeConverter: Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter),

	init: function() {
		yesScriptCommon.unicodeConverter.charset = "UTF-8";
		yesScriptCommon.strings = document.getElementById("yesscript-strings");
		yesScriptCommon.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		yesScriptCommon.prefs.addObserver("yesscript.sites", yesScriptCommon, false);
		yesScriptCommon.reload();
	},

	shutdown: function() {
		yesScriptCommon.prefs.removeObserver("yesscript.sites", yesScriptCommon);
	},

	observe: function(subject, topic, data) {
		if (topic != "nsPref:changed") {
			return;
		}
		yesScriptCommon.reload();
	},

	isBlacklisted: function(url) {
		if (yesScriptCommon.sites.indexOf(url) != -1)
			return url;
		url = yesScriptCommon.getSiteString(url);
		if (yesScriptCommon.sites.indexOf(url) != -1)
			return url;
		return null;
	},

	createURI: function(url) {
		return yesScriptCommon.io.newURI(url, null, null);
	},

	getSiteString: function(url) {
		//workaround for bug 454339 - look for urls with a port but without a protocol
		if (/^[^:]+:[0-9]{1,4}$/.test(url)) {
			//prepend the protocol (assume http)
			url = "http:" + url;
		}
		var uri = yesScriptCommon.createURI(url);
		var scheme = uri.scheme;
		try {
			var host = uri.hostPort;
		}	catch (ex) {
			//weird urls like about:blank
			return url;
		}
		return scheme + "://" + host;
	},

	reload: function() {
		//recreate from the pref, converting to unicode, filtering out whitespace and empty strings, and sorting
		var cleanSites = yesScriptCommon.prefs.getCharPref("yesscript.sites").split(" ");
		for (var i = 0; i < cleanSites.length; i++) {
			cleanSites[i] = this.unicodeConverter.ConvertToUnicode(cleanSites[i]);
		}
		yesScriptCommon.sites = cleanSites.filter(function(element) {
			return !(/\s+/.test(element) || element.length == 0);
		}).sort();
		for (var i = 0; i < yesScriptCommon.updateCallbacks.length; i++) {
			yesScriptCommon.updateCallbacks[i]();
		}
	},

	blacklist: function(url, blacklistValue) {
		var currentBlacklistUrl = yesScriptCommon.isBlacklisted(url);
		if (!(blacklistValue ^ (currentBlacklistUrl != null))) {
			//it's already done
			return;
		}
		if (blacklistValue) {
			yesScriptCommon.sites.push(yesScriptCommon.getSiteString(url));
		} else {
			yesScriptCommon.sites.splice(yesScriptCommon.sites.indexOf(currentBlacklistUrl), 1);
		}
		yesScriptCommon.prefs.setCharPref("yesscript.sites", yesScriptCommon.getPrefString());
	},

	getPrefString: function() {
		var cleanSites = [];
		for (var i = 0; i < yesScriptCommon.sites.length; i++) {
			cleanSites.push(this.cleanURI(yesScriptCommon.sites[i]));
		}
		return cleanSites.join(" ");
	},

	cleanURI: function(uri) {
		//convert from unicode for IDN. not something that complicated, but i figured out that i had to do it from NoScript's code
		return this.unicodeConverter.ConvertFromUnicode(uri);
	},

	dump: function() {
		alert("policynames: '" + yesScriptCommon.prefs.getCharPref("policynames") + "'\n" +
					"yesscript.sites: '" + yesScriptCommon.prefs.getCharPref("yesscript.sites") + "'\n" +
					"yesscript.javascript.enabled: '" + yesScriptCommon.prefs.getCharPref("yesscript.javascript.enabled") + "'");
	}
}

window.addEventListener("load", yesScriptCommon.init, false);
window.addEventListener("unload", yesScriptCommon.shutdown, false);
