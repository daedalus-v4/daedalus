<script lang="ts">
    import { page } from "$app/stores";
    import EmojiSelectorModal from "$lib/components/EmojiSelectorModal.svelte";
    import LeftNavLayout from "$lib/components/LeftNavLayout.svelte";
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
        ...["logging", "welcome", "supporter-announcements", "xp", "reaction-roles"].map((mid) => ({
            link: `/manage/${id}/${mid}`,
            icon: modules[mid].icon ?? "gear",
            label: modules[mid].name,
            selected: moduleParam === mid,
        })),
    ];
</script>

<EmojiSelectorModal />
<LeftNavLayout {links}><slot /></LeftNavLayout>
