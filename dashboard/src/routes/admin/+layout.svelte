<script lang="ts">
    import { page } from "$app/stores";
    import LeftNavLayout from "$lib/components/LeftNavLayout.svelte";
    import Redirect from "$lib/components/Redirect.svelte";

    $: path = `/${$page.url.pathname.split("/").slice(2).join("/")}`;
    $: links = [
        { link: "/admin", icon: "home", label: "Admin Home", selected: path === "/" },
        { link: "/admin/customers", icon: "dollar-sign", label: "Customers", selected: path === "/customers" },
    ];
</script>

{#if $page.data.user?.admin}
    <LeftNavLayout {links}>
        <slot />
    </LeftNavLayout>
{:else}
    <Redirect to="/" />
{/if}
