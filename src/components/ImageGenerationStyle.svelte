<script lang="ts">
    import { getStylePrompt } from "../helpers/Styles";
    import type ImageGeneration from "../types/ImageGeneration";

    let copiedPositiveStyle: boolean = false;
    let copiedNegativeStyle: boolean = false;
    let showStyle: boolean = false;

    export let image: ImageGeneration;
    export let style: string;

    function copyPositiveStyle() {
        navigator.clipboard.writeText(getStylePrompt(name, image).prompt);
        copiedPositiveStyle = true;
        setTimeout(() => {
            copiedPositiveStyle = false;
        }, 1000);
    }

    function copyNegativeStyle() {
        navigator.clipboard.writeText(getStylePrompt(name, image).negative_prompt);
        copiedNegativeStyle = true;
        setTimeout(() => {
            copiedNegativeStyle = false;
        }, 1000);
    }
</script>

<div>
    <div class="flex gap-2 items-center">
        <p class="text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300">
            {style}
        </p>
        <button on:click={() => showStyle = !showStyle} title="Toggle style visibility"
            class="relative p-1 rounded-lg border border-transparent hover:border-neutral-400">
            {#if !showStyle}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            {/if}
            {#if showStyle}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
            {/if}
        </button>
    </div>
    <div class="flex flex-col gap-2 mb-1">
        {#if showStyle}
            <div class="flex flex-col justify-center w-full group p-2 rounded-lg border border-neutral-500 mt-2">
                <div class="flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300">
                    <p>Style Positive</p>
                    <button on:click={() => copyPositiveStyle()} title="Copy positive style"
                        class="relative p-1 rounded-lg border border-transparent hover:border-neutral-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                        </svg>
                        {#if copiedPositiveStyle}
                            <div class="absolute -top-8 -translate-x-14 bg-emerald-900 z-40 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap">
                                Copied positive style!
                            </div>
                        {/if}
                    </button>
                </div>
                <p class="text-neutral-400 text-xs leading-tight group-hover:text-neutral-300">
                    {getStylePrompt(style, image).prompt }
                </p>
                <div class="flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300 mt-2">
                    <p>Style Negative</p>
                    <button on:click={() => copyNegativeStyle()} title="Copy negative style"
                        class="relative p-1 rounded-lg border border-transparent hover:border-neutral-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                        </svg>
                        {#if copiedNegativeStyle}
                            <div class="absolute -top-8 -translate-x-14 bg-emerald-900 z-40 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap">
                                Copied negative style!
                            </div>
                        {/if}
                    </button>
                </div>
                <p class="text-neutral-400 text-xs leading-tight group-hover:text-neutral-300">
                    {getStylePrompt(style, image).negativePrompt}
                </p>
            </div>
        {/if}
    </div>
</div>