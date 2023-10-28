<script lang="ts">
    export let to: string = "javascript:void(0)";
    export let external: boolean = false;
    let className: string = "";

    export { className as class };
</script>

<a href={to} target={external ? "_blank" : "_self"} class="{className} text-secondary-500 dark:text-secondary-400"><slot /></a>
