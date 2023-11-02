<script lang="ts">
    import { permissionModalStore } from "$lib/stores.js";
    import { permissions } from "shared";
    import Modal from "./Modal.svelte";
    import P from "./P.svelte";

    let description: string;
    $: $permissionModalStore && (description = permissions[$permissionModalStore as keyof typeof permissions].description);
</script>

<Modal z={80} open={$permissionModalStore !== null} on:close={() => ($permissionModalStore = null)}>
    <div class="h-full grid items-center justify-center">
        <P>{@html description}</P>
    </div>
</Modal>
