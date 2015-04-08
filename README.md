YesScript lets you easily block websites from running JavaScript. Useful for sites who abuse JavaScript, not so useful for security.

## Block or unblock a site

Click the YesScript icon ![](https://github.com/JasonBarnabe/yesscript/raw/master/chrome/skin/ok.png) in the toolbar to stop the current domain from running scripts. Click the blackened icon ![](https://github.com/JasonBarnabe/yesscript/raw/master/chrome/skin/black.png) to unblock.

You can also view and manage the list of blocked sites from YesScript's options, accessible from the Add-ons Manager.

## Details

- You are blocking a *site* from running scripts. You are not blocking any given *script*. In other words, if example.com is running a script from annoying.org, you need to block example.com.
- You cannot selectively allow a site to run some scripts and disallow it from running others.
- The block is based on the protocol and domain of the site. Blocking `http://example.com` will not block `https://example.com` or `http://www.example.com`.
- The block does not take effect immediately - it must be in effect when the page loads to work.

## I want regular expressions

Don't we all? Unfortunately, YesScript only works because of the API Firefox provides, and that interface only supports doing things by domain.
