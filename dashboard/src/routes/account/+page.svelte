<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import Panel from "$lib/components/Panel.svelte";
    import TrackChanges from "$lib/components/TrackChanges.svelte";
    import { SlideToggle } from "@skeletonlabs/skeleton";
    import type { DBAccountSettings } from "shared";

    let base: DBAccountSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;

    async function save() {
        const request = await fetch("", {
            method: "POST",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" },
        });

        if (!request.ok) throw await request.text();
    }
</script>

<TrackChanges bind:base bind:data diff={(x, y) => JSON.stringify(x) !== JSON.stringify(y)} {save} />

<Panel>
    <h3 class="h3">Account Settings</h3>
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.notifyWhenOwnedServerPremiumStatusChanges} />
        <b>Notify when the premium status of a server you own changes</b>
    </div>
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.notifyWhenManagedServerPremiumStatusChanges} />
        <b>Notify when the premium status of a server you can manage changes</b>
    </div>
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.suppressAdminBroadcasts} />
        <span>
            <b>Suppress Admin Broadcasts</b> (we will extremely rarely DM you if you own a server running Daedalus, only in situations that require your immediate
            attention)
        </span>
    </div>
</Panel>
