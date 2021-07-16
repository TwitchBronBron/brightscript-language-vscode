/** Acts as a middle man that takes request from our views and sends them through vscode message protocol and waits for replies to simplify usage in code */
import type * as rta from 'roku-test-automation';

class ExtensionIntermediary {
    private inflightRequests = {};
    private observed = false;

    private setupObserver() {
        this.observed = true;
        window.addEventListener("message", (event) => {
            const message = event.data;
            const request = this.inflightRequests[message.id];
            if (request) {
                delete this.inflightRequests[message.id];
                request.callback(message);
            }
        });
    }

    public async sendMessage<T>(command: string, context = {}) {
        if(!this.observed) {
            this.setupObserver();
        }
        const requestId = this.randomStringGenerator();

        return new Promise<T>((resolve, reject) => {
            const callback = (message) => {
                if (message.error) {
                    reject(message.error);
                } else {
                    resolve(message.response);
                }
			};
            const message = {
                id: requestId,
                command: command,
                context: context
            };

            this.inflightRequests[requestId] = {
                message: message,
                callback: callback
            }
            vscode.postMessage(message);
        });
    }

    private randomStringGenerator(length: number = 7) {
		const p = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		return [...Array(length)].reduce((a) => a + p[~~(Math.random() * p.length)], '');
	}
}

const intermediary = new ExtensionIntermediary();

class ODCIntermediary {
    public sendOdcMessage<T>(command: string, args?, options?: rta.ODC.RequestOptions){
        return intermediary.sendMessage<T>(command, {
            args: args,
            options: options
        });
    }

    public async readRegistry(args?: rta.ODC.ReadRegistryArgs, options?: rta.ODC.RequestOptions) {
        return this.sendOdcMessage<ReturnType<typeof rta.odc.readRegistry>>('readRegistry', args, options);
    }

    public async writeRegistry(args?: rta.ODC.WriteRegistryArgs, options?: rta.ODC.RequestOptions) {
        return this.sendOdcMessage<ReturnType<typeof rta.odc.writeRegistry>>('writeRegistry', args, options);
    }

    public async getFocusedNode(args?: rta.ODC.GetFocusedNodeArgs, options?: rta.ODC.RequestOptions) {
        return this.sendOdcMessage<ReturnType<typeof rta.odc.getFocusedNode>>('getFocusedNode', args, options);
    }

    public async getValueAtKeyPath(args?: rta.ODC.GetValueAtKeyPathArgs, options?: rta.ODC.RequestOptions) {
        return this.sendOdcMessage<ReturnType<typeof rta.odc.getValueAtKeyPath>>('getValueAtKeyPath', args, options);
    }

    public async hasFocus(args?: rta.ODC.HasFocusArgs, options?: rta.ODC.RequestOptions) {
        return this.sendOdcMessage<ReturnType<typeof rta.odc.hasFocus>>('hasFocus', args, options);
    }

    public async isInFocusChain(args?: rta.ODC.IsInFocusChainArgs, options?: rta.ODC.RequestOptions) {
        return this.sendOdcMessage<ReturnType<typeof rta.odc.isInFocusChain>>('isInFocusChain', args, options);
    }

    public async observeField(args?: rta.ODC.ObserveFieldArgs, options?: rta.ODC.RequestOptions) {
        return this.sendOdcMessage<ReturnType<typeof rta.odc.observeField>>('observeField', args, options);
    }

    public async setValueAtKeyPath(args?: rta.ODC.ObserveFieldArgs, options?: rta.ODC.RequestOptions) {
        return this.sendOdcMessage<ReturnType<typeof rta.odc.setValueAtKeyPath>>('setValueAtKeyPath', args, options);
    }

    public async deleteRegistrySections(args?: rta.ODC.DeleteRegistrySectionsArgs, options?: rta.ODC.RequestOptions) {
        return this.sendOdcMessage<ReturnType<typeof rta.odc.deleteRegistrySections>>('deleteRegistrySections', args, options);
    }

    public async deleteEntireRegistry(args?: rta.ODC.DeleteEntireRegistrySectionsArgs, options?: rta.ODC.RequestOptions) {
        return this.sendOdcMessage<ReturnType<typeof rta.odc.deleteEntireRegistry>>('deleteEntireRegistry', args, options);
    }

    public async storeNodeReferences(args?: rta.ODC.StoreNodeReferences, options?: rta.ODC.RequestOptions) {
        return this.sendOdcMessage<ReturnType<typeof rta.odc.storeNodeReferences>>('storeNodeReferences', args, options);
    }

    public async getNodeReferences(args?: rta.ODC.GetNodeReferences, options?: rta.ODC.RequestOptions) {
        return this.sendOdcMessage<ReturnType<typeof rta.odc.getNodeReferences>>('getNodeReferences', args, options);
    }

    public async deleteNodeReferences(args?: rta.ODC.DeleteNodeReferences, options?: rta.ODC.RequestOptions) {
        return this.sendOdcMessage<ReturnType<typeof rta.odc.deleteNodeReferences>>('deleteNodeReferences', args, options);
    }
}

const odc = new ODCIntermediary();
export {
    odc,
    intermediary
}
