---
priority: 1
---
# Setup

This extension supports launching and debugging your local project on a Roku device. In order to do this, you will need to create a `launch.json` configuration file.

Here is a sample `launch.json` file where your roku project lives at the root of your workspace:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "brightscript",
      "request": "launch",
      "name": "BrightScript Debug: Launch",
      "host": "192.168.1.17",
      "password": "password",
      "rootDir": "${workspaceFolder}",
      "stopOnEntry": false
    }
  ]
}
```

If your BrightScript project is located in a subdirectory of the workspace, you will need to update the launch configuration property called 'rootDir' to point to the root folder containing the manifest file.

For example, if you have this structure:

- Root Workspace Folder/
  - Images/
  - Roku App/
    - manifest
    - components/
      - HomeScene.brs
      - HomeScene.xml
    - source/
      - main.brs

then you would need change `rootDir` in your launch config to look like this:

```json

{
    "version": "0.2.0",
    "configurations": [
        {
            ...
            "rootDir": "${workspaceFolder}/Roku App",
            ...
        }
    ]
}
```

## Using both `launch.json` and `bsconfig.json`

When launching a debug session, this extension will first read all configurations from `bsconfig.json`. Then, it will overwrite any options from the selected configuration from `launch.json`. So, it is advised to keep all common settings in `bsconfig.json`, and only add values you wish to override in `launch.json`.

## Breakpoints

Roku devices currently do not have a way to dynamically insert breakpoints during a running application. So, in order to use breakpoints, this extension will inject a `STOP` statement into the code for each breakpoint before the app is deployed. This means that anytime you add/remove a breakpoint, you will need to stop your current debug session and start a new one.

When injecting `STOP` statements, the extension will also generate a source map for each affected file so we can convert the debugger locations back into source locations. See the [SourceMaps](#SourceMaps) section for more information
