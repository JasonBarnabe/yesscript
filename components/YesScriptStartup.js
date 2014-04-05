Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
function YesScriptStartup() {
}
YesScriptStartup.prototype = {
	classID: Components.ID("{211e145e-dff2-11db-8314-0800200c9a66}"),
	contractID: "@yesscript/startup;1",
	classDescription: "YesScript Startup",

	QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsISupports, Components.interfaces.nsIObserver]),

	observe: function(aSubject, aTopic, aData) {
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).QueryInterface(Components.interfaces.nsIPrefBranch);

		if ("nsIDomainPolicy" in Components.interfaces) {
			// use nsIDomainPolicy - initialize the preference
			var initialValue = "";
			try {
				initialValue = prefs.getCharPref("extensions.yesscript.sites");
			} catch (ex) {
				// not set - initialize from old CAPS pref, or empty string
				try {
					initialValue = prefs.getCharPref("capability.policy.yesscript.sites");
				} catch (ex) {}
				prefs.setCharPref("extensions.yesscript.sites", initialValue);
				// clear CAPS prefs
				Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("capability.policy.yesscript").deleteBranch("");
			}
			// run now and whenever it changes
			YesScriptPrefListener.handleChange(initialValue);
			prefs.addObserver("extensions.yesscript.sites", YesScriptPrefListener, false);
			return;
		}

		// use CAPS - ensure we have the prefs set
		try {
			var policyString = prefs.getCharPref("capability.policy.policynames");
			var policies = policyString.split(" ");
			if (!/yesscript/.test(policies)) {
				prefs.setCharPref("capability.policy.policynames", policyString + " yesscript");
			}
		} catch (ex) {
			prefs.setCharPref("capability.policy.policynames", "yesscript");
		}
		prefs.setCharPref("capability.policy.yesscript.javascript.enabled", "noAccess");
		try {
			prefs.getCharPref("capability.policy.yesscript.sites");
		} catch (ex) {
			prefs.setCharPref("capability.policy.yesscript.sites", "");
		}
	}
};

if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([YesScriptStartup]);
else
    var NSGetModule = XPCOMUtils.generateNSGetModule([YesScriptStartup]);

var YesScriptPrefListener = {
	domainPolicy: null,
	observe: function(aSubject, aTopic, aData) {
		if (aTopic != "nsPref:changed") {
			return;
		}
		this.handleChange(aSubject.QueryInterface(Components.interfaces.nsIPrefBranch).getCharPref(aData));
	},
	handleChange: function(sitesString) {
		var that = YesScriptPrefListener;
		if (sitesString.length == 0) {
			if (that.domainPolicy != null) {
				that.domainPolicy.deactivate();
				that.domainPolicy = null;
			}
			return;
		}
		var sites = sitesString.split(" ");
		if (that.domainPolicy == null) {
			var ssm = Components.classes["@mozilla.org/scriptsecuritymanager;1"].getService(Components.interfaces.nsIScriptSecurityManager);
			if (ssm.domainPolicyActive) {
				Components.utils.reportError("YesScript could not modify blacklist, domain policy is being used by something else.");
				return;
			}
			that.domainPolicy = ssm.activateDomainPolicy();
		}
		that.domainPolicy.blacklist.clear();
		var io = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
		sites.forEach(function(site) {
			try {
				var uri = io.newURI(site, null, null);
				that.domainPolicy.blacklist.add(uri);
			} catch (ex) {
				Components.utils.reportError("Could not block '" + site + "': " + ex);
			}
		});
	}
}
