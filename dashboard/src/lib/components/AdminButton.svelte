<script lang="ts">
    import { invalidateAll } from "$app/navigation";
    import { page } from "$app/stores";
    import Button from "./Button.svelte";
    import Icon from "./Icon.svelte";
    import LoggedInAs from "./LoggedInAs.svelte";
    import Modal from "./Modal.svelte";
    import P from "./P.svelte";
    import Panel from "./Panel.svelte";

    let open: boolean = false;
    let impersonateId = $page.data.realUser ? $page.data.user.id : "";

    async function impersonate() {
        const req = await fetch(`/api/admin/impersonate?${new URLSearchParams({ id: impersonateId })}`, { method: "POST" });
        if (!req.ok) return alert(await req.text());

        await invalidateAll();
    }

    async function unimpersonate() {
        const req = await fetch("/api/admin/impersonate", { method: "POST" });
        if (!req.ok) return alert(await req.text());

        await invalidateAll();
    }
</script>

<button
    class="btn-icon fixed h-12 w-12 right-28 bottom-12 bg-surface-400/50 transition-opacity duration-300"
    style="z-index: 50"
    on:click={() => (open = true)}
>
    <Icon icon="screwdriver-wrench" />
</button>

<Modal bind:open max>
    <h2 class="h2">Admin Tools</h2>
    <Panel>
        <h4 class="h4">Impersonation</h4>
        {#if $page.data.realUser}
            <LoggedInAs />
            <P>
                You are currently impersonating <code class="code">{$page.data.user.id}</code>.
            </P>
        {:else}
            <P>You are not currently impersonating a user.</P>
        {/if}
        <div class="flex items-center gap-4">
            <b class="whitespace-nowrap">User ID:</b>
            <input type="text" class="input" bind:value={impersonateId} />
        </div>
        <div class="flex items-center gap-4">
            <Button disabled={!impersonateId.match(/^[1-9][0-9]{16,19}$/)} on:click={impersonate}>Impersonate</Button>
            <Button disabled={!$page.data.realUser} on:click={unimpersonate}>Unimpersonate</Button>
        </div>
    </Panel>
</Modal>
