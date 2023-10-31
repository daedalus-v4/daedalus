<script lang="ts">
    import { page } from "$app/stores";
    import { f2b } from "../../routes/manage/[id]/modules";
    import TrackChanges from "./TrackChanges.svelte";

    export let base: any;
    export let data: any;
    export let diff: any;

    async function save() {
        let key = $page.url.pathname.split("/").at(-1)!;
        if (key.match(/^\d+$/)) key = "-";

        const request = await fetch(`/manage/${$page.params.id}/save/${key}`, {
            method: "POST",
            body: JSON.stringify(await f2b[key as keyof typeof f2b](data)),
            headers: { "Content-Type": "application/json" },
        });

        if (!request.ok) throw await request.text();
    }
</script>

<TrackChanges {save} bind:base bind:data {diff} />
