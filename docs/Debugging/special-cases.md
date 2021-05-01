---
title: Special Cases
---
# Special Cases

## Debug source files with Custom build process

If you have a build process that moves files from a source directory to an output directory, by default you will need to place breakpoints in the output directory's versions of the files.

**IF** your build process does not change line numbers between source files and built files, this extension will allow you to place breakpoints in your source files, and launch/run your built files. Pair this with vscode's task system, and you can build your code, then launch and debug your code with ease.

**Example:**

- src/
  - main.brs
  - language.brs
  - manifest
- languages/
  - english.brs
  - french.brs
- dist/
  - main.brs
  - language.brs
  - manifest

Here's a sample launch.json for this scenario:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "brightscript",
      "request": "launch",
      "name": "BrightScript Debug: Launch",
      "host": "192.168.1.100",
      "password": "password",
      "rootDir": "${workspaceFolder}/dist",
      "sourceDirs": ["${workspaceFolder}/src"],
      "preLaunchTask": "your-build-task-here"
    }
  ]
}
```

## Multiple source dirs

If you have a custom build process that pulls in files from multiple source directories, but still want to be able to place breakpoints in those source folders without using this extension's build process, you can use the `sourceDirs` launch configuration setting to specify where the various source files exist. The extension will walk through each of the `sourceDirs` entries, in order, until it finds a file that matches the relative path of the file with the active breakpoint.

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "rootDir": "${workspaceFolder}/dist",
      "sourceDirs": [
        "${workspaceFolder}/../ProjectA",
        "${workspaceFolder}/../ProjectB",
        "${workspaceFolder}/../ProjectC"
      ],
      "preLaunchTask": "your-build-task-here"
      //...
    }
  ]
}
```
