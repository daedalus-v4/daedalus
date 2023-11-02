<script lang="ts">
    import { page } from "$app/stores";
    import A from "$lib/components/A.svelte";
    import Button from "$lib/components/Button.svelte";
    import UnderConstruction from "$lib/components/UnderConstruction.svelte";

    $: enabled = $page.data.enabled;
    $: missing = $page.data.missing;

    let enabling = false;

    async function enable() {
        enabling = true;

        try {
            const request = await fetch(`/manage/${$page.params.id}/enable/${$page.url.pathname.split("/")[3]}`, { method: "PUT" });
            if (!request.ok) throw 0;

            enabled = true;
        } catch (e) {
            console.log(e);
            alert("An error occurred; check your network connection and ensure your permissions have not changed.");
        }

        enabling = false;
    }
</script>

{#if missing}
    <UnderConstruction />
{:else}
    {#if !enabled}
        <div class="card p-4 bg-error-300 dark:bg-error-400/40 flex items-center gap-2">
            <span>This module is disabled. You can manage module settings <A to="/manage/{$page.params.id}/modules-permissions">here</A>.</span>
            <Button disabled={enabling} on:click={enable}>{enabling ? "Enabling..." : "Enable Module"}</Button>
        </div>
    {/if}

    <slot />
{/if}
