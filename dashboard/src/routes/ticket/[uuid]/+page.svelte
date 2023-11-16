<script lang="ts" context="module">
    const types = { open: "Opened by", message: "Message by", close: "Closed by" };
</script>

<script lang="ts">
    import { page } from "$app/stores";
    import A from "$lib/components/A.svelte";
    import Button from "$lib/components/Button.svelte";
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import type { DBTicket } from "shared";
    import { onMount } from "svelte";

    const ticket: DBTicket = $page.data.ticket;
    let tags: Record<string, string> = $page.data.tags;

    onMount(() => {
        $page.data.streamed.tags.then((x: Record<string, string>) => (tags = Object.assign(tags, x)));
    });

    const indexes: Record<number, number> = {};
</script>

<Header>
    <p class="text-3xl"><b>Daedalus</b> Dashboard</p>
    <p class="text-xl text-primary-700 dark:text-primary-300">
        Ticket with <b>{tags[ticket.user] ?? "Loading User..."}</b> in <b>{$page.data.guildName ?? "[unknown guild]"}</b>
    </p>
</Header>

<Container>
    {#each ticket.messages as message, index}
        {@const user = message.type === "open" ? ticket.user : message.author}
        <br />
        <Panel>
            <h4 class="h4 text-surface-700 dark:text-surface-300">
                {types[message.type]}
                {tags[user] ?? "Loading User..."}
                <span class="text-surface-600 dark:text-surface-400">({user}) &mdash; {new Date(message.time).toLocaleString()}</span>
                {#if message.type === "message" && message.deleted}
                    <span class="text-error-400 dark:text-error-400">&mdash; deleted</span>
                {/if}
            </h4>
            {#if message.type === "message"}
                {@const items = [message.content, ...(message.edits ?? [])]}
                {@const content = items[indexes[index] ?? items.length - 1]}

                {#each content
                    .split(/\n+/)
                    .map((x) => x.trim())
                    .filter((x) => x) as block}
                    <P>{block}</P>
                {/each}

                {#if !content}
                    <b class="text-surface-400 dark:text-surface-400">(no content)</b>
                {/if}

                {#if items.length > 1}
                    <div class="flex items-center gap-4">
                        This message has been edited.
                        <Button
                            variant="primary-text"
                            disabled={indexes[index] === 0}
                            on:click={() => (indexes[index] = (indexes[index] ?? items.length - 1) - 1)}
                        >
                            <Icon icon="angle-left" />
                        </Button>
                        <span>{(indexes[index] ?? items.length - 1) + 1} / {items.length}</span>
                        <Button variant="primary-text" disabled={indexes[index] === items.length - 1 || !(index in indexes)} on:click={() => indexes[index]++}>
                            <Icon icon="angle-right" />
                        </Button>
                    </div>
                {/if}

                {#if message.attachments?.length > 0}
                    <ul class="list-disc list-inside">
                        {#each message.attachments as { name, url }}
                            <li><A to={url} external>{name}</A></li>
                        {/each}
                    </ul>
                {/if}
            {/if}
        </Panel>
    {/each}
</Container>
