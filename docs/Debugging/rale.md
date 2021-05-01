---
title: RALE Support
---
# RALE Support

The extension can automatically inject the `TrackerTask.xml` and the code snippet required to start the tracker task.
To do this you need a few simple things:

- In your VS Code user settings add the `brightscript.debug.raleTrackerTaskFileLocation` setting. (See [Extension Settings](#Extension-Settings) for more information)
- Add the entry point comment `' vscode_rale_tracker_entry` to your code.
  - This is optional as you can still include the the code to create the tracker task yourself.
  - We recommend adding it to the end of your `screen.show()` call. For example: `screen.show() ' vscode_rale_tracker_entry`
  - This can be added anywhere in the channel including source files but it must be on or after the call to `screen.show()`
- Set the `injectRaleTrackerTask` value to true in `launch.json`. For example:

```json
{
  "type": "brightscript",
  "rootDir": "${workspaceFolder}/dist",
  "host": "192.168.1.2",
  "injectRaleTrackerTask": true
}
```
