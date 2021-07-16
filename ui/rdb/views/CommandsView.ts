class CommandsView {
    public convertArgs(inputArgs, requestArgsSchema) {
        const args = [];
        for (const key of inputArgs.propertyOrder) {
            let rawArg = inputArgs.properties[key];
            // Handles references to other definitions in schema
            if (rawArg['$ref']) {
                const refParts = rawArg['$ref'].split("/");
                let rawArgRef = requestArgsSchema;

                for (const key of refParts) {
                    // Skip first entry
                    if (key === '#') continue;
                    rawArgRef = rawArgRef[key];
                }
                for (const key in rawArgRef) {
                    rawArg[key] = rawArgRef[key];
                }
            }
            args.push({
                ...rawArg,
                id: key
            });
        }
        return args;
    }

    public processArgToSendToExtension(argType: string, argValue: string) {
        if (argType == 'boolean') {
            return argValue === 'true'
        } else if (argType == 'array' || argType == 'object') {
            return JSON.parse(argValue);
        } else if (argType == 'number') {
            return Number(argValue);
        } else {
            return argValue;
        }
    }
}

const commandsView = new CommandsView();

export {
    commandsView
}
