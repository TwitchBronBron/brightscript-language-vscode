<script>
    import JSONObjectNode from "./JSONObjectNode.svelte";
    import JsonValueNode from "./JSONValueNode.svelte";
    export let nodeValue, nodeKey;
    let valueType = typeof nodeValue;
    export let onValueChange = () => {};

    let componentType = JSONObjectNode;
    if (valueType !== "object") {
        componentType = JsonValueNode;
    }
</script>

<svelte:component bind:nodeValue={nodeValue} onValueChange={onValueChange} this={componentType} {nodeKey} />
