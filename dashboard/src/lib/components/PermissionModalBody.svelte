<script lang="ts">
    import { getModalStore } from "@skeletonlabs/skeleton";
    import type { SvelteComponent } from "svelte";
    import { permissions } from "../../../../shared";
    import Button from "./Button.svelte";
    import Container from "./Container.svelte";
    import P from "./P.svelte";

    export let parent: SvelteComponent;

    const modalStore = getModalStore();
    let key: keyof typeof permissions;

    $: key = $modalStore[0]?.meta?.key ?? key;
</script>

<Container size="small">
    <div class="bg-surface-400 dark:bg-surface-600 p-8 flex flex-col items-end gap-8 rounded-lg max-h-[32vh] overflow-y-auto">
        <P>
            {@html permissions[key]?.description}
        </P>
        <Button on:click={parent.onClose}>{parent.buttonTextCancel}</Button>
    </div>
</Container>
