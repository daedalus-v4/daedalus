<script lang="ts" context="module">
    export const sizes = { small: "800px", normal: "1200px", large: "1800px" } as const;
</script>

<script lang="ts">
    export let main: boolean = false;
    export let size: keyof typeof sizes = "normal";
    export let style: string = "";
    let className: string = "";

    export { className as class };
</script>

<div
    class="{main ? 'flex flex-col items-start gap-8' : ''} {className} my-8"
    style="{style}; margin-left: calc(max(5%, 50% - {sizes[size]} / 2)); margin-right: calc(max(5%, 50% - {sizes[size]} / 2))"
>
    <slot />
</div>
