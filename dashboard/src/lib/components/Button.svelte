<script lang="ts" context="module">
    const styles = {
        normal: "bg-surface-50 dark:bg-surface-900",
        dim: "bg-transparent text-surface-500 dark:text-surface-300",
        medium: "bg-surface-300 dark:bg-surface-600",
        primary: "bg-primary-400 dark:bg-primary-500",
        "primary-text": "bg-surface-50 text-primary-800 dark:bg-surface-900 dark:text-primary-400",
        secondary: "bg-secondary-400 dark:bg-secondary-600",
        "error-text": "bg-surface-50 text-error-400 dark:bg-surface-900 dark:text-error-400",
        "error-text-only": "bg-transparent text-error-400 dark:text-error-400",
    } as const;
</script>

<script lang="ts">
    export let variant: keyof typeof styles = "normal";
    export let bold: boolean = false;
    let className: string = "";

    export { className as class };
</script>

<button {...$$restProps} type="button" class="{className} btn {styles[variant]} {bold ? 'font-bold' : ''} flex items-center gap-2" on:click><slot /></button>
