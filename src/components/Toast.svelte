<script lang="ts">
    import { fly } from 'svelte/transition'
    import { elasticOut, quartOut } from 'svelte/easing'

    export let visable: boolean = false;

    $: {
        if(visable)
            setTimeout(() => visable = false, 3000)
    }

</script>

{#if visable}
    <div 
        class="toast"
        in:fly={{ y: 200, duration: 1000, easing: elasticOut }}
        out:fly={{ y: 200, duration: 1000, easing: quartOut }}
    >
        <slot></slot>
    </div>
{/if}

<style>
    .toast {
        background: white;
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        border: 1px solid var(--color-border-primary);
        padding: 16px;
        border-radius: 4px;
    }
</style>