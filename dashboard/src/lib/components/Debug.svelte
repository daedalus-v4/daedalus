<script lang="ts">
    import { CodeBlock } from "@skeletonlabs/skeleton";

    export let data: unknown;
</script>

<CodeBlock language="json" code={JSON.stringify(data, undefined, 4)} />
