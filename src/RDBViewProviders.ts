import * as vscode from 'vscode';
import * as path from 'path';
import * as rta from 'roku-test-automation';
import * as chokidar from 'chokidar';
import * as fs from 'fs';

import { util } from './util';

export abstract class RDBBaseViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
    constructor(context: vscode.ExtensionContext) {
        this.rdbBasePath = context.extensionPath + '/dist/ui/rdb';
        context.subscriptions.push(this);
    }

    protected abstract viewName: string;

    protected view?: vscode.WebviewView;
    protected odc?: rta.OnDeviceComponent;
    protected rdbBasePath: string;
    private rdbWatcher: chokidar.FSWatcher;

    private odcCommands = [
        'callFunc',
        'deleteEntireRegistry',
        'deleteRegistrySections',
        'getFocusedNode',
        'getValueAtKeyPath',
        'hasFocus',
        'isInFocusChain',
        'observeField',
        'readRegistry',
        'setValueAtKeyPath',
        'writeRegistry',
        'storeNodeReferences',
        'getNodeReferences',
        'deleteNodeReferences',
    ];

    public dispose() {
        this.rdbWatcher?.close();
    }

    public setOnDeviceComponent(odc: rta.OnDeviceComponent) {
        this.odc = odc;
        this.onOnDeviceComponentReady();
    }

    protected onOnDeviceComponentReady() {}

    protected handleViewMessage(message) {}

    /** Adds ability to add additional script contents to the main webview html */
    protected additionalScriptContents() {
        return '';
    }

    protected getHtmlForWebview() {
        if (util.isExtensionHostRunning()) {
            // If we're developing we want to add a watcher to allow hot reload :)
            // Index.js always gets updated so don't have to worry about observing the css file
            this.rdbWatcher = chokidar.watch(`${this.rdbBasePath}/index.js`);
            this.rdbWatcher.on('change', () => {
                // We have to change this to get it to update so we store it first and set it back after
                const html = this.view.webview.html;
                this.view.webview.html = '';
                this.view.webview.html = html;
            });
        }
        const scriptUri = vscode.Uri.file(path.join(this.rdbBasePath, 'index.js')).with({ scheme: 'vscode-resource' });
        const styleUri = vscode.Uri.file(path.join(this.rdbBasePath, 'bundle.css')).with({ scheme: 'vscode-resource' });

        return `<!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset='utf-8'>
                    <link rel="stylesheet" type="text/css" href="${styleUri}">
                    <base href="${vscode.Uri.file(this.rdbBasePath).with({ scheme: 'vscode-resource' })}/">
                    <script>
                        viewName = '${this.viewName}';
                        const odcCommands = ['${this.odcCommands.join(`','`)}'];
                        ${this.additionalScriptContents()}
                    </script>
                    <script defer src="${scriptUri}"></script>
                </head>
                <body></body>
            </html>`;
    }

    public resolveWebviewView(
        view: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this.view = view;
        const webview = view.webview;

        webview.onDidReceiveMessage(async (message) => {
            try {
                const context = message.context;
                if (this.odcCommands.includes(message.command)) {
                    const response = await this.odc[message.command](context.args, context.options);
                    webview.postMessage({
                        ...message,
                        response: response
                    });
                } else {
                    this.handleViewMessage(message);
                }
            } catch (e) {
                webview.postMessage({
                    ...message,
                    error: e.message
                });
            }
        });

        view.show(true);

        webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [
                vscode.Uri.file(this.rdbBasePath)
            ]
        };
        webview.html = this.getHtmlForWebview();
    }
}

export class RDBRegistryViewProvider extends RDBBaseViewProvider {
    protected viewName = 'RegistryView';

    protected handleViewMessage(message) {
        switch (message.command) {
            case 'exportRegistry':
                vscode.window.showSaveDialog({ saveLabel: 'Save' }).then(uri => {
                    vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(message.content), 'utf8'));
                });
                return;
            case 'importRegistry':
                const options: vscode.OpenDialogOptions = {
                    canSelectMany: false,
                    openLabel: 'Select',
                    canSelectFiles: true,
                    canSelectFolders: false
                };
                vscode.window.showOpenDialog(options).then(this.importContentsToRegistry.bind(this));
                return;
        }
    }

    protected async importContentsToRegistry(uri) {
        if (uri && uri[0]) {
            const input = await vscode.workspace.fs.readFile(uri[0]);
            const data = Buffer.from(input).toString('utf8');
            this.view?.webview.postMessage({ type: 'readRegistry', values: JSON.parse(data) });
        }
    }
}

export class RDBCommandsViewProvider extends RDBBaseViewProvider {
    protected viewName = 'CommandsView';

    protected additionalScriptContents() {
        const requestArgsPath = path.join(rta.utils.getServerFilesPath(), 'requestArgs.schema.json');
        return `const requestArgsSchema = ${fs.readFileSync(requestArgsPath, 'utf8')}`;
    }
}
