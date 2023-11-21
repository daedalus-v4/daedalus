<script lang="ts">
    import { page } from "$app/stores";
    import { Avatar } from "@skeletonlabs/skeleton";
</script>

<div class="flex items-center pl-4">
    <Avatar src="https://cdn.discordapp.com/avatars/{$page.data.user.id}/{$page.data.user.avatar}" initials={$page.data.user.global_name[0]} width="w-10" />
    <span class="text-lg opacity-75 p-4">
        Hi, {$page.data.user.global_name}<span class="opacity-50">{$page.data.user.discriminator === "0" ? "" : `#${$page.data.user.discriminator}`}</span>!
    </span>
</div>
