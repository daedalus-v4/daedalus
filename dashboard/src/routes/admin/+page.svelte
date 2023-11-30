<script lang="ts">
    import { page } from "$app/stores";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
</script>

<Panel>
    <h2 class="h2">Stats</h2>
    <P size="lg">
        <ul class="list-disc pl-4">
            <li class="pl-2">Guilds: <b>{$page.data.guildCount} </b></li>
            <li class="pl-2">Premium Users: <b>{$page.data.premiumUsers}</b></li>
        </ul>
    </P>
</Panel>
