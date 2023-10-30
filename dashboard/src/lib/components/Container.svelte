<script lang="ts">
    export let main: boolean = false;
    let className: string = "";

    export { className as class };
</script>

<div
    class="{main ? 'flex flex-col items-start gap-8' : ''} {className} py-8"
    style="padding-left: calc(max(5%, 50% - 600px)); padding-right: calc(max(5%, 50% - 600px))"
>
    <slot />
</div>
