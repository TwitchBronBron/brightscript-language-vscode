
<script lang="ts">
    window.vscode = acquireVsCodeApi();
    import {odc, intermediary} from "../ExtensionIntermediary";
    import JSONTreeView from "../components/JSONTreeView/JSONTreeView.svelte";
    import { registryView } from "./RegistryView";

    let registryValues = {};
    (async () => {
        const result = await odc.readRegistry();
        registryValues = registryView.formatValues(result.values);
    })();

    function exportRegistry() {
        intermediary.sendMessage('exportRegistry', {
            content: registryValues,
        });
    }

    function importRegistry() {
        intermediary.sendMessage('importRegistry');
    }
</script>
{#if Object.keys(registryValues).length > 0}
    <div>
        <button on:click={exportRegistry}>Export</button>
        <button on:click={importRegistry}>Import</button>
    </div>
    <JSONTreeView {registryValues} />
{/if}
