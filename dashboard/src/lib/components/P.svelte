<script lang="ts">
    export let size: "md" | "lg" | "xl" = "lg";
    let className: string = "";

    export { className as class };
</script>

<p {...$$restProps} class="{className} prose text-{size} text-surface-900 dark:text-surface-50">
    <slot />
</p>
