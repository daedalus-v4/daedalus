<script lang="ts">
    import { permissionModalStore } from "$lib/stores";
    import { permissions } from "shared";
    import A from "./A.svelte";

    export let key: string;
    export let title: string | undefined = undefined;

    let obj: any = {};
    $: key, (obj = permissions[key as keyof typeof permissions] ?? {});
</script>

<A {...$$restProps} on:click={() => ($permissionModalStore = key)}>{@html title ?? obj.name}</A>
