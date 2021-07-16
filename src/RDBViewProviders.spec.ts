/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */

import { expect } from 'chai';
import * as sinonImport from 'sinon';

let Module = require('module');

import { vscode } from './mockVscode.spec';

const { require: oldRequire } = Module.prototype;

Module.prototype.require = function hijacked(file) {
    if (file === 'vscode') {
        return vscode;
    } else {
        return oldRequire.apply(this, arguments);
    }
};

import { CustomDocumentLink, LogDocumentLinkProvider } from './LogDocumentLinkProvider';
import { RDBCommandsViewProvider, RDBRegistryViewProvider } from './RDBViewProviders';

let sinon: sinonImport.SinonSandbox;
let view;
let callback;
beforeEach(() => {
    sinon = sinonImport.createSandbox();
    view = {
        webview: {
            onDidReceiveMessage: (cb) => {
                callback = cb;
            },
            postMessage: (message) => {}
        },
        show: () => {}
    };
});
afterEach(() => {
    sinon.restore();
});

describe('RDBRegistryViewProvider', () => {
    describe('handleViewMessage', () => {
        const provider = new RDBRegistryViewProvider(vscode.context);

        it('Shows the save prompt for exportRegistry command', async () => {
            const spy = sinon.spy(vscode.window, 'showSaveDialog');
            (provider as any).handleViewMessage({
                command: 'exportRegistry',
                content: '{}'
            });
            expect(spy.calledOnce).to.be.true;
        });

        it('Shows the open dialog for importRegistry command', async () => {
            const spy = sinon.spy(vscode.window, 'showOpenDialog');
            (provider as any).handleViewMessage({
                command: 'importRegistry',
                context: {}
            });
            expect(spy.calledOnce).to.be.true;
        });
    });
});

describe('RDBCommandsViewProvider', () => {
    describe('getHtmlForWebview', () => {
        const provider = new RDBCommandsViewProvider(vscode.context) as any;

        it('includes the contents of additionalScriptContents', async () => {
            const html = provider.getHtmlForWebview();
            expect(html).to.contain(provider.additionalScriptContents());
        });
    });

    describe('resolveWebviewView', () => {
        it('sets up observer to handle messages from the ui', async () => {
            const provider = new RDBCommandsViewProvider(vscode.context) as any;
            provider.resolveWebviewView(view, {}, {});

            expect(typeof callback).to.equal('function');
            const spy = sinon.spy(provider, 'handleViewMessage');
            callback({
                command: 'importRegistry',
                context: {}
            });
            expect(spy.calledOnce).to.be.true;
        });
    });
});
