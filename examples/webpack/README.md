# Webpack Example script

This directory contains example SDK script bundled by webpack.

To compile it, simply run

```
npm run build
```

and check contents of `dist/script.js`. To build it minified, set
environment variable `NODE_ENV` to `production`:

```
NODE_ENV=production npm run build
```

To try it, upload it as one of your scripts, assign a rule and trigger using following url:

```
https://api.voximplant.com/platform_api/StartScenarios?account_id={account_id}&api_key={api_key}&rule_id={rule_id}
```
