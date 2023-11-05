<script lang="ts">
    import { page } from "$app/stores";
    import LeftNavLayout from "$lib/components/LeftNavLayout.svelte";
    import RequireLogin from "$lib/components/RequireLogin.svelte";

    $: links = [
        { link: "/account", icon: "gear", label: "Account Settings" },
        { link: "/account/premium", icon: "crown", label: "Premium" },
        { link: "/account/appeal", icon: "message", label: "Appeal Server Bans" },
    ].map((x) => ({ ...x, selected: x.link === $page.url.pathname }));
</script>

<RequireLogin>
    <LeftNavLayout {links}><slot /></LeftNavLayout>
</RequireLogin>
