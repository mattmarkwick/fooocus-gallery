# Tampermonkey Svelte Template
## What is this template?
This template allows easy creation of UserScripts for [Tampermonkey](https://www.tampermonkey.net/) using [Svelte](https://svelte.dev/).

## Getting Started
Replace `your-project-name` with whatever you would like the name of your project to be.

```bash
npm degit lpshanley/tampermonkey-svelte your-project-name
cd your-project-name
npm i
npm run dev
```

If you do not have Tampermonkey installed yet [click here](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) to install from the chrome web store.

*Note:* Allowing an extension access to files can have security risks. Please read and be informed about these risks prior to moving forward.

After you install tampermonkey enable the `"Allow access to file URL's"` setting in the chrome extension settings for tampermonkey.

Copy **only** the header details from `dist/bundle.js`. It should look like this
```
// ==UserScript==
// @name        tampermonkey-svelte-dev
// @description Tampermonkey template that uses svelte to build UserScripts
// @namespace   https://github.com
// @version     1.0.0
// @homepage    https://github.com/lpshanley/tampermonkey-svelte#readme
// @author      Lucas Shanley
// @resource    css file:///D:/tampermonkey-svelte/dist/bundle.css
// @match       https://*.github.com/*
// @connect     github.com
// @run-at      document-idle
// @require     file:///D:/tampermonkey-svelte/dist/bundle.js
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       GM_xmlhttpRequest
// ==/UserScript==
```

Add this as a new script into tampermonkey. Remember to **only** copy the header details. Once this is done you should be able to reload your webpage and being creating your script. When running `npm run dev` your source will be watched and changes will rebuild automatically, you will need to refresh the browser to pickup the new changes.

***IMPORTANT NOTE*** changes outside of `/src` are not watched. If you make
changes to files like `meta.js`, `package.json`, etc you will need to stop 
the dev server and restart it. Changes to the header will need to be copied 
and pasted into tampermonkey any time a change occurs. Failing to do this
may cause expected functionality to not behave as expected.

## Files to update

### package.json
```jsonc
{
    "name": "your-project-name",
    "description": "Your project description...",
    "author": "Your Name",
    "homepage": "https://yourhomepage.com"
    ...
}
```

### meta.js
```javascript
...
const distURLBase = `https://yourdisturl.com/dist`;
...
let meta = {
    ...
    // Namespace of the script (ex: https://example.com)
    "namespace": "https://example.com",
    ...
    // URL's you would like you scripts to run on
    "match": [],
    ...
    // Domains you need to make requests from
    "connect": [],
    ...
}
```
By default some of the metadata for your project is shared with `package.json`. This behavior is fine to alter to your needs by changing the values in `meta.js`.

See [Tampermonkey Documentation](https://www.tampermonkey.net/documentation.php) for more details.

## Ready to share?
You can run `npm run build` and this will change the header details in the dist script so that they are ready to deploy for people to use. This removes the references to local scripts and creates references to web urls.

## Additional References
- [Svelte](https://svelte.dev/)
- [Tampermonkey](https://www.tampermonkey.net/documentation.php)
- [Rollup](https://rollupjs.org/guide/en/)