<script lang="ts">
    let className: string = "";

    export { className as class };
</script>

<div {...$$restProps} class="{className} card p-4 flex flex-col items-start gap-4 bg-surface-400/20 dark:bg-surface-400/20"><slot /></div>
