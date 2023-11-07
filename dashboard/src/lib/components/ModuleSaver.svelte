<script lang="ts">
    import { invalidateAll } from "$app/navigation";
    import { page } from "$app/stores";
    import { nometa } from "$lib/modules/utils";
    import { f2b } from "../../routes/manage/[id]/modules";
    import Modal from "./Modal.svelte";
    import TrackChanges from "./TrackChanges.svelte";

    export let base: any;
    export let data: any;
    export let partial: boolean;
    export let disabled: boolean = false;

    async function save() {
        const key = $page.url.pathname.split("/")[3] ?? "-";

        const request = await fetch(`/manage/${$page.params.id}/save/${key}`, {
            method: "POST",
            body: JSON.stringify(await f2b[key as keyof typeof f2b](data, $page.params.id)),
            headers: { "Content-Type": "application/json" },
        });

        if (!request.ok)
            if (partial && request.status === 444) {
                open = true;
                display = await request.json();
                await invalidateAll();
            } else throw await request.text();
    }

    let open = false;
    let display: string[] = [];
</script>

<TrackChanges bind:disabled {save} bind:base bind:data diff={(x, y) => JSON.stringify(nometa(x)) !== JSON.stringify(nometa(y))} />

{#if partial}
    <Modal z={500} bind:open>
        <ul class="list-disc pl-4">
            {#each display as row}
                <li class="pl-2">{display}</li>
            {/each}
        </ul>
    </Modal>
{/if}
