<script lang="ts">
    window.vscode = acquireVsCodeApi();
    import {odc} from "../ExtensionIntermediary";
    import { commandsView } from "./CommandsView";

    const storage = window.localStorage;

    let commandArgs: any[];
    let selectedCommand;

    // Where we store the info the user put in the form
    let formArgs = {};
    let commandResponse = '';

    function onCommandChange() {
        commandArgs = commandsView.convertArgs(selectedCommand.args, requestArgsSchema);
        storage.previousCommandName = selectedCommand.name;
        const argValues = storage[`${selectedCommand.name}ArgValues`];
        if(argValues) {
            formArgs = JSON.parse(argValues);
        } else {
            formArgs = {};
        }
    }

    async function sendCommand() {
        commandResponse = 'running...';
        const processedArgs = {};
        const argValuesForCommand = {};
        for (const key in formArgs) {
            let argValue = formArgs[key];
            argValuesForCommand[key] = argValue;
            const argType = selectedCommand.args.properties[key].type;
            processedArgs[key] = commandsView.processArgToSendToExtension(argType, argValue);
        }

        storage[`${selectedCommand.name}ArgValues`] = JSON.stringify(argValuesForCommand);

        try {
            const response = await odc.sendOdcMessage(selectedCommand.name, processedArgs);
            commandResponse = JSON.stringify(response, null, 2);
        } catch(error) {
            commandResponse = error;
        }
    }

    const commandList = []
    for (const commandName of odcCommands) {
        let argsKey = 'ODC.' + commandName.charAt(0).toUpperCase() + commandName.slice(1) + 'Args';
        commandList.push({
            name: commandName,
            args: requestArgsSchema.definitions[argsKey]
        })
    }

    if (!storage.previousCommandName) {
        storage.previousCommandName = 'getFocusedNode'
    }

    // preselect the last used function
    for (const command of commandList) {
        if (command.name === storage.previousCommandName) {
            commandArgs = commandsView.convertArgs(command.args, requestArgsSchema);
            selectedCommand = command;
            onCommandChange();
        }
    }
</script>

<style>
    #container {
        margin: 10px 0px;
    }

    label {
        display: inline;
        padding-right: 6px;
        font-weight: bold;
    }

    .commandOption {
        margin-top: 6px;
    }

    pre {
        white-space: pre-wrap;
    }

    input {
        width: 180px;
    }
</style>
<div id="container">
    <label for="command">Command:</label>
    <!-- svelte-ignore a11y-no-onchange -->
    <select name="command" bind:value={selectedCommand} on:change={onCommandChange}>
    {#each commandList as command}
        <option value="{command}">{command.name}</option>
    {/each}
    </select>

    {#each commandArgs as args}
        <div class="commandOption">
            <label for="{args.id}" title="{args.description}">{args.id}:</label>
        {#if args.enum}
            <select name="{args.id}" title="{args.description}" bind:value={formArgs[args.id]}>
            {#each args.enum as value}
                <option>{value}</option>
            {/each}
            </select>
        {:else}
            <input name="{args.id}" placeholder="{args.type}" title="{args.description}" bind:value={formArgs[args.id]} />
        {/if}
        </div>
    {/each}
    <br><button on:click={sendCommand}>Send</button>
    <hr />
    <pre>
        {commandResponse}
    </pre>
</div>
