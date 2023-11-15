<script lang="ts" context="module">
    const types = { open: "Opened by", incoming: "Incoming from", outgoing: "Outgoing to", close: "Closed by", internal: "Internal by" };
</script>

<script lang="ts">
    import { page } from "$app/stores";
    import Container from "$lib/components/Container.svelte";
    import Debug from "$lib/components/Debug.svelte";
    import Header from "$lib/components/Header.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import { SlideToggle } from "@skeletonlabs/skeleton";
    import type { DbModmailThread } from "shared";
    import { onMount } from "svelte";

    const thread: DbModmailThread = $page.data.thread;
    let tags: Record<string, string> = $page.data.tags;

    onMount(() => {
        $page.data.streamed.tags.then((x: Record<string, string>) => (tags = Object.assign(tags, x)));
    });

    let internal: boolean = false;
    let onlyRecent: boolean = true;

    let recentCutoff = thread.messages.length - 1;
    while (recentCutoff > 0 && thread.messages[recentCutoff].type !== "open") recentCutoff--;
</script>

<Header>
    <p class="text-3xl"><b>Daedalus</b> Dashboard</p>
    <p class="text-xl text-primary-700 dark:text-primary-300">
        Modmail Thread with <b>{tags[thread.user] ?? "Loading User..."}</b> in <b>{$page.data.guildName ?? "[unknown guild]"}</b>
    </p>
</Header>

<Container>
    <Panel>
        <div class="flex items-center gap-4">
            <SlideToggle name="" size="sm" bind:checked={internal} />
            Show internal messages
        </div>
        <div class="flex items-center gap-4">
            <SlideToggle name="" size="sm" bind:checked={onlyRecent} />
            Only show messages from the last time this thread was opened
        </div>
    </Panel>
    {#each thread.messages as message, index}
        {@const user = message.type === "incoming" ? thread.user : message.author}
        <div class={(onlyRecent && index < recentCutoff) || (!internal && message.type === "internal") ? "hidden" : ""}>
            <br />
            <Panel class={message.type === "internal" ? "opacity-80" : ""}>
                <h4 class="h4 text-surface-700 dark:text-surface-300">
                    {types[message.type]}
                    {tags[user] ?? "Loading User..."}
                    <span class="text-surface-600 dark:text-surface-400">({user}) &mdash; {new Date(message.time).toLocaleString()}</span>
                </h4>
                {#if message.type === "open"}
                    <!-- nothing else to display -->
                {:else if message.type === "incoming" || message.type === "outgoing" || message.type === "internal"}
                    {@const items = [...(message.type === "outgoing" ? message.edits ?? [] : []), message.content]}
                    {#each items as content, index}
                        {#each content
                            .split(/\n+/)
                            .map((x) => x.trim())
                            .filter((x) => x) as block}
                            <P>{block}</P>
                        {/each}
                    {/each}

                    {#if !message.content}
                        <b class="text-surface-400 dark:text-surface-400">(no content)</b>
                    {/if}
                {/if}

                <Debug data={message} />
            </Panel>
        </div>
    {/each}
</Container>
