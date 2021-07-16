<script>
    import JSONKey from './JSONKey.svelte';
    export let nodeKey, nodeValue;
    export let onValueChange = () => {};
</script>
<style>
    li {
        user-select: text;
        word-wrap: break-word;
        word-break: break-all;
    }
    .valueNode {
        color: #ececec;
    }
</style>
<li>
    <JSONKey key={nodeKey} />
    <label for="jsonNodeValue" on:blur={onValueChange} bind:textContent={nodeValue} class="valueNode" contenteditable="true" />
</li>
