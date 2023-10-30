<script lang="ts">
    import { getModalStore, type ModalSettings } from "@skeletonlabs/skeleton";
    import { permissions } from "../../../../shared";
    import A from "./A.svelte";

    const modalStore = getModalStore();

    export let key: string;
    let obj: any = permissions[key as keyof typeof permissions] ?? {};

    $: key, (obj = permissions[key as keyof typeof permissions] ?? {});

    const modal: ModalSettings = { type: "alert", title: obj.name, body: obj.description, buttonTextCancel: "Close" };
</script>

<A {...$$restProps} on:click={() => modalStore.trigger(modal)}>{obj.name}</A>
