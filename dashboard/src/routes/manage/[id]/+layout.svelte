<script lang="ts">
    import { page } from "$app/stores";
    import EmojiSelectorModal from "$lib/components/EmojiSelectorModal.svelte";
    import LeftNavLayout from "$lib/components/LeftNavLayout.svelte";
    import StickerSelectorModal from "$lib/components/StickerSelectorModal.svelte";
    import { modules } from "shared";

    $: id = $page.params.id;
    $: moduleParam = $page.url.pathname.split("/")[3] ?? "-";

    $: links = [
        { link: `/manage/${id}`, icon: "gear", label: "Guild Settings", selected: moduleParam === "-" },
        { link: `/manage/${id}/premium`, icon: "crown", label: "Premium", selected: moduleParam === "premium" },
        {
            link: `/manage/${id}/modules-permissions`,
            icon: "screwdriver-wrench",
            label: "Modules & Permissions",
            selected: moduleParam === "modules-permissions",
        },
        ...[
            "logging",
            "welcome",
            "supporter-announcements",
            "xp",
            "reaction-roles",
            "starboard",
            "automod",
            "sticky-roles",
            "autoroles",
            "custom-roles",
            "stats-channels",
            "autoresponder",
            "modmail",
            "tickets",
            "nukeguard",
            "suggestions",
            "co-op",
            "reddit-feeds",
            "count",
            "giveaways",
            "reports",
            "utility",
        ].map((mid) => ({
            link: `/manage/${id}/${mid}`,
            icon: modules[mid].icon ?? "gear",
            brand: !!modules[mid].brand,
            label: modules[mid].name,
            selected: moduleParam === mid,
        })),
    ];
</script>

<EmojiSelectorModal />
<StickerSelectorModal />

<LeftNavLayout {links}>
    <span class="text-lg text-surface-500 dark:text-surface-300">Managing <b>{$page.data.guildName}</b></span>
    <slot />
</LeftNavLayout>
