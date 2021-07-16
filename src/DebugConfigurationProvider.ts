import { util as bslangUtil } from 'brighterscript';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fsExtra from 'fs-extra';
import { FileEntry, DefaultFiles } from 'roku-deploy';
import * as rta from 'roku-test-automation';
import {
    CancellationToken,
    DebugConfigurationProvider,
    ExtensionContext,
    WorkspaceFolder,
} from 'vscode';
import * as vscode from 'vscode';

import { LaunchConfiguration, fileUtils } from 'roku-debug';
import { util } from './util';

export class BrightScriptDebugConfigurationProvider implements DebugConfigurationProvider {

    public constructor(context: ExtensionContext, activeDeviceManager: any) {
        this.context = context;
        this.activeDeviceManager = activeDeviceManager;

        this.configDefaults = {
            type: 'brightscript',
            name: 'BrightScript Debug: Launch',
            host: '${promptForHost}',
            password: '${promptForPassword}',
            consoleOutput: 'normal',
            request: 'launch',
            stopOnEntry: false,
            outDir: '${workspaceFolder}/out/',
            retainDeploymentArchive: true,
            injectRaleTrackerTask: false,
            injectRdbOnDeviceComponent: false,
            retainStagingFolder: false,
            enableVariablesPanel: true,
            enableDebuggerAutoRecovery: false,
            stopDebuggerOnAppExit: false,
            autoRunSgDebugCommands: [],
            files: [...DefaultFiles],
            enableSourceMaps: true,
            packagePort: 80,
            enableDebugProtocol: false,
            remotePort: 8060
        };

        let config: any = vscode.workspace.getConfiguration('brightscript') || {};
        this.showDeviceInfoMessages = (config.deviceDiscovery || {}).showInfoMessages;

        vscode.workspace.onDidChangeConfiguration((e) => {
            let config: any = vscode.workspace.getConfiguration('brightscript') || {};
            this.showDeviceInfoMessages = (config.deviceDiscovery || {}).showInfoMessages;
        });
    }

    public context: ExtensionContext;
    public activeDeviceManager: any;

    //make unit testing easier by adding these imports properties
    public fsExtra = fsExtra;
    public util = util;

    private configDefaults: any;
    private showDeviceInfoMessages: boolean;

    /**
     * Massage a debug configuration just before a debug session is being launched,
     * e.g. add all missing attributes to the debug configuration.
     */
    public async resolveDebugConfiguration(folder: WorkspaceFolder | undefined, config: any, token?: CancellationToken): Promise<BrightScriptLaunchConfiguration> {
        //force a specific staging folder path because sometimes this conflicts with bsconfig.json
        config.stagingFolderPath = path.join('${outDir}/.roku-deploy-staging');

        // Process the different parts of the config
        config = this.processUserWorkspaceSettings(config);

        config = await this.sanitizeConfiguration(config, folder);
        config = await this.processEnvFile(folder, config);
        config = await this.processHostParameter(config);
        config = await this.processPasswordParameter(config);
        config = await this.processDeepLinkUrlParameter(config);
        config = this.processLogfilePath(folder, config);

        await this.context.workspaceState.update('enableDebuggerAutoRecovery', config.enableDebuggerAutoRecovery);

        return config;
    }

    /**
     * There are several debug-level config values that can be stored in user settings, so get those
     */
    private processUserWorkspaceSettings(config: BrightScriptLaunchConfiguration) {
        //get baseline brightscript.debug user/project settings
        var userWorkspaceDebugSettings = Object.assign(
            {
                enableSourceMaps: true,
                enableDebugProtocol: false,
            },
            //merge in all of the brightscript.debug properties
            vscode.workspace.getConfiguration('brightscript.debug') ?? {},
        );
        //merge the user/workspace settings in with the config (the config wins on conflict)
        config = Object.assign(userWorkspaceDebugSettings, config ?? <any>{});
        return config;
    }

    /**
     * Takes the launch.json config and applies any defaults to missing values and sanitizes some of the more complex options
     * @param config current config object
     */
    private async sanitizeConfiguration(config: BrightScriptLaunchConfiguration, folder: WorkspaceFolder): Promise<BrightScriptLaunchConfiguration> {
        let defaultFilesArray: FileEntry[] = [
            'manifest',
            'source/**/*.*',
            'components/**/*.*',
            'images/**/*.*'
        ];
        let userWorkspaceSettings: any = vscode.workspace.getConfiguration('brightscript') || {};

        //make sure we have an object
        config = Object.assign(
            {},
            //the workspace settings are the baseline
            userWorkspaceSettings,
            //override with any debug-specific settings
            config
        );

        let folderUri: vscode.Uri;
        //use the workspace folder provided
        if (folder) {
            folderUri = folder.uri;

            //if there's only one workspace, use that workspace's folder path
        } else if (vscode.workspace.workspaceFolders.length === 1) {
            folderUri = vscode.workspace.workspaceFolders[0].uri;
        } else {
            //there are multiple workspaces, ask the user to specify which one they want to use
            let workspaceFolder = await vscode.window.showWorkspaceFolderPick();
            if (workspaceFolder) {
                folderUri = workspaceFolder.uri;
            }
        }

        if (!folderUri) {
            //cancel this whole thing because we can't continue without the user specifying a workspace folder
            throw new Error('Cannot determine which workspace to use for brightscript debugging');
        }

        //load the brsconfig settings (if available)
        let brsconfig = await this.getBrsConfig(folderUri);
        if (brsconfig) {
            config = Object.assign({}, brsconfig, config);
        }

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

        if (config.componentLibraries) {
            config.componentLibrariesOutDir = this.util.ensureTrailingSlash(config.componentLibrariesOutDir ? config.componentLibrariesOutDir : '${workspaceFolder}/libs');

            for (let library of config.componentLibraries as any) {
                library.rootDir = this.util.ensureTrailingSlash(library.rootDir);
                library.files = library.files ? library.files : [...DefaultFiles];
            }
        } else {
            //create an empty array so it's easier to reason with downstream
            config.componentLibraries = [];
        }
        config.componentLibrariesPort = config.componentLibrariesPort ? config.componentLibrariesPort : 8080;

        // Pass along files needed by RDB to roku-debug
        config.rdbFilesBasePath = rta.utils.getDeviceFilesPath();

        // Apply any defaults to missing values
        config.type = config.type ? config.type : this.configDefaults.type;
        config.name = config.name ? config.name : this.configDefaults.name;
        config.host = config.host ? config.host : this.configDefaults.host;
        config.password = config.password ? config.password : this.configDefaults.password;
        config.consoleOutput = config.consoleOutput ? config.consoleOutput : this.configDefaults.consoleOutput;
        config.autoRunSgDebugCommands = config.autoRunSgDebugCommands ? config.autoRunSgDebugCommands : this.configDefaults.autoRunSgDebugCommands;
        config.request = config.request ? config.request : this.configDefaults.request;
        config.stopOnEntry = config.stopOnEntry ? config.stopOnEntry : this.configDefaults.stopOnEntry;
        config.outDir = this.util.ensureTrailingSlash(config.outDir ? config.outDir : this.configDefaults.outDir);
        config.retainDeploymentArchive = config.retainDeploymentArchive === false ? false : this.configDefaults.retainDeploymentArchive;
        config.injectRaleTrackerTask = config.injectRaleTrackerTask === true ? true : this.configDefaults.injectRaleTrackerTask;
        config.injectRdbOnDeviceComponent = config.injectRdbOnDeviceComponent === true ? true : this.configDefaults.injectRdbOnDeviceComponent;
        config.retainStagingFolder = config.retainStagingFolder === true ? true : this.configDefaults.retainStagingFolder;
        config.enableVariablesPanel = 'enableVariablesPanel' in config ? config.enableVariablesPanel : this.configDefaults.enableVariablesPanel;
        config.enableDebuggerAutoRecovery = config.enableDebuggerAutoRecovery === true ? true : this.configDefaults.enableDebuggerAutoRecovery;
        config.stopDebuggerOnAppExit = config.stopDebuggerOnAppExit === true ? true : this.configDefaults.stopDebuggerOnAppExit;
        config.files = config.files ? config.files : this.configDefaults.files;
        config.enableSourceMaps = config.enableSourceMaps === false ? false : this.configDefaults.enableSourceMaps;
        config.packagePort = config.packagePort ? config.packagePort : this.configDefaults.packagePort;
        config.remotePort = config.remotePort ? config.remotePort : this.configDefaults.remotePort;
        config.logfilePath = config.logfilePath ?? null;

        if (config.request !== 'launch') {
            vscode.window.showErrorMessage(`roku-debug only supports the 'launch' request type`);
        }

        // Check for the existence of the tracker task file in auto injection is enabled
        if (config.injectRaleTrackerTask && await this.util.fileExists(config.raleTrackerTaskFileLocation) === false) {
            vscode.window.showErrorMessage(`injectRaleTrackerTask was set to true but could not find TrackerTask.xml at:\n${config.raleTrackerTaskFileLocation}`);
        }

        //for rootDir, replace workspaceFolder now to avoid issues in vscode itself
        if (config.rootDir.indexOf('${workspaceFolder}') > -1) {
            config.rootDir = path.normalize(config.rootDir.replace('${workspaceFolder}', folderUri.fsPath));
        }

        //for outDir, replace workspaceFolder now
        if (config.outDir.indexOf('${workspaceFolder}') > -1) {
            config.outDir = path.normalize(config.outDir.replace('${workspaceFolder}', folderUri.fsPath));
        }

        if (config.stagingFolderPath.includes('${outDir}')) {
            config.stagingFolderPath = path.normalize(config.stagingFolderPath.replace('${outDir}', config.outDir));
        }
        if (config.stagingFolderPath.includes('${workspaceFolder}')) {
            config.stagingFolderPath = path.normalize(config.stagingFolderPath.replace('${workspaceFolder}', folderUri.fsPath));
        }

        // Make sure that directory paths end in a trailing slash
        if (config.debugRootDir) {
            config.debugRootDir = this.util.ensureTrailingSlash(config.debugRootDir);
        }

        if (!config.rootDir) {
            console.log('No rootDir specified: defaulting to ${workspaceFolder}');
            //use the current workspace folder
            config.rootDir = folderUri.fsPath;
        }

        return config;
    }

    public processLogfilePath(folder: WorkspaceFolder | undefined, config: BrightScriptLaunchConfiguration) {
        if (config?.logfilePath?.trim()) {
            config.logfilePath = config.logfilePath.trim();
            if (config.logfilePath.indexOf('${workspaceFolder}') > -1) {
                config.logfilePath = config.logfilePath.replace('${workspaceFolder}', folder.uri.fsPath);
            }

            try {
                config.logfilePath = fileUtils.standardizePath(config.logfilePath);
                //create the logfile folder structure if not exist
                fsExtra.ensureDirSync(path.dirname(config.logfilePath));

                //create the log file if it doesn't exist
                if (!fsExtra.pathExistsSync(config.logfilePath)) {
                    fsExtra.createFileSync(config.logfilePath);
                }
                this.context.workspaceState.update('logfilePath', config.logfilePath);
            } catch (e) {
                throw new Error(`Could not create logfile at "${config.logfilePath}"`);
            }
        }
        return config;
    }

    /**
     * Reads the manifest file and updates any config values that are mapped to it
     * @param folder current workspace folder
     * @param config current config object
     */
    private async processEnvFile(folder: WorkspaceFolder | undefined, config: BrightScriptLaunchConfiguration): Promise<BrightScriptLaunchConfiguration> {
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

            // temporarily convert entire config to string for any envConfig replacements.
            let configString = JSON.stringify(config);
            let match: RegExpMatchArray;
            let regexp = /\$\{env:([\w\d_]*)\}/g;
            let updatedConfigString = configString;

            // apply any defined values to env placeholders
            while (match = regexp.exec(configString)) {
                let environmentVariableName = match[1];
                let environmentVariableValue = envConfig[environmentVariableName];

                if (environmentVariableValue) {
                    updatedConfigString = updatedConfigString.replace(match[0], environmentVariableValue);
                }
            }

            config = JSON.parse(updatedConfigString);

            let configDefaults = {
                rootDir: config.rootDir,
                ...this.configDefaults
            };

            // apply any default values to env placeholders
            for (let key in config) {
                let configValue = config[key];
                let match: RegExpMatchArray;
                //replace all environment variable placeholders with their values
                while (match = regexp.exec(configValue)) {
                    let environmentVariableName = match[1];
                    let environmentVariableValue = envConfig[environmentVariableName];
                    configValue = configDefaults[key];
                    console.log(`The configuration value for ${key} was not found in the env file under the name ${environmentVariableName}. Defaulting the value to: ${configValue}`);
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
    private async processHostParameter(config: BrightScriptLaunchConfiguration): Promise<BrightScriptLaunchConfiguration> {
        let showInputBox = false;

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
    private async processPasswordParameter(config: BrightScriptLaunchConfiguration) {
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
    private async processDeepLinkUrlParameter(config: BrightScriptLaunchConfiguration) {
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

    /**
     * Get the brsConfig file, if available
     */
    public async getBrsConfig(workspaceFolder: vscode.Uri) {
        //try to load brsconfig settings
        let settings = await vscode.workspace.getConfiguration('brightscript', workspaceFolder);
        let configFilePath = settings.get<string>('configFile');
        if (!configFilePath) {
            configFilePath = 'bsconfig.json';
        }

        //if the path is relative, resolve it relative to the workspace folder. If it's absolute, use as is (path.resolve handles this logic for us)
        let workspaceFolderPath = bslangUtil.uriToPath(workspaceFolder.toString());
        configFilePath = path.resolve(workspaceFolderPath, configFilePath);
        try {
            let brsconfig = await bslangUtil.loadConfigFile(configFilePath);
            return brsconfig;
        } catch (e) {
            console.error(`Could not load brsconfig file at "${configFilePath}`);
            return undefined;
        }
    }
}

export interface BrightScriptLaunchConfiguration extends LaunchConfiguration {
    /**
     * The name of this launch configuration
     */
    name: string;
    /**
     * The type of this debug configuration
     */
    type: string;
    /**
     * Should the debugger launch or attach. roku-debug only supports launching
     */
    request: 'launch' | 'attach';

    /**
     * A path to a file where all brightscript console output will be written. If falsey, file logging will be disabled.
     */
    logfilePath?: string;
    /**
     *  If true, then the zip archive is NOT deleted after a debug session has been closed.
     * @default true
     */
    retainDeploymentArchive?: boolean;

    /**
     * A path to an environment variables file which will be used to augment the launch config
     */
    envFile?: string;
}
