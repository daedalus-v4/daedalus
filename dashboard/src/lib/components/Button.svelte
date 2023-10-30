<script lang="ts" context="module">
    const styles = {
        normal: ["surface-50", "surface-900"],
    } as const;
</script>

<script lang="ts">
    export let variant: keyof typeof styles = "normal";
    let className: string = "";

    export { className as class };
</script>

<button class="{className} btn bg-{styles[variant][0]} dark:bg-{styles[variant][1]} flex gap-2" on:click><slot /></button>
