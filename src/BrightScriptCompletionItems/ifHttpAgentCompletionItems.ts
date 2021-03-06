import {
    CompletionItem,
    CompletionItemKind,
    MarkdownString,
    SnippetString
} from 'vscode';

export const ifHttpAgentCompletionItems: CompletionItem[] = [
    {
        kind: CompletionItemKind.Method,
        label: 'AddHeader',
        insertText: new SnippetString('AddHeader(${1:name as String}, ${2:value as String})'),
        documentation: new MarkdownString(
`
    AddHeader(name as String, value as String) as Boolean

Add the specified HTTP header to the list of headers that will be sent in the HTTP request.

Certain well known headers such as User-Agent, Content-Length, etc. will automatically be sent.

The application may override these well known values if needed (e.g. some servers may require a specific user agent string).

If "x-roku-reserved-dev-id" is passed as a name, the value parameter is ignored and in its place, the devid of the currently running channel is used as the value.

This allows the developer's server to know which client app is talking to it. Any other headers whose name begins with "x-roku-reserved-" are reserved and may not be set.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'SetHeaders',
        insertText: new SnippetString('SetHeaders(${1:nameValueMap as Object})'),
        documentation: new MarkdownString(
`
    SetHeaders(nameValueMap as Object) as Boolean

nameValueMap should be an roAssociativeArray. Each name/value in the AA is added as an HTTP header.

Header limitations specified in AddHeader() still apply.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'InitClientCertificates',
        insertText: new SnippetString('InitClientCertificates()'),
        documentation: new MarkdownString(
`
    InitClientCertificates() as Boolean

Initialize the object to send the Roku client certificate.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'SetCertificatesFile',
        insertText: new SnippetString('SetCertificatesFile(${1:path as String})'),
        documentation: new MarkdownString(
`
    SetCertificatesFile(path as String) as Boolean

Set the certificates file used for SSL to the .pem file specified.

The .pem file should include the CA (certificate authority) certificate that signed the certificate installed on your web server.

Note: The developer can download the CA certificate here: https://sdkdocs.roku.com/download/attachments/1611329/ca-bundle.crt?version=1&modificationDate=1526505586986&api=v2

This enables authentication of your server.

Instances of roUrlTransfer and ifHttpAgent components should call this function before performing https requests.

The appropriate certificates file should be placed at the location specified in the SetCertificatesFile() function call.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'SetCertificatesDepth',
        insertText: new SnippetString('SetCertificatesDepth(${1:depth as Integer})'),
        documentation: new MarkdownString(
`
    SetCertificatesDepth(depth as Integer) as Void

Set the maximum depth of the certificate chain that will be accepted.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'EnableCookies',
        insertText: new SnippetString('EnableCookies()'),
        documentation: new MarkdownString(
`
    EnableCookies() as Void

Causes any Set-Cookie headers returned from the request to be interpreted and the resulting cookies to be added to the cookie cache.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'GetCookies',
        insertText: new SnippetString('GetCookies(${1:domain as String}, ${2:path as String})'),
        documentation: new MarkdownString(
`
    GetCookies(domain as String, path as String) as Object

Returns any cookies from the cookie cache that match the specified domain and path.

If domain is an empty string, all domains are matched.

Any expired cookies are not returned.

The returned object is an roArray of roAssociativeArrays. Each AA contains the keys:

Key | Type | Detail
--- | --- | ---
Version | Integer | Cookie version number
Domain | String | Domain to which cookie applies
Path | String | Path to which cookie applies
Name | String | Name of the cookie
Value | String | Value of the cookie
Expires | roDateTime | Cookie expiration date, if any
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'AddCookies',
        insertText: new SnippetString('AddCookies(${1:cookies as Object})'),
        documentation: new MarkdownString(
`
    AddCookies(cookies as Object) as Boolean

cookies should be an roArray of roAssociativeArrays.

Each AA should be in the same format as the AAs returned by GetCookie().

The specified cookies are added to the cookie cache.
`
        )
    },
    {
        kind: CompletionItemKind.Method,
        label: 'ClearCookies',
        insertText: new SnippetString('ClearCookies()'),
        documentation: new MarkdownString(
`
    ClearCookies() as Void

Removes all cookies from the cookie cache.
`
        )
    }
];
