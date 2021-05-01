---
priority: 2
---
# Features

- Debugging support - Set breakpoints, launch and debug your source code running on the Roku device all from within VSCode

  ![BrightScript-language-debugging](https://user-images.githubusercontent.com/2544493/78854455-5e08c880-79ef-11ea-8eb4-1f2d74230842.gif)

- Automatic Rendezvous tracking when `logrendezvous` is enabled on the Roku. See [here](https://developer.roku.com/docs/developer-program/debugging/debugging-channels.md#scenegraph-debug-server-port-8080-commands) for information on how to enable rendezvous logging your Roku.
- Real time code validation
- Syntax highlighting
- Code formatting
- Injection of the Roku Advanced Layout Editor(RALE) task from a single user managed version
  - This helps avoid committing the tracker to you repo and also lets you manage what version you want installed rather then other users on the project
  - See ([Extension Settings](./extension-settings.html) and [RALE Support](./Debugging/rale.html) for more information)
- Publish directly to a roku device from VSCode (provided by [roku-deploy](https://github.com/RokuCommunity/roku-deploy))
  - Also supports zipping and static file hosting for Component Libraries ([click here](./Debugging/component-libraries.html) for more information)
- Basic symbol navigation for document and workspace ("APPLE/Ctrl + SHIFT + O" for document, "APPLE/Ctrl + T" for workspace)
- Goto definition (F12)
- Peek definition (Alt+F12)
- Find usages (Shift+F12)
- XML goto definition support which navigates to xml component, code behind function, or brs script import (F12)
- Method signature help (open bracket, or APPLE/Ctrl + SHIFT + SPACE)
- Roku remote control from keyboard ([click here](#Roku-Remote-Control) for more information)
- Brightscript output log (which is searchable and can be colorized with a plugin like [IBM.output-colorizer](https://marketplace.visualstudio.com/items?itemName=IBM.output-colorizer)
- Navigate to source files (by clicking while holding alt key) referenced as `pkg:/` paths from output log, with various output formats.
  - Configure `brightscript.output.hyperlinkFormat` as follows:
    - **Full** `pkg:/components/KeyLogTester.brs(24:0)`
    - **FilenameAndFunction** `KeyLogTester.DoSomething(24:0)`
    - **Filename** `KeyLogTester.brs(24)`
    - **Short** `#1`
    - **Hidden** ``
- Marking the output log (CTRL+L)
- Clearing the output log (CTRL+K), which also clears the mark indexes - **be sure to use the extension's command for clearing, or you may find that your hyperlinks and filters get out of sync**
- Filtering the output log - 3 filters are available:
  - LogLevel (example `^\[(info|warn|debug\]`)
  - Include (example `NameOfSomeInterestingComponent`)
  - Exclude (example `NameOfSomeNoisyComponent`)
- Variable `bs_const` values using the `launch.json` (see the [BS_Const](./Debugging/bs-const.html) section for more information)
