<script>
    import JSONNode from "./JSONNode.svelte";
    import {odc} from "../../ExtensionIntermediary";
    export let registryValues;
    const keys = Object.keys(registryValues);
    export let onValueChange = (key) => {
        odc.writeRegistry({
            values: {[key]: sanitizeInput(registryValues[key])}
        })
    };

    function sanitizeInput(values) {
        let input = values;
        Object.keys(values).map((key) => {
            if (typeof values[key] == 'object') {
                input[key] = JSON.stringify(values[key]);
            }
        });

        return input;
    }
</script>

<style>
    ul {
        margin: 0;
        list-style: none;
        padding-left: 1.2rem;
        user-select: none;
    }

    ul {
        --li-identation: var(--json-tree-li-indentation, 1em);
        --li-line-height: var(--json-tree-li-line-height, 1.3);
        --li-colon-space: 0.3em;
    }
</style>

<ul>
    {#each keys as key, index}
        <JSONNode
            onValueChange={(e) => onValueChange(key)}
            nodeKey={key}
            isParentExpanded={false}
            nodeValue={registryValues[key]} />
    {/each}
</ul>
