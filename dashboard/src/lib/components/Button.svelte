<script lang="ts" context="module">
    const styles = {
        normal: "bg-surface-50 dark:bg-surface-900",
        medium: "bg-surface-300 dark:bg-surface-600",
        primary: "bg-primary-400 dark:bg-primary-500",
        "primary-text": "bg-surface-50 text-primary-800 dark:bg-surface-900 dark:text-primary-400",
    } as const;
</script>

<script lang="ts">
    export let variant: keyof typeof styles = "normal";
    export let bold: boolean = false;
    let className: string = "";

    export { className as class };
</script>

<button class="{className} btn {styles[variant]} {bold ? 'font-bold' : ''} flex items-center gap-2" on:click><slot /></button>
