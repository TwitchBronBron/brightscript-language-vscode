import * as dotenv from 'dotenv';
import * as fsExtra from 'fs-extra';
import { FilesType } from 'roku-deploy';
import {
    CancellationToken,
    DebugConfiguration,
    DebugConfigurationProvider,
    ExtensionContext,
    WorkspaceFolder,
} from 'vscode';
import * as vscode from 'vscode';

import { util } from './util';

export class BrightScriptDebugConfigurationProvider implements DebugConfigurationProvider {

    public constructor(context: ExtensionContext, activeDeviceManager: any) {
        this.context = context;
        this.activeDeviceManager = activeDeviceManager;
        let config: any = vscode.workspace.getConfiguration('brightscript') || {};
        this.showDeviceInfoMessages = (config.deviceDiscovery || {}).showInfoMessages;
        this.trackerTaskFileLocation = (config.rokuAdvancedLayoutEditor || {}).trackerTaskFileLocation;
        vscode.workspace.onDidChangeConfiguration((e) => {
            let config: any = vscode.workspace.getConfiguration('brightscript') || {};
            this.showDeviceInfoMessages = (config.deviceDiscovery || {}).showInfoMessages;
            this.trackerTaskFileLocation = (config.rokuAdvancedLayoutEditor || {}).trackerTaskFileLocation;
        });
    }

    public context: ExtensionContext;
    public activeDeviceManager: any;

    //make unit testing easier by adding these imports properties
    public fsExtra = fsExtra;
    public util = util;

    private showDeviceInfoMessages: boolean;
    private trackerTaskFileLocation: string;

    /**
     * Massage a debug configuration just before a debug session is being launched,
     * e.g. add all missing attributes to the debug configuration.
     */
    public async resolveDebugConfiguration(folder: WorkspaceFolder | undefined, config: BrightScriptDebugConfiguration, token?: CancellationToken): Promise<DebugConfiguration> {
        let settings: any = vscode.workspace.getConfiguration('brightscript') || {};

        // Process the different parts of the config
        config = await this.sanitizeConfiguration(config);
        config = await this.processEnvFile(folder, config);
        config = await this.processHostParameter(config);
        config = await this.processPasswordParameter(config);
        config = await this.processDeepLinkUrlParameter(config);

        await this.context.workspaceState.update('enableDebuggerAutoRecovery', config.enableDebuggerAutoRecovery);

        return config;
    }

    /**
     * Takes the launch.json config and applies any defaults to missing values and sanitizes some of the more complex options
     * @param config current config object
     */
    private async sanitizeConfiguration(config: BrightScriptDebugConfiguration): Promise<BrightScriptDebugConfiguration> {
        let defaultFilesArray: FilesType[] = [
            'manifest',
            'source/**/*.*',
            'components/**/*.*',
            'images/**/*.*'
        ];

        //make sure we have an object
        config = config ? config : {} as any;

        config.rootDir = this.util.ensureTrailingSlash(config.rootDir ? config.rootDir : '${workspaceFolder}');

        //Check for depreciated Items
        if (config.debugRootDir) {
            if (config.sourceDirs) {
                throw new Error('Cannot set both debugRootDir AND sourceDirs');
            } else {
                config.sourceDirs = [this.util.ensureTrailingSlash(config.debugRootDir)];
            }
        } else if (config.sourceDirs) {
            let dirs: string[] = [];

            for (let dir of config.sourceDirs) {
                dirs.push(this.util.ensureTrailingSlash(dir));
            }
            config.sourceDirs = dirs;
        } else if (!config.sourceDirs) {
            config.sourceDirs = [];
        }

        // #region Prepare Component Library config items
        if (config.componentLibraries) {
            config.componentLibrariesOutDir = this.util.ensureTrailingSlash(config.componentLibrariesOutDir ? config.componentLibrariesOutDir : '${workspaceFolder}/libs');

            for (let library of config.componentLibraries) {
                library.rootDir = this.util.ensureTrailingSlash(library.rootDir);
                library.files = library.files ? library.files : defaultFilesArray;
            }
        } else {
            //create an empty array so it's easier to reason with downstream
            config.componentLibraries = [];
        }
        config.componentLibrariesPort = config.componentLibrariesPort ? config.componentLibrariesPort : 8080;
        // #endregion

        // Apply any defaults to missing values
        config.type = config.type ? config.type : 'brightscript';
        config.name = config.name ? config.name : 'BrightScript Debug: Launch';
        config.host = config.host ? config.host : '${promptForHost}';
        config.password = config.password ? config.password : '${promptForPassword}';
        config.consoleOutput = config.consoleOutput ? config.consoleOutput : 'normal';
        config.request = config.request ? config.request : 'launch';
        config.stopOnEntry = config.stopOnEntry ? config.stopOnEntry : false;
        config.outDir = this.util.ensureTrailingSlash(config.outDir ? config.outDir : '${workspaceFolder}/out');
        config.retainDeploymentArchive = config.retainDeploymentArchive === false ? false : true;
        config.injectRaleTrackerTask = config.injectRaleTrackerTask === true ? true : false;
        config.retainStagingFolder = config.retainStagingFolder === true ? true : false;
        config.clearOutputOnLaunch = config.clearOutputOnLaunch === true ? true : false;
        config.selectOutputOnLogMessage = config.selectOutputOnLogMessage === true ? true : false;
        config.enableVariablesPanel = 'enableVariablesPanel' in config ? config.enableVariablesPanel : true;
        config.enableDebuggerAutoRecovery = config.enableDebuggerAutoRecovery === true ? true : false;
        config.stopDebuggerOnAppExit = config.stopDebuggerOnAppExit === true ? true : false;
        config.enableLookupVariableNodeChildren = config.enableLookupVariableNodeChildren === true ? true : false;
        config.files = config.files ? config.files : defaultFilesArray;

        // Check for the existence of the tracker task file in auto injection is enabled
        if (config.injectRaleTrackerTask) {
            if (await this.util.fileExists(this.trackerTaskFileLocation) === false) {
                vscode.window.showErrorMessage(`injectRaleTrackerTask was set to true but could not find TrackerTask.xml at:\n${this.trackerTaskFileLocation}`);
            } else {
                config.trackerTaskFileLocation = this.trackerTaskFileLocation;
            }
        }

        // Make sure that directory paths end in a trailing slash
        if (config.debugRootDir) {
            config.debugRootDir = this.util.ensureTrailingSlash(config.debugRootDir);
        }

        return config;
    }

    /**
     * Reads the manifest file and updates any config values that are mapped to it
     * @param folder current workspace folder
     * @param config current config object
     */
    private async processEnvFile(folder: WorkspaceFolder | undefined, config: BrightScriptDebugConfiguration): Promise<BrightScriptDebugConfiguration> {
        //process .env file if present
        if (config.envFile) {
            let envFilePath = config.envFile;
            //resolve ${workspaceFolder} so we can actually load the .env file now
            if (config.envFile.indexOf('${workspaceFolder}') > -1) {
                envFilePath = config.envFile.replace('${workspaceFolder}', folder.uri.fsPath);
            }
            if (await this.util.fileExists(envFilePath) === false) {
                throw new Error(`Cannot find .env file at "${envFilePath}`);
            }
            //parse the .env file
            let envConfig = dotenv.parse(await this.fsExtra.readFile(envFilePath));

            //replace any env placeholders
            for (let key in config) {
                let configValue = config[key];
                let match: RegExpMatchArray;
                let regexp = /\$\{env:([\w\d_]*)\}/g;
                //replace all environment variable placeholders with their values
                while (match = regexp.exec(configValue)) {
                    let environmentVariableName = match[1];
                    let environmentVariableValue = envConfig[environmentVariableName];
                    if (environmentVariableValue) {
                        configValue = configValue.replace(match[0], environmentVariableValue);
                    }
                }
                config[key] = configValue;
            }
        }

        return config;
    }

    /**
     * Validates the host parameter in the config and opens an input ui if set to ${promptForHost}
     * @param config  current config object
     */
    private async processHostParameter(config: BrightScriptDebugConfiguration): Promise<BrightScriptDebugConfiguration> {
        let showInputBox = false;

        // #region prompt for host if not hardcoded
        if (config.host.trim() === '${promptForHost}' || (config.deepLinkUrl && config.deepLinkUrl.indexOf('${promptForHost}') > -1)) {
            if (this.activeDeviceManager.firstRequestForDevices && !this.activeDeviceManager.getCacheStats().keys) {
                let deviceWaitTime = 5000;
                if (this.showDeviceInfoMessages) {
                    vscode.window.showInformationMessage(`Device Info: Allowing time for device discovery (${deviceWaitTime} ms)`);
                }

                await util.delay(deviceWaitTime);
            }

            let activeDevices = this.activeDeviceManager.getActiveDevices();

            if (activeDevices && Object.keys(activeDevices).length) {
                let items = [];

                // Create the Quick Picker option items
                Object.keys(activeDevices).map((key) => {
                    let device = activeDevices[key];
                    let itemText = `${device.ip} | ${device.deviceInfo['default-device-name']} - ${device.deviceInfo['model-number']}`;

                    if (this.activeDeviceManager.lastUsedDevice && device.deviceInfo['default-device-name'] === this.activeDeviceManager.lastUsedDevice) {
                        items.unshift(itemText);
                    } else {
                        items.push(itemText);
                    }
                });

                // Give the user the option to type their own IP incase the device they want has not yet been detected on the network
                let manualIpOption = 'Other';
                items.push(manualIpOption);

                let host = await vscode.window.showQuickPick(items, { placeHolder: `Please Select a Roku or use the "${manualIpOption}" option to enter a IP` });

                if (host === manualIpOption) {
                    showInputBox = true;
                } else if (host) {
                    let defaultDeviceName = host.substring(host.toLowerCase().indexOf(' | ') + 3, host.toLowerCase().lastIndexOf(' - '));
                    let deviceIP = host.substring(0, host.toLowerCase().indexOf(' | '));
                    if (defaultDeviceName) {
                        this.activeDeviceManager.lastUsedDevice = defaultDeviceName;
                    }
                    config.host = deviceIP;
                } else {
                    // User canceled. Give them one more change to enter an ip
                    showInputBox = true;
                }
            } else {
                showInputBox = true;
            }
        }

        if (showInputBox) {
            config.host = await this.openInputBox('The IP address of your Roku device');
        }
        // #endregion

        //check the host and throw error if not provided or update the workspace to set last host
        if (!config.host) {
            throw new Error('Debug session terminated: host is required.');
        } else {
            await this.context.workspaceState.update('remoteHost', config.host);
        }

        return config;
    }

    /**
     * Validates the password parameter in the config and opens an input ui if set to ${promptForPassword}
     * @param config  current config object
     */
    private async processPasswordParameter(config: BrightScriptDebugConfiguration) {
        //prompt for password if not hardcoded
        if (config.password.trim() === '${promptForPassword}') {
            config.password = await this.openInputBox('The developer account password for your Roku device.');
            if (!config.password) {
                throw new Error('Debug session terminated: password is required.');
            }
        }

        return config;
    }

    /**
     * Validates the deepLinkUrl parameter in the config and opens an input ui if set to ${promptForDeepLinkUrl} or if the url contains ${promptForQueryParams
     * @param config  current config object
     */
    private async processDeepLinkUrlParameter(config: BrightScriptDebugConfiguration) {
        if (config.deepLinkUrl) {
            config.deepLinkUrl = config.deepLinkUrl.replace('${host}', config.host);
            config.deepLinkUrl = config.deepLinkUrl.replace('${promptForHost}', config.host);
            if (config.deepLinkUrl.indexOf('${promptForQueryParams}') > -1) {
                let queryParams = await this.openInputBox('Querystring params for deep link');
                config.deepLinkUrl = config.deepLinkUrl.replace('${promptForQueryParams}', queryParams);
            }
            if (config.deepLinkUrl === '${promptForDeepLinkUrl}') {
                config.deepLinkUrl = await this.openInputBox('Full deep link url');
            }
        }

        return config;
    }

    /**
     * Helper to open a vscode input box ui
     * @param placeHolder placeHolder text
     * @param value default value
     */
    private async openInputBox(placeHolder: string, value: string = '') {
        return await vscode.window.showInputBox({
            placeHolder: placeHolder,
            value: value
        });
    }
}

export interface BrightScriptDebugConfiguration extends DebugConfiguration {
    host: string;
    password: string;
    rootDir: string;
    sourceDirs?: string[];
    bsConst?: { [key: string]: boolean };
    componentLibrariesPort?; number;
    componentLibrariesOutDir: string;
    componentLibraries: ComponentLibraryConfig[];
    outDir: string;
    stopOnEntry: boolean;
    files?: FilesType[];
    consoleOutput: 'full' | 'normal';
    retainDeploymentArchive: boolean;
    injectRaleTrackerTask: boolean;
    trackerTaskFileLocation: string;
    retainStagingFolder: boolean;
    clearOutputOnLaunch: boolean;
    selectOutputOnLogMessage: boolean;
    enableVariablesPanel: boolean;
    enableDebuggerAutoRecovery: boolean;
    stopDebuggerOnAppExit: boolean;
    envFile?: string;
}

export interface ComponentLibraryConfig {
    rootDir: string;
    /**
     * The filename for the package.
     */
    outFile: string;
    files: FilesType[];
    sourceDirs: string[];
    bsConst?: { [key: string]: boolean };
    injectRaleTrackerTask: boolean;
    trackerTaskFileLocation: string;
}
