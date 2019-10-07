import * as request from 'request';
import * as vscode from 'vscode';

// tslint:disable-next-line
export var __request: any = request;

import BrightScriptFileUtils from './BrightScriptFileUtils';

// georgejecook: I can't find a way to stub/mock a TypeScript class constructor
// so I have to do this for the time being. Not ideal.
export function getBrightScriptCommandsInstance() {
    return new BrightScriptCommands();
}

export default class BrightScriptCommands {

    constructor() {
        this.fileUtils = new BrightScriptFileUtils();
    }

    private fileUtils: BrightScriptFileUtils;
    private context: vscode.ExtensionContext;
    private host: string;
    public function;

    public registerCommands(context: vscode.ExtensionContext) {
        this.context = context;
        let subscriptions = context.subscriptions;

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.toggleXML', () => {
            this.onToggleXml();
        }));
        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.sendRemoteCommand', (key: string) => {
            this.sendRemoteCommand(key);
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.sendRemoteText', async () => {
            let stuffUserTyped: string = await vscode.window.showInputBox({
                placeHolder: 'Press enter to send all typed characters to the Roku',
                value: ''
            });
            if (stuffUserTyped) {
                for (let character of stuffUserTyped) {
                    let commandToSend: string = 'Lit_' + encodeURIComponent(character);
                    await this.sendRemoteCommand(commandToSend);
                }
            }
            vscode.commands.executeCommand('workbench.action.focusPanel');
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.pressBackButton', () => {
            this.sendRemoteCommand('Back');
        }));
        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.pressBackspaceButton', () => {
            this.sendRemoteCommand('Backspace');
        }));
        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.pressHomeButton', () => {
            this.sendRemoteCommand('Home');
        }));
        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.pressUpButton', () => {
            this.sendRemoteCommand('Up');
        }));
        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.pressDownButton', () => {
            this.sendRemoteCommand('Down');
        }));
        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.pressRightButton', () => {
            this.sendRemoteCommand('Right');
        }));
        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.pressLeftButton', () => {
            this.sendRemoteCommand('Left');
        }));
        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.pressSelectButton', () => {
            this.sendRemoteCommand('Select');
        }));
        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.pressPlayButton', () => {
            this.sendRemoteCommand('Play');
        }));
        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.pressRevButton', () => {
            this.sendRemoteCommand('Rev');
        }));
        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.pressFwdButton', () => {
            this.sendRemoteCommand('Fwd');
        }));
        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.pressStarButton', () => {
            this.sendRemoteCommand('Info');
        }));
    }

    public async openFile(filename: string) {
        let uri = vscode.Uri.file(filename);
        let doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
        await vscode.window.showTextDocument(doc, { preview: false });
    }

    public async onToggleXml() {
        if (vscode.window.activeTextEditor) {
            const currentDocument = vscode.window.activeTextEditor.document;
            let alternateFileName = this.fileUtils.getAlternateFileName(currentDocument.fileName);
            if (alternateFileName) {
                this.openFile(alternateFileName);
            }
        }
    }

    public async sendRemoteCommand(key: string) {
        await this.getRemoteHost();
        if (this.host) {
            let clickUrl = `http://${this.host}:8060/keypress/${key}`;
            console.log(`send ${clickUrl}`);
            return new Promise(function(resolve, reject) {
                request.post(clickUrl, function(err, response) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(response);
                });
            });
        }
    }

    public async getRemoteHost() {
        this.host = await this.context.workspaceState.get('remoteHost');
        if (!this.host) {
            let config = await vscode.workspace.getConfiguration('brightscript.remoteControl', null);
            this.host = config.get('host');
            if (this.host === '${promptForHost}') {
                this.host = await vscode.window.showInputBox({
                    placeHolder: 'The IP address of your Roku device',
                    value: ''
                });
            }
        }
        if (!this.host) {
            throw new Error('Can\'t send command: host is required.');
        } else {
            await this.context.workspaceState.update('remoteHost', this.host);
        }
    }
}
