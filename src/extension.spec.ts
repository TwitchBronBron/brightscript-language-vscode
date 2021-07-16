/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
import { expect } from 'chai';
import { createSandbox } from 'sinon';
let Module = require('module');
import * as extension from './extension';
import { vscode, vscodeLanguageClient } from './mockVscode.spec';
import { brightScriptCommands } from './BrightScriptCommands';
import { LanguageServerManager, languageServerManager } from './LanguageServerManager';
import * as rta from 'roku-test-automation';

const sinon = createSandbox();

//override the "require" call to mock certain items
const { require: oldRequire } = Module.prototype;
Module.prototype.require = function hijacked(file) {
    if (file === 'vscode') {
        return vscode;
    } else if (file === 'vscode-languageclient') {
        return vscodeLanguageClient;
    } else {
        return oldRequire.apply(this, arguments);
    }
};

describe('extension', () => {
    let context: any;
    beforeEach(() => {
        sinon.stub(languageServerManager, 'init').returns(Promise.resolve());

        context = {
            subscriptions: [],
            asAbsolutePath: () => { },
            globalState: {
                get: () => {

                },
                update: () => {

                }
            }
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it('registers configuration provider', async () => {
        let spy = sinon.spy(vscode.debug, 'registerDebugConfigurationProvider');
        expect(spy.calledOnce).to.be.false;
        await extension.activate(context);
        expect(spy.calledOnce).to.be.true;
    });

    it('registers formatter', async () => {
        let spy = sinon.spy(vscode.languages, 'registerDocumentRangeFormattingEditProvider');
        expect(spy.getCalls().length).to.equal(0);
        await extension.activate(context);
        expect(spy.getCalls().length).to.be.greaterThan(1);
    });

    it('registers definition provider', async () => {
        let spy = sinon.spy(vscode.languages, 'registerDefinitionProvider');
        expect(spy.calledOnce).to.be.false;
        await extension.activate(context);
        expect(spy.callCount).to.be.greaterThan(0);
    });

    it('registers all commands', async () => {
        let stub = sinon.stub(brightScriptCommands, 'registerCommands').callsFake(() => { });
        await extension.activate(context);
        expect(stub.callCount).to.equal(1);
    });

    it('registers onDidStartDebugSession', async () => {
        let spy = sinon.spy(vscode.debug, 'onDidStartDebugSession');
        expect(spy.calledOnce).to.be.false;
        await extension.activate(context);
        expect(spy.calledOnce).to.be.true;
    });

    it('registers onDidTerminateDebugSession', async () => {
        let spy = sinon.spy(vscode.debug, 'onDidTerminateDebugSession');
        expect(spy.calledOnce).to.be.false;
        await extension.activate(context);
        expect(spy.calledOnce).to.be.true;
    });

    it('registers onDidReceiveDebugSessionCustomEvent', async () => {
        let spy = sinon.spy(vscode.debug, 'onDidReceiveDebugSessionCustomEvent');
        expect(spy.calledOnce).to.be.false;
        await extension.activate(context);
        expect(spy.getCalls().length).to.be.greaterThan(0);
    });

    describe('RDB', () => {
        const extensionInstance = extension.extension as any;
        let config;
        let context;
        let originalRdbViews;
        beforeEach(() => {
            context = {
                subscriptions: []
            };
            config = {
                host: '86.75.30.9',
                password: 'jenny'
            };
            originalRdbViews = extensionInstance.rdbViews;
            extensionInstance.rdbViews = {};
        });

        afterEach(() => {
            extensionInstance.odc = undefined;
            extensionInstance.rdbViews = originalRdbViews;
        });

        describe('setupODC', () => {
            it('sets up the underlying RokuDevice instance', async () => {
                const odc = extensionInstance.setupODC(config);
                expect(odc.device).to.be.instanceOf(rta.RokuDevice);
            });

            it('has the correct config values passed from the extension', async () => {
                const odc = extensionInstance.setupODC(config);
                const deviceConfig = odc.device.getCurrentDeviceConfig();
                expect(deviceConfig.host).to.equal(config.host);
                expect(deviceConfig.password).to.equal(config.password);
            });
        });

        describe('setupRDB', () => {
            it('calls setupODC to create the odc instance if enabled', async () => {
                config.injectRdbOnDeviceComponent = true;
                const spy = sinon.stub(extensionInstance, 'setupODC').returns({});
                extensionInstance.setupRDB(context, config);
                expect(spy.calledOnce).to.be.true;
            });

            it('does not call setupODC if not enabled', async () => {
                config.injectRdbOnDeviceComponent = false;
                const spy = sinon.stub(extensionInstance, 'setupODC').returns({});
                extensionInstance.setupRDB(context, config);
                expect(spy.calledOnce).to.be.false;
            });

            it('initializes RDB views and calls registerWebviewViewProvider for each', async () => {
                config.injectRdbOnDeviceComponent = true;
                extensionInstance.rdbViews = originalRdbViews;
                sinon.stub(extensionInstance, 'setupODC').returns({});
                const spy = sinon.spy(vscode.window, 'registerWebviewViewProvider');
                extensionInstance.setupRDB(context, config);
                expect(spy.callCount).to.equal(Object.keys(originalRdbViews).length);
            });
        });
    });
});
