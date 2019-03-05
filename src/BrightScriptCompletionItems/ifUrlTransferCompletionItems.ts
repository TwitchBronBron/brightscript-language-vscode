import {
    CompletionItem,
    CompletionItemKind
} from 'vscode';

import * as vscode from 'vscode';

export const ifUrlTransferCompletionItems: CompletionItem[] = [
    {
        kind: CompletionItemKind.Method,
        label: 'GetIdentity',
        insertText: new vscode.SnippetString('GetIdentity()'),
        documentation: new vscode.MarkdownString(
`
    GetIdentity() as Integer

Returns a unique number for this object that can be used to identify whether events originated from this object.

Note that the value can be any arbitrary value as assigned by the firmware, and should only be used for comparison purposes.
For example, the value should not be used as an array index.  For use as a look-up key, one option would be to use GetIdentity().ToStr() as an associative array key.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'SetUrl',
        insertText: new vscode.SnippetString('SetUrl(${1:url as String})'),
        documentation: new vscode.MarkdownString(
`
    SetUrl(url as String) as Void

Sets the URL to use for the transfer request.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'GetUrl',
        insertText: new vscode.SnippetString('GetUrl()'),
        documentation: new vscode.MarkdownString(
`
    GetUrl() as String

Returns the current URL.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'SetRequest',
        insertText: new vscode.SnippetString('SetRequest(${1:req as String})'),
        documentation: new vscode.MarkdownString(
`
    SetRequest(req as String)

Changes the request method from the normal GET, HEAD or POST to the value passed as a string. This should be used with caution as it can generate invalid HTTP requests.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'GetRequest',
        insertText: new vscode.SnippetString('GetRequest()'),
        documentation: new vscode.MarkdownString(
`
    GetRequest() as String

Returns the current request method.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'GetToString',
        insertText: new vscode.SnippetString('GetToString()'),
        documentation: new vscode.MarkdownString(
`
    GetToString() as String

Connect to the remote service as specified in the URL and return the response body as a string. This function waits for the transfer to complete and it may block for a long time.

This calls discards the headers and response codes. If that information is required, use AsyncGetToString instead.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'GetToFile',
        insertText: new vscode.SnippetString('GetToFile(${1:filename as String})'),
        documentation: new vscode.MarkdownString(
`
    GetToFile(filename as String) as Integer

Connect to the remote service as specified in the URL and write the response body to a file on the Roku device's filesystem.

This function does not return until the exchange is complete and may block for a long time.

The HTTP response code from the server is returned. It is not possible to access any of the response headers. If this information is required use AsyncGetToFile instead.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'AsyncGetToString',
        insertText: new vscode.SnippetString('AsyncGetToString()'),
        documentation: new vscode.MarkdownString(
`
    AsyncGetToString() as Boolean

Start a GET request to a server, but do not wait for the transfer to complete. When the GET completes, a roUrlEvent will be sent to the message port associated with the object.
The event will contain a roString with the body of the response. If false is returned then the request could not be issued and no events will be delivered.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'AsyncGetToFile',
        insertText: new vscode.SnippetString('AsyncGetToFile(${1:filename as String})'),
        documentation: new vscode.MarkdownString(
`
    AsyncGetToFile(filename as String) as Boolean

Like AsyncGetToString, this starts a transfer without waiting for it to complete.
However, the response body will be written to a file on the device's filesystem instead of being returned in a String object.
When the GET completes, an roUrlEvent will be sent to the message port associated with the object. If false is returned then the request could not be issued and no events will be delivered.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'Head',
        insertText: new vscode.SnippetString('Head()'),
        documentation: new vscode.MarkdownString(
`
    Head() as Dynamic

Synchronously perform an HTTP HEAD request and return an roUrlEvent object. In the event of catastrophic failure (e.g. an asynchronous operation is already active) then invalid is returned.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'AsyncHead',
        insertText: new vscode.SnippetString('AsyncHead()'),
        documentation: new vscode.MarkdownString(
`
    AsyncHead() as Boolean

Begin an HTTP HEAD request without waiting for it to complete.
When the HEAD completes, an roUrlEvent will be sent to the message port associated with the object.
If false is returned then the request could not be issued and no events will be delivered.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'PostFromString',
        insertText: new vscode.SnippetString('PostFromString(${1:request as String})'),
        documentation: new vscode.MarkdownString(
`
    PostFromString(request as String) as Integer

Use the HTTP POST method to send the supplied string to the current URL. The HTTP response code is returned. Any response body is discarded.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'PostFromFile',
        insertText: new vscode.SnippetString('PostFromFile(${1:filename as String})'),
        documentation: new vscode.MarkdownString(
`
    PostFromFile(filename as String) as Integer

Use the HTTP POST method to send the contents of the specified file to the current URL. The HTTP response code is returned. Any response body is discarded.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'AsyncPostFromString',
        insertText: new vscode.SnippetString('AsyncPostFromString(${1:request as String})'),
        documentation: new vscode.MarkdownString(
`
    AsyncPostFromString(request as String) as Boolean

Use the HTTP POST method to send the supplied string to the current URL.
When the POST completes, an roUrlEvent will be sent to the message port associated with the object.
If false is returned then the request could not be issued and no events will be delivered.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'AsyncPostFromFile',
        insertText: new vscode.SnippetString('AsyncPostFromFile(${1:filename as String})'),
        documentation: new vscode.MarkdownString(
`
    AsyncPostFromFile(filename as String) as Boolean

Use the HTTP POST method to send the contents of the specified file to the current URL.
When the POST completes, an roUrlEvent will be sent to the message port associated with the object.
If false is returned then the request could not be issued and no events will be delivered.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'AsyncPostFromFileToFile',
        insertText: new vscode.SnippetString('AsyncPostFromFileToFile(${1:fromFile as String}, ${2:toFile as String})'),
        documentation: new vscode.MarkdownString(
`
    AsyncPostFromFileToFile(fromFile as String, toFile as String) as Boolean

Use the HTTP POST method to send the contents of the specified file (fromFile) to the current URL.
When the POST completes successfully, an roUrlEvent will be sent to the message port associated with the object.
If false is returned then the request could not be issued and no events will be delivered.
This function is the same as AsyncPostFromFile, except that the HTTP response is written to the file specified by the toFile parameter.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'AsyncCancel',
        insertText: new vscode.SnippetString('AsyncCancel()'),
        documentation: new vscode.MarkdownString(
`
    AsyncCancel() as Boolean

Cancel any outstanding async requests on the roUrlTransfer object.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'RetainBodyOnError',
        insertText: new vscode.SnippetString('RetainBodyOnError(${1:retain as Boolean})'),
        documentation: new vscode.MarkdownString(
`
    RetainBodyOnError(retain as Boolean) as Boolean

If retain is true, return the body of the response even if the HTTP status code indicates that an error occurred.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'SetUserAndPassword',
        insertText: new vscode.SnippetString('SetUserAndPassword(${1:user as String}, ${2:password as String})'),
        documentation: new vscode.MarkdownString(
`
    SetUserAndPassword(user as String, password as String) as Boolean

Enables HTTP authentication using the specified user name and password.
Note that HTTP basic authentication is deliberately disabled due to it being inherently insecure. HTTP digest authentication is supported.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'SetMinimumTransferRate',
        insertText: new vscode.SnippetString('SetMinimumTransferRate(${1:bytes_per_second as Integer}, ${2:period_in_seconds as Integer})'),
        documentation: new vscode.MarkdownString(
`
    SetMinimumTransferRate(bytes_per_second as Integer, period_in_seconds as Integer) as Boolean

Terminate the transfer automatically if the rate drops below bytes_per_second when averaged over period_in_seconds.
If the transfer is over the Internet you may not want to set period_in_seconds to a small number because network problems may cause temporary drops in performance.
For large file transfers and a small bytes_per_second, averaging over fifteen minutes or even longer might be appropriate.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'GetFailureReason',
        insertText: new vscode.SnippetString('GetFailureReason()'),
        documentation: new vscode.MarkdownString(
`
    GetFailureReason() as String

If any of the roUrlTransfer functions indicate failure then this function may provide more information regarding the failure.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'EnableEncodings',
        insertText: new vscode.SnippetString('EnableEncodings(${1:enable as Boolean})'),
        documentation: new vscode.MarkdownString(
`
    EnableEncodings(enable as Boolean) as Boolean

Enable gzip encoding of transfers.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'Escape',
        insertText: new vscode.SnippetString('Escape(${1:text as String})'),
        documentation: new vscode.MarkdownString(
`
    Escape(text as String) as String

URL encode the specified string per RFC 3986 and return the encoded string.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'Unescape',
        insertText: new vscode.SnippetString('Unescape(${1:text as String})'),
        documentation: new vscode.MarkdownString(
`
    Unescape(text as String) as String

Decode the specified string per RFC 3986 and return the unencoded string.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'EnableResume',
        insertText: new vscode.SnippetString('EnableResume(${1:enable as Boolean})'),
        documentation: new vscode.MarkdownString(
`
    EnableResume(enable as Boolean) as Boolean

Enable automatic resumption of AsyncGetToFile and GetToFile requests.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'EnablePeerVerification',
        insertText: new vscode.SnippetString('EnablePeerVerification(${1:enable as Boolean})'),
        documentation: new vscode.MarkdownString(
`
    EnablePeerVerification(enable as Boolean) as Boolean

Verify the certificate has a chain of trust up to a valid root certificate using. CURLOPT_SSL_VERIFYPEER.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'EnableHostVerification',
        insertText: new vscode.SnippetString('EnableHostVerification(${1:enable as Boolean})'),
        documentation: new vscode.MarkdownString(
`
    EnableHostVerification(enable as Boolean) as Boolean

Verify that the certificate belongs to the host we're talking to using CURLOPT_SSL_VERIFYHOST.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'EnableFreshConnection',
        insertText: new vscode.SnippetString('EnableFreshConnection(${1:enable as Boolean})'),
        documentation: new vscode.MarkdownString(
`
    EnableFreshConnection(enable as Boolean) as Boolean

Enable fresh connection using CURLOPT_FRESH_CONNECT.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'SetHttpVersion',
        insertText: new vscode.SnippetString('SetHttpVersion(${1:version as String})'),
        documentation: new vscode.MarkdownString(
`
    SetHttpVersion(version as String) as Void

_Available since firmware version 7.6_

This is an optional function to enable HTTP/2 support. If version is set to "http2", HTTP/2 will be used for all underlying transfers.
This must be set on a roUrlTransfer instance prior to any data transfer. This cannot be changed on an instance after it is used.

Note: For the HTTP/2 connection sharing feature, all roUrlTransfers should be made from the same thread.
`
        )
    }
];
