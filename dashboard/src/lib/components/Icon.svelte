<script lang="ts">
    export let icon: string;
    export let brand: boolean = false;
    let className: string = "";

    export { className as class };
</script>

<i class="fa-{brand ? 'brands' : 'solid'} fa-{icon} {className}" />
