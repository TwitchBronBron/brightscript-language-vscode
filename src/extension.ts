import * as vscode from 'vscode';
import * as prettyBytes from 'pretty-bytes';
import { window } from 'vscode';
import { gte as semverGte } from 'semver';
import { env, extensions } from 'vscode';
import * as rta from 'roku-test-automation';

import { ActiveDeviceManager } from './ActiveDeviceManager';
import { brightScriptCommands } from './BrightScriptCommands';
import BrightScriptXmlDefinitionProvider from './BrightScriptXmlDefinitionProvider';
import { BrightScriptDebugConfigurationProvider, BrightScriptLaunchConfiguration } from './DebugConfigurationProvider';
import { DeclarationProvider } from './DeclarationProvider';
import { DefinitionRepository } from './DefinitionRepository';
import { Formatter } from './formatter';
import { LogDocumentLinkProvider } from './LogDocumentLinkProvider';
import { LogOutputManager } from './LogOutputManager';
import { RendezvousViewProvider } from './RendezvousViewProvider';
import { RDBCommandsViewProvider, RDBRegistryViewProvider } from './RDBViewProviders';
import { sceneGraphDebugCommands } from './SceneGraphDebugCommands';
import { GlobalStateManager } from './GlobalStateManager';
import { languageServerManager } from './LanguageServerManager';

const EXTENSION_ID = 'RokuCommunity.brightscript';

export class Extension {
    public outputChannel: vscode.OutputChannel;
    public sceneGraphDebugChannel: vscode.OutputChannel;
    public debugServerOutputChannel: vscode.OutputChannel;
    public globalStateManager: GlobalStateManager;
    private chanperfStatusBar: vscode.StatusBarItem;

    public odc?: rta.OnDeviceComponent;

    // register our RDB views
    private rdbViews = {
        RDBRegistryView: {
            class: RDBRegistryViewProvider
        },
        RDBCommandsView: {
            class: RDBCommandsViewProvider
        }
    };

    public async activate(context: vscode.ExtensionContext) {
        this.globalStateManager = new GlobalStateManager(context);
        this.chanperfStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);

        var previousExtensionVersion = this.globalStateManager.lastRunExtensionVersion;

        var currentExtensionVersion = extensions.getExtension(EXTENSION_ID)?.packageJSON.version;
        //update the tracked version of the extension
        this.globalStateManager.lastRunExtensionVersion = currentExtensionVersion;

        let activeDeviceManager = new ActiveDeviceManager();

        const declarationProvider = new DeclarationProvider();
        context.subscriptions.push(declarationProvider);

        //create channels
        this.outputChannel = vscode.window.createOutputChannel('BrightScript Log');
        this.sceneGraphDebugChannel = vscode.window.createOutputChannel('SceneGraph Debug Commands Log');
        this.debugServerOutputChannel = vscode.window.createOutputChannel('BrightScript Debug Server');
        this.debugServerOutputChannel.appendLine('Extension startup');

        let docLinkProvider = new LogDocumentLinkProvider();

        const logOutputManager = new LogOutputManager(this.outputChannel, context, docLinkProvider, declarationProvider);

        const definitionRepo = new DefinitionRepository(declarationProvider);

        let languageServerPromise = languageServerManager.init(context, definitionRepo);

        //register a tree data provider for this extension's "RENDEZVOUS" panel in the debug area
        let rendezvousViewProvider = new RendezvousViewProvider(context);
        vscode.window.registerTreeDataProvider('rendezvousView', rendezvousViewProvider);

        context.subscriptions.push(vscode.commands.registerCommand('extension.brightscript.rendezvous.clearHistory', () => {
            vscode.debug.activeDebugSession.customRequest('rendezvous.clearHistory');
        }));

        context.subscriptions.push(vscode.commands.registerCommand('extension.brightscript.languageServer.restart', async () => {
            await languageServerManager.restart();
        }));

        //register the code formatter
        context.subscriptions.push(
            vscode.languages.registerDocumentRangeFormattingEditProvider({
                language: 'brightscript',
                scheme: 'file'
            }, new Formatter()),
            vscode.languages.registerDocumentRangeFormattingEditProvider({
                language: 'brighterscript',
                scheme: 'file'
            }, new Formatter())
        );

        //register the debug configuration provider
        let configProvider = new BrightScriptDebugConfigurationProvider(context, activeDeviceManager);
        context.subscriptions.push(
            vscode.debug.registerDebugConfigurationProvider('brightscript', configProvider)
        );

        //register a link provider for this extension's "BrightScript Log" output
        context.subscriptions.push(
            vscode.languages.registerDocumentLinkProvider({ language: 'Log' }, docLinkProvider)
        );

        vscode.window.registerUriHandler({
            handleUri: async function(uri: vscode.Uri) {
                if (uri.path.startsWith('/openFile/')) {
                    let docUri = vscode.Uri.file(uri.path.substr(10));
                    let doc = await vscode.workspace.openTextDocument(docUri);
                    await vscode.window.showTextDocument(doc, { preview: false });
                    let editor = vscode.window.activeTextEditor;
                    let lineNumber = Number(uri.fragment) ? Number(uri.fragment) - 1 : 0;
                    editor.selection = new vscode.Selection(lineNumber, 0, lineNumber, 0);
                    vscode.commands.executeCommand('revealLine', {
                        lineNumber: lineNumber,
                        at: 'center'
                    });
                }
            }
        });

        //give the launch config to the link provider any time we launch the app
        vscode.debug.onDidReceiveDebugSessionCustomEvent(async (e) => {
            if (e.event === 'BSLaunchStartEvent') {
                const config: BrightScriptLaunchConfiguration = e.body;
                docLinkProvider.setLaunchConfig(config);
                logOutputManager.setLaunchConfig(config);
                this.setupRDB(context, config);
                //write debug server log statements to the DebugServer output channel
            } else if (e.event === 'BSDebugServerLogOutputEvent') {
                this.debugServerOutputChannel.appendLine(e.body);

            } else if (e.event === 'BSRendezvousEvent') {
                rendezvousViewProvider.onDidReceiveDebugSessionCustomEvent(e);

            } else if (e.event === 'BSChanperfEvent') {
                if (!e.body.error) {
                    this.chanperfStatusBar.text = `$(dashboard)cpu: ${e.body.cpu.total}%, mem: ${prettyBytes(e.body.memory.total).replace(/ /g, '')}`;
                } else {
                    this.chanperfStatusBar.text = e.body.error.message;
                }

                this.chanperfStatusBar.show();

            } else if (!e.event) {
                if (e.body[0]) {
                    // open the first file with a compile error
                    let uri = vscode.Uri.file(e.body[0].path);
                    let doc = await vscode.workspace.openTextDocument(uri);
                    let line = (e.body[0].lineNumber - 1 > -1) ? e.body[0].lineNumber - 1 : 0;
                    let range = new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line, 0));
                    await vscode.window.showTextDocument(doc, { preview: false, selection: range });
                }
            }
        });

        //register all commands for this extension
        brightScriptCommands.registerCommands(context);
        sceneGraphDebugCommands.registerCommands(context, this.sceneGraphDebugChannel);

        vscode.debug.onDidStartDebugSession((e) => {
            //if this is a brightscript debug session
            if (e.type === 'brightscript') {
                logOutputManager.onDidStartDebugSession();
            }
        });

        vscode.debug.onDidTerminateDebugSession((e) => {
            //if this is a brightscript debug session
            if (e.type === 'brightscript') {
                this.chanperfStatusBar.hide();
            }
        });

        vscode.debug.onDidReceiveDebugSessionCustomEvent((e) => {
            logOutputManager.onDidReceiveDebugSessionCustomEvent(e);
        });

        let brightscriptConfig = vscode.workspace.getConfiguration('brightscript');
        if (brightscriptConfig?.outputPanelStartupBehavior) {
            if (brightscriptConfig.outputPanelStartupBehavior === 'show') {
                //show the output panel on extension startup without taking focus (only if configured to do so...defaults to 'nothing')
                this.outputChannel.show(true);
            } else if (brightscriptConfig.outputPanelStartupBehavior === 'focus') {
                //focus the output panel on extension startup (only if configured to do so...defaults to 'nothing')
                this.outputChannel.show();
            }
        } else if (brightscriptConfig?.focusOutputPanelOnStartup === true) {
            // deprecated legacy config value
            //focus the output panel on extension startup (only if configured to do so...defaults to false)
            this.outputChannel.show();
        }

        //xml support
        const xmlSelector = { scheme: 'file', pattern: '**/*.{xml}' };
        context.subscriptions.push(vscode.languages.registerDefinitionProvider(xmlSelector, new BrightScriptXmlDefinitionProvider(definitionRepo)));

        this.showWelcomeOrWhatsNew(previousExtensionVersion, currentExtensionVersion);
        await languageServerPromise;
    }

    public async showWelcomeOrWhatsNew(lastRunExtensionVersion: string, currentExtensionVersion: string) {
        let config = vscode.workspace.getConfiguration('brightscript');
        let isReleaseNotificationsEnabled = config.get('enableReleaseNotifications') === false ? false : true;
        //this is the first launch of the extension
        if (lastRunExtensionVersion === undefined) {

            //if release notifications are enabled
            //TODO once we have the welcome page content prepared, remove the `&& false` from the condition below
            if (isReleaseNotificationsEnabled && false) {
                let viewText = 'View the get started guide';
                let response = await window.showInformationMessage(
                    'Thank you for installing the BrightScript VSCode extension. Click the button below to read some tips on how to get the most out of this extension.',
                    viewText
                );
                if (response === viewText) {
                    env.openExternal(vscode.Uri.parse('https://github.com/rokucommunity/vscode-brightscript-language/blob/master/Welcome.md'));
                }
            }
            this.globalStateManager.lastSeenReleaseNotesVersion = currentExtensionVersion;
            return;
        }
        //List of version numbers that should prompt the ReleaseNotes page.
        //these should be in highest-to-lowest order, because we will launch the highest version
        let versionWhitelist = [
            '2.0.0'
        ];
        for (let whitelistVersion of versionWhitelist) {
            if (
                //if the current version is larger than the whitelist version
                semverGte(whitelistVersion, lastRunExtensionVersion) &&
                //if the user hasn't seen this popup before
                this.globalStateManager.lastSeenReleaseNotesVersion !== whitelistVersion &&
                //if ReleaseNote popups are enabled
                isReleaseNotificationsEnabled
            ) {
                //mark this version as viewed
                this.globalStateManager.lastSeenReleaseNotesVersion = whitelistVersion;
                let viewText = 'View Release Notes';
                let response = await window.showInformationMessage(
                    `BrightScript Language v${whitelistVersion} includes significant changes from previous versions. Please take a moment to review the release notes.`,
                    viewText
                );
                if (response === viewText) {
                    env.openExternal(vscode.Uri.parse(`https://github.com/rokucommunity/vscode-brightscript-language/blob/master/ReleaseNotes.md#${whitelistVersion}`));
                }
                this.globalStateManager.lastSeenReleaseNotesVersion = currentExtensionVersion;
            }
        }
    }

    private setupODC(config: BrightScriptLaunchConfiguration) {
        const rtaConfig: rta.ConfigOptions = {
            RokuDevice: {
                devices: [{
                    host: config.host,
                    password: config.password
                }]
            },
            // uncomment for debugging
            // OnDeviceComponent: {
            //     logLevel: 'verbose',
            //     serverDebugLogging: true
            // }
        };
        const device = new rta.RokuDevice(rtaConfig);
        return new rta.OnDeviceComponent(device, rtaConfig);
    }

    private setupRDB(context: vscode.ExtensionContext, config: BrightScriptLaunchConfiguration) {
        // TODO handle case where user changes their Roku Device
        if (!config.injectRdbOnDeviceComponent || this.odc) {
            return;
        }
        this.odc = this.setupODC(config);

        for (const viewId in this.rdbViews) {
            const view = this.rdbViews[viewId];
            view.provider = new view.class(context);
            vscode.window.registerWebviewViewProvider(viewId, view.provider);
        }

        for (const viewId in this.rdbViews) {
            this.rdbViews[viewId].provider.setOnDeviceComponent(this.odc);
        }
    }

}
export const extension = new Extension();
export function activate(context: vscode.ExtensionContext) {
    extension.activate(context);
}
