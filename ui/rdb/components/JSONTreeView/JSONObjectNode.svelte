<script>
    import JSONNested from "./JSONNested.svelte";
    export let nodeKey, nodeValue;
    export let onValueChange = () => {};
</script>

<JSONNested onValueChange={onValueChange} {nodeKey} bind:nodeValue={nodeValue} />
