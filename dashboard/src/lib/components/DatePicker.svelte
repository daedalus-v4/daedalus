<script lang="ts">
    export let timestamp: number;

    $: date = new Date(timestamp);
</script>

<div class="flex items-center gap-1">
    <input
        type="number"
        class="input w-24"
        value={date.getFullYear()}
        on:input={(e) => {
            const value = e.currentTarget.valueAsNumber;
            if (isNaN(value)) return;

            date.setFullYear(value);
            timestamp = date.getTime();
        }}
    />
    <select class="select" value={date.getMonth()} on:input={(e) => (date.setMonth(parseInt(e.currentTarget.value)), (timestamp = date.getTime()))}>
        {#each ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as name, index}
            <option value={index}>{name}</option>
        {/each}
    </select>
    <input
        type="number"
        class="input w-16"
        value={date.getDate()}
        on:input={(e) => {
            const value = e.currentTarget.valueAsNumber;
            if (isNaN(value)) return;

            date.setDate(value);
            timestamp = date.getTime();
        }}
    />
    T
    <input
        type="number"
        class="input w-16"
        value={date.getHours()}
        on:input={(e) => {
            const value = e.currentTarget.valueAsNumber;
            if (isNaN(value)) return;

            date.setHours(value);
            timestamp = date.getTime();
        }}
    />
    :
    <input
        type="number"
        class="input w-16"
        value={date.getMinutes()}
        on:input={(e) => {
            const value = e.currentTarget.valueAsNumber;
            if (isNaN(value)) return;

            date.setMinutes(value);
            timestamp = date.getTime();
        }}
    />
    :
    <input
        type="number"
        class="input w-16"
        value={date.getSeconds()}
        on:input={(e) => {
            const value = e.currentTarget.valueAsNumber;
            if (isNaN(value)) return;

            date.setSeconds(value);
            timestamp = date.getTime();
        }}
    />
</div>
