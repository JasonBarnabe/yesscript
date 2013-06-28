Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
function YesScriptStartup() {
}
YesScriptStartup.prototype = {
  classID: Components.ID("{211e145e-dff2-11db-8314-0800200c9a66}"),
  contractID: "@yesscript/startup;1",
  classDescription: "YesScript Startup",

  QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsISupports, Components.interfaces.nsIObserver]),

  observe: function(aSubject, aTopic, aData) {
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("capability.policy.");
	//ensure we have the prefs set
	try {
		var policyString = prefs.getCharPref("policynames");
		var policies = policyString.split(" ");
		if (!/yesscript/.test(policies)) {
			prefs.setCharPref("policynames", policyString + " yesscript");
		}
	} catch (ex) {
		prefs.setCharPref("policynames", "yesscript");
	}
	prefs.setCharPref("yesscript.javascript.enabled", "noAccess");
	try {
		prefs.getCharPref("yesscript.sites");
	} catch (ex) {
		prefs.setCharPref("yesscript.sites", "");
	}
  }

};

// this throws and is unnecessary in firefox 4+
try {
Components.classes["@mozilla.org/categorymanager;1"].getService(Components.interfaces.nsICategoryManager).addCategoryEntry("profile-after-change", "YesScriptStartup", YesScriptStartup.prototype.contractID, true, true);
} catch (ex) {}


if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([YesScriptStartup]);
else
    var NSGetModule = XPCOMUtils.generateNSGetModule([YesScriptStartup]);
