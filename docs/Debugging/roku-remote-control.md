---
title: Roku Remote Control
---
# Roku Remote Control

You can use your keyboard as a Roku remote by clicking inside the Output or Debug Console panel of VSCode, and then pressing one of the predefined keyboard shortcuts from the table below (make sure the find widget is closed). You can also press `win+k (or cmd+k on mac)` from inside those same panels to bring up a text box to send text to the Roku device.

This extension sends key presses to the Roku device through Roku's [External Control API](https://sdkdocs.roku.com/display/sdkdoc/External+Control+API#ExternalControlAPI-KeypressKeyValues). The 12 standard Roku remote buttons are already included. The keys are mapped using the `when` clause so it will only send remote commands if the Output or Debug Console Panel has focus (`panelFocus`) AND the Editor Find widget is NOT visible (`!findWidgetVisible`).

## Keyboard Commands

| Keyboard Key                                | Roku Remote Key    | Keybinding Command                            |
| ------------------------------------------- | ------------------ | --------------------------------------------- |
| `Backspace`                                 | Back Button        | `extension.brightscript.pressBackButton`      |
| `win+Backspace` (or `cmd+Backspace` on mac) | Backspace          | `extension.brightscript.pressBackspaceButton` |
| `Escape`                                    | Home Button        | `extension.brightscript.pressHomeButton`      |
| `up`                                        | Up Button          | `extension.brightscript.pressUpButton`        |
| `down`                                      | Down Button        | `extension.brightscript.pressDownButton`      |
| `right`                                     | Right Button       | `extension.brightscript.pressRightButton`     |
| `left`                                      | Left Button        | `extension.brightscript.pressLeftButton`      |
| `Enter`                                     | Select Button (OK) | `extension.brightscript.pressSelectButton`    |
| `win+Enter` (or `cmd+Enter` on mac)         | Play Button        | `extension.brightscript.pressPlayButton`      |
| `win+left` (or `cmd+left` on mac)           | Rev Button         | `extension.brightscript.pressRevButton`       |
| `win+right` (or `cmd+right` on mac)         | Fwd Button         | `extension.brightscript.pressFwdButton`       |
| `win+8` (or `cmd+8` on mac)                 | Info Button        | `extension.brightscript.pressStarButton`      |

You can also create keybindings for any other Roku supported key by adding. Here's a example entry for `keybindings.json` of how to create a VSCode keyboard shortcut to send the space key to the Roku:

```json
{
  "key": "Space",
  "command": "extension.brightscript.sendRemoteCommand",
  "args": "Lit_%20",
  "when": "panelFocus && !inDebugRepl && !findWidgetVisible"
}
```
