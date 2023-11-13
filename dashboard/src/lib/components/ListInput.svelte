<script lang="ts">
    import { without } from "$lib/utils";
    import Button from "./Button.svelte";
    import Icon from "./Icon.svelte";
    import P from "./P.svelte";

    export let values: string[] = [];
    export let max: number = Infinity;
    export let check: (x: string) => false | string = () => false;

    let textarea = false;
    let input = "";
    let adding = "";

    function add() {
        const error = check(adding.trim());
        if (error) return alert(error);

        values = [...new Set([...values, adding.trim()])].sort();
        adding = "";
    }
</script>

<Button on:click={() => (textarea = !textarea) && (input = values.map((x) => x.replace(/,/g, "\\,")).join(", "))}>
    {textarea ? "Use interactive mode" : "Use textarea"}
</Button>
{#if values.length > max}
    <P><span class="text-red-500 dark:text-red-400">Error:</span> Max {max} values allowed.</P>
{/if}
{#if textarea}
    <textarea
        rows="4"
        class="textarea"
        value={input}
        on:input={(e) =>
            (values = [
                ...new Set(
                    e.currentTarget.value
                        .trim()
                        .split(/\n+/)
                        .flatMap((line) => line.split(/\s*(?<!\\),\s*/))
                        .filter((x) => x)
                        .map((x) => x.replace(/\\,/g, ",")),
                ),
            ].sort())}
    />
{:else}
    <div class="flex flex-wrap gap-4">
        {#each values as term, index}
            <span
                class="badge px-4 py-2 text-sm flex items-center gap-2 rounded bg-surface-300 dark:bg-surface-600 {check(term)
                    ? 'outline outline-2 outline-red-400 dark:outline-red-500'
                    : ''}"
            >
                <button on:click={() => (values = without(values, index))}>
                    <Icon icon="xmark" />
                </button>
                {term}
            </span>
        {/each}
        <button on:click={() => confirm("Clear all values?") && (values = [])}>
            <span class="badge px-4 py-2 text-sm flex items-center gap-2 rounded bg-surface-300 dark:bg-surface-600 text-red-700 dark:text-red-400">
                <Icon icon="delete-left" />
                Delete All
            </span>
        </button>
    </div>
    <div class="flex gap-4">
        <input
            type="text"
            class="input"
            placeholder={values.length >= max ? "Limit reached." : "Add Item"}
            readonly={values.length >= max}
            bind:value={adding}
            on:keydown={(e) => e.key === "Enter" && add()}
        />
        <Button variant="primary-text" disabled={values.length >= max} on:click={add}><Icon icon="plus" /></Button>
    </div>
{/if}
