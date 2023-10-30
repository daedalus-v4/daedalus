<script lang="ts">
    import { getModalStore, type ModalSettings } from "@skeletonlabs/skeleton";
    import { permissions } from "shared";
    import A from "./A.svelte";

    const modalStore = getModalStore();

    export let key: string;
    export let title: string | undefined = undefined;

    let obj: any = {};
    $: key, (obj = permissions[key as keyof typeof permissions] ?? {});

    const modal: ModalSettings = { type: "component", component: "PermissionModalBody", buttonTextCancel: "Close", meta: { key } };
</script>

<A {...$$restProps} on:click={() => modalStore.trigger(modal)}>{@html title ?? obj.name}</A>
