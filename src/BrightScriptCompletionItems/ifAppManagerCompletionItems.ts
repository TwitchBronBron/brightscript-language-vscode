import {
    CompletionItem,
    CompletionItemKind,
    MarkdownString,
    SnippetString
} from 'vscode';

export const ifAppManagerCompletionItems: CompletionItem[] = [
    {
        kind: CompletionItemKind.Method,
        label: 'SetTheme',
        insertText: new SnippetString('SetTheme(${1:attributeArray as Object})'),
        documentation: new MarkdownString(
`
    SetTheme(attributeArray as Object) as Void

Set a group of theme attributes for the application. The attributeArray is an roAssociativeArray of attribute/value pairs.
The program may create the roAssociativeArray at runtime or read it from an XML file using the roXMLElement object.
Existing values for attributes will be overwritten by the values provided. Any values set by a previous SetTheme or SetThemeAttribute call,
but not included in the array currently provided by with the subsequent call will remain unchanged.  See roAppManager the list of valid attributes.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'SetThemeAttribute',
        insertText: new SnippetString('SetThemeAttribute(${1:attributeName as String}, ${2:attributeValue as String})'),
        documentation: new MarkdownString(
`
    SetThemeAttribute(attributeName as String, attributeValue as String) as Void

Set an individual theme attribute for the application. The attributeName is the name of one of the settable theme attributes and the value is the desired setting.
This value will override the default value for that attribute or modify the value provided by a previous SetTheme or SetThemeAttribute call to the new value provided.
If the attributeName is not valid, no action is performed.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'ClearThemeAttribute',
        insertText: new SnippetString('ClearThemeAttribute(${1:attributeName as String})'),
        documentation: new MarkdownString(
`
    ClearThemeAttribute(attributeName as String) as Void

Clears a previously set attribute and reverts to its default value.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'GetUptime',
        insertText: new SnippetString('GetUptime()'),
        documentation: new MarkdownString(
`
    GetUptime() as Object

Returns an roTimespan object which is "marked" when the user clicked on the application button on the home screen.
Calling TotalMilliseconds() on the returned roTimespan object returns the total number of milliseconds since the application started.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'GetScreensaverTimeout',
        insertText: new SnippetString('GetScreensaverTimeout()'),
        documentation: new MarkdownString(
`
    GetScreensaverTimeout() as Integer

Returns the user's screensaver wait time setting in number of minutes, or zero if the screensaver is disabled.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'UpdateLastKeyPressTime',
        insertText: new SnippetString('UpdateLastKeyPressTime()'),
        documentation: new MarkdownString(
`
    UpdateLastKeyPressTime() as Void

UpdateLastKeyPressTime can be called to simulate user activity.
This resets the idle timer that is used to count down to screensaver activation, so if a screensaver is not already displayed it will reset the timer and defer the activation.
This should only be used when the user has specifically initiated a playback mode in your app,
in which case you can call UpdateLastKeyPressTime periodically, such as when advancing the slideshow image.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'SetUserSignedIn',
        insertText: new SnippetString('SetUserSignedIn(${1:signedIn as Boolean})'),
        documentation: new MarkdownString(
`
    SetUserSignedIn(signedIn as Boolean) as Void

This method allows a channel to tell Roku when the user is signed in or signed out of the channel.
If the channel is removed, then the firmware will call SetUserSignedIn(false) on the channel's behalf.
This method accepts the signedIn parameter, which if set to true indicates the user is signed in, and if set to false, indicates the user is signed out.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'SetAutomaticAudioGuideEnabled',
        insertText: new SnippetString('SetAutomaticAudioGuideEnabled(${1:enabled as Boolean})'),
        documentation: new MarkdownString(
`
    SetAutomaticAudioGuideEnabled(enabled as Boolean) as Void

_Available since firmware version 7.5_\\
Enables or disables automatic Audio Guide and override any manifest setting. This is useful for channels that want to temporarily turn off automatic Audio Guide for specific screens.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'IsAppInstalled',
        insertText: new SnippetString('IsAppInstalled(${1:channelID as String}, ${2:version as String})'),
        documentation: new MarkdownString(
`
    IsAppInstalled(channelID as String, version as String) as Boolean

This method returns true if a channel with the specified channelID and the minimum version required is installed.
Version field could be an empty string to avoid a version check. This is useful for developers who want to cross-promote their apps.
For example, if a developer writes a game A and an app B, in game A they would want to know if the user has app B installed so they
know whether to advertise app B in game A to promote the app. If it is already installed, the developer would not need to advertise app B.
`
        )
    }
];
