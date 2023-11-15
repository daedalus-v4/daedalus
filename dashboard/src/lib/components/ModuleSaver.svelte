<script lang="ts">
    import { page } from "$app/stores";
    import { nometa } from "$lib/modules/utils";
    import { f2b } from "../../routes/manage/[id]/modules";
    import TrackChanges from "./TrackChanges.svelte";

    export let base: any;
    export let data: any;
    export let disabled: boolean = false;
    export let saving: boolean = false;
    export let postsave: (() => unknown) | undefined = undefined;

    export async function save() {
        saving = true;

        const key = $page.url.pathname.split("/")[3] ?? "-";

        const converted = await f2b[key as keyof typeof f2b](data, $page.params.id).catch(alert);

        if (!converted) {
            saving = false;
            return;
        }

        const request = await fetch(`/manage/${$page.params.id}/save/${key}`, {
            method: "POST",
            body: JSON.stringify(converted),
            headers: { "Content-Type": "application/json" },
        });

        if (!request.ok) {
            saving = false;
            alert(await request.text());
        } else await postsave?.();

        saving = false;
    }
</script>

<TrackChanges bind:disabled {save} bind:base bind:data bind:saving diff={(x, y) => JSON.stringify(nometa(x)) !== JSON.stringify(nometa(y))} />
