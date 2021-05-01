---
priority: 2
---
# Extension Settings

This extension contributes the following settings:  

<br/>

### brightscript.format.keywordCase
specify case of keywords when formatting

### brightscript.format.compositeKeywords
specify whether composite words (ie: "endif", "endfor") should be broken apart into their two-word format (ie: "end if", "end for")
### brightscript.format.removeTrailingWhiteSpace
specify whether trailing whitespace should be removed on format
### brightscript.format.formatInteriorWhitespace
If true (the default), all whitespace between items is reduced to exactly 1 space character, and certain keywords and operators are padded with whitespace (i.e. `1+1` becomes `1 + 1`)
### brightscript.format.insertSpaceBeforeFunctionParenthesis
If true, a space is inserted to the left of an opening function declaration parenthesis. (i.e. `function main ()` or `function ()`). If false, all spacing is removed (i.e. `function main()` or `function()`).
### brightscript.format.insertSpaceBetweenEmptyCurlyBraces
if true, empty curly braces will contain exactly 1 whitespace char (i.e. `{ }`). If false, there will be zero whitespace chars between empty curly braces (i.e. `{}`)
### brightscript.output.includeStackTraces
If set to true, will print stack trace or breakpoint info in the log output. Set to false to avoid noisy logs - you'll still get the traces in the debug console, in any case
### brightscript.output.focusOnLaunch
If set to true, focus on the brightscript log when launching, which is convenient for controlling your roku with the extension's remote control keys. **Experimental. Does not always work**
### brightscript.output.clearOnLaunch
If set to true, will clear the brightscript log when launching
### brightscript.output.clearConsoleOnChannelStart
If set to true, will clear the brightscript log after connecting to the Roku channel after launching
### brightscript.output.hyperlinkFormat
specifies the display format for log output `pkg` link
### brightscript.deviceDiscovery.showInfoMessages
If set to true, an info toast will be shown when a Roku device has been found on the network.
### brightscript.deviceDiscovery.enabled
If set to true, the extension will automatically watch and scan the network for online Roku devices. This can be pared with the `${promptForHost}` option in the launch config to display a list of online Rokus, removing the need to constantly change the host IP in your config files.
### brightscript.debug.raleTrackerTaskFileLocation
This is an absolute path to the TrackerTask.xml file to be injected into your Roku channel during a debug session. (i.e. `/Users/user/roku/TrackerTask/TrackerTask.xml`)
### brightscript.debug.enableSourceMaps
Defaults to true. if set to false, then the debugger falls back to using line offets (based on the number of breakpoints injected) to determine the actual line number. Only use this if you're noticing issues with the sourcemaps not working properly.
### brightscript.debug.enableDebugProtocol
If true, the debugger will use the new BrightScript debug protocol and will disable the telnet debugger. See [the official documentation](https://developer.roku.com/en-ca/docs/developer-program/debugging/socket-based-debugger.md) for more details.
