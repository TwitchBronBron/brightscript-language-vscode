---
title: Deep Linking (ECP)
---
# Deep Linking (ECP)

You can launch a debug session with a deep link by setting the `deepLinkUrl` property in your `launch.json` configuration.

```json
{
  "type": "brightscript",
  "rootDir": "${workspaceFolder}/dist",
  "host": "192.168.1.2",
  "deepLinkUrl": "http://${host}:8060/launch/dev?${promptForQueryParams}"
}
```

There are several string placeholders you can use when defining your deep link url, but none of them are required.

- `${host}` - the roku host. This is the `host` property set in your launch configuration. By using `${host}` in the deep link url, it prevents you from needing to update the host twice in your config when you want to change which Roku to debug.

- `${promptForQueryparams}` - will pop up an input box at debug launch time, asking for the URL-encoded query parameters to pass to the deep link.

- `${promptForDeepLinkUrl}` - if the entire `deepLinkUrl` is set to this, then at debug launch time, an input box will appear asking you to input the full deep link url.
