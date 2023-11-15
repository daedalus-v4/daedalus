<script lang="ts">
    import { defaultEmbed, defaultField } from "$lib/modules/utils";
    import { insert, swap, without } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";
    import type { FEMessageData } from "shared";
    import Button from "./Button.svelte";
    import Icon from "./Icon.svelte";
    import Panel from "./Panel.svelte";

    export let message: FEMessageData;
    export let isStatic: boolean;
</script>

<div class="flex flex-col gap-4">
    <h2 class="h2">Content</h2>
    <textarea rows="2" class="textarea" bind:value={message.content} />
    {#each message.embeds as embed, index}
        {@const closeAuthor = embed._meta.closeAuthor ?? !Object.values(embed.author).some((x) => x)}
        {@const closeFields = embed._meta.closeFields ?? embed.fields.length === 0}
        {@const closeImages = embed._meta.closeImages ?? (!embed.image.url && !embed.thumbnail.url)}
        {@const closeFooter = embed._meta.closeFooter ?? !Object.values(embed.footer).some((x) => x)}

        <Panel>
            <span class="w-full flex justify-between">
                <button class="btn px-0 py-2" on:click={() => (embed._meta.close = !embed._meta.close)}>
                    <h3 class="h3 flex items-center gap-2">
                        <div class="{embed._meta.close ? '-rotate-90' : ''} transition-rotate duration-100">
                            <Icon icon="angle-down" class="text-sm" />
                        </div>
                        Embed {index + 1}: {embed.title}
                    </h3>
                </button>
                <span class="flex">
                    {#if index !== 0}
                        <button class="p-2 text-surface-500 dark:text-surface-300" on:click={() => (message.embeds = swap(message.embeds, index - 1, index))}>
                            <Icon icon="angle-up" />
                        </button>
                    {/if}
                    {#if index !== message.embeds.length - 1}
                        <button class="p-2 text-surface-500 dark:text-surface-300" on:click={() => (message.embeds = swap(message.embeds, index, index + 1))}>
                            <Icon icon="angle-down" />
                        </button>
                    {/if}
                    <button
                        class="p-2 text-surface-500 dark:text-surface-300"
                        on:click={() => (message.embeds = insert(message.embeds, index, structuredClone(embed)))}
                    >
                        <Icon icon="clone" />
                    </button>
                    <button class="p-2 text-error-400" on:click={() => (message.embeds = without(message.embeds, index))}>
                        <Icon icon="trash" />
                    </button>
                </span>
            </span>
            <div class="{embed._meta.close ? 'hidden' : ''} w-full">
                <div class="flex items-center gap-2 mb-4">
                    <h4 class="h4">Color:</h4>
                    <span>
                        <select class="select" bind:value={embed.colorMode}>
                            <option value="guild">Use Guild Default</option>
                            {#if !isStatic}
                                <option value="member">Use Member Highlight Color</option>
                                <option value="user">Use User Highlight Color</option>
                            {/if}
                            <option value="fixed">Use Fixed Color</option>
                        </select>
                    </span>
                    <span class="{embed.colorMode === 'guild' ? 'hidden' : ''} flex items-center gap-2">
                        {#if embed.colorMode !== "fixed"}
                            <span class="whitespace-nowrap">or default to</span>
                        {/if}
                        <div class="flex items-center">
                            <input type="color" class="input" bind:value={embed.color} />
                        </div>
                        <input type="text" class="input" bind:value={embed.color} />
                    </span>
                </div>
                <button class="btn block px-0 py-2" on:click={() => (embed._meta.closeAuthor = !closeAuthor)}>
                    <h4 class="h4 flex items-center gap-2">
                        <div class="{closeAuthor ? '-rotate-90' : ''} transition-rotate duration-100">
                            <Icon icon="angle-down" class="text-sm" />
                        </div>
                        Author
                    </h4>
                </button>
                <div class="{closeAuthor ? 'hidden' : ''} my-2 w-full grid lg:grid-cols-2 gap-4">
                    <label style="grid-column: 1 / -1">
                        Author Name
                        <input type="text" class="input" bind:value={embed.author.name} />
                    </label>
                    <label>
                        Author Icon URL
                        <input type="text" class="input" bind:value={embed.author.iconURL} />
                    </label>
                    <label>
                        Author URL
                        <input type="text" class="input" bind:value={embed.author.url} />
                    </label>
                </div>
                <button class="btn block px-0 py-2" on:click={() => (embed._meta.closeBody = !embed._meta.closeBody)}>
                    <h4 class="h4 flex items-center gap-2">
                        <div class="{embed._meta.closeBody ? '-rotate-90' : ''} transition-rotate duration-100">
                            <Icon icon="angle-down" class="text-sm" />
                        </div>
                        Body
                    </h4>
                </button>
                <div class="{embed._meta.closeBody ? 'hidden' : ''} my-2 w-full grid gap-4">
                    <label>
                        Title
                        <input type="text" class="input" bind:value={embed.title} />
                    </label>
                    <label>
                        Description
                        <input type="text" class="input" bind:value={embed.description} />
                    </label>
                    <label>
                        URL
                        <input type="text" class="input" bind:value={embed.url} />
                    </label>
                </div>
                <button class="btn block px-0 py-2" on:click={() => (embed._meta.closeFields = !closeFields)}>
                    <h4 class="h4 flex items-center gap-2">
                        <div class="{closeFields ? '-rotate-90' : ''} transition-rotate duration-100">
                            <Icon icon="angle-down" class="text-sm" />
                        </div>
                        Fields
                    </h4>
                </button>
                <div class="{closeFields ? 'hidden' : ''} my-2 w-full grid gap-4">
                    {#each embed.fields as field, fi}
                        <span class={embed.fields.length < 25 ? "" : "hidden"}>
                            <Button variant="primary" on:click={() => (embed.fields = insert(embed.fields, fi, defaultField()))}>
                                <Icon icon="plus" /> Add Field
                            </Button>
                        </span>
                        <Panel>
                            <span class="w-full flex justify-between">
                                <button class="btn px-0 py-2" on:click={() => (field._meta.close = !field._meta.close)}>
                                    <h3 class="h3 flex items-center gap-2">
                                        <div class="{field._meta.close ? '-rotate-90' : ''} transition-rotate duration-100">
                                            <Icon icon="angle-down" class="text-sm" />
                                        </div>
                                        Field {fi + 1}: {field.name}
                                    </h3>
                                </button>
                                <span class="flex">
                                    {#if fi !== 0}
                                        <button
                                            class="p-2 text-surface-500 dark:text-surface-300"
                                            on:click={() => (embed.fields = swap(embed.fields, fi - 1, fi))}
                                        >
                                            <Icon icon="angle-up" />
                                        </button>
                                    {/if}
                                    {#if fi !== embed.fields.length - 1}
                                        <button
                                            class="p-2 text-surface-500 dark:text-surface-300"
                                            on:click={() => (embed.fields = swap(embed.fields, fi, fi + 1))}
                                        >
                                            <Icon icon="angle-down" />
                                        </button>
                                    {/if}
                                    <button
                                        class="p-2 text-surface-500 dark:text-surface-300"
                                        on:click={() => (embed.fields = insert(embed.fields, fi, structuredClone(field)))}
                                    >
                                        <Icon icon="clone" />
                                    </button>
                                    <button class="p-2 text-error-400" on:click={() => (embed.fields = without(embed.fields, fi))}>
                                        <Icon icon="trash" />
                                    </button>
                                </span>
                            </span>
                            <div class="{field._meta.close ? 'hidden' : ''} w-full grid gap-4">
                                <label>
                                    Field Name
                                    <input type="text" class="input" bind:value={field.name} />
                                </label>
                                <label>
                                    Field Value
                                    <input type="text" class="input" bind:value={field.value} />
                                </label>
                                <span class="flex items-center gap-4">
                                    <SlideToggle name="" size="sm" bind:checked={field.inline} />
                                    Inline
                                </span>
                            </div>
                        </Panel>
                    {/each}
                    <span class={embed.fields.length < 25 ? "" : "hidden"}>
                        <Button variant="primary" on:click={() => (embed.fields = [...embed.fields, defaultField()])}>
                            <Icon icon="plus" /> Add Field
                        </Button>
                    </span>
                </div>
                <button class="btn block px-0 py-2" on:click={() => (embed._meta.closeImages = !closeImages)}>
                    <h4 class="h4 flex items-center gap-2">
                        <div class="{closeImages ? '-rotate-90' : ''} transition-rotate duration-100">
                            <Icon icon="angle-down" class="text-sm" />
                        </div>
                        Images
                    </h4>
                </button>
                <div class="{closeImages ? 'hidden' : ''} my-2 w-full grid gap-4">
                    <label>
                        Image URL
                        <input type="text" class="input" bind:value={embed.image.url} />
                    </label>
                    <label>
                        Thumbnail URL
                        <input type="text" class="input" bind:value={embed.thumbnail.url} />
                    </label>
                </div>
                <button class="btn block px-0 py-2" on:click={() => (embed._meta.closeFooter = !closeFooter)}>
                    <h4 class="h4 flex items-center gap-2">
                        <div class="{closeFooter ? '-rotate-90' : ''} transition-rotate duration-100">
                            <Icon icon="angle-down" class="text-sm" />
                        </div>
                        Images
                    </h4>
                </button>
                <div class="{closeFooter ? 'hidden' : ''} my-2 w-full grid gap-4">
                    <label>
                        Footer Text
                        <input type="text" class="input" bind:value={embed.image.url} />
                    </label>
                    <label>
                        Footer Icon URL
                        <input type="text" class="input" bind:value={embed.thumbnail.url} />
                    </label>
                    <span class="flex items-center gap-4">
                        <SlideToggle name="" size="sm" bind:checked={embed.showTimestamp} />
                        Show Timestamp of Post
                    </span>
                </div>
            </div>
        </Panel>
    {/each}
    <span class={message.embeds.length < 10 ? "" : "hidden"}>
        <Button variant="primary" on:click={() => (message.embeds = [...message.embeds, defaultEmbed()])}><Icon icon="plus" /> Add Embed</Button>
    </span>
</div>
