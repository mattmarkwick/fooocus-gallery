<script lang="ts">
    import type ImageGeneration from "../types/ImageGeneration";
    import styles from "../helpers/Styles";

    export let image: ImageGeneration;

    let copiedPrompt: boolean = false;
    let copiedNegativePrompt: boolean = false;
    let copiedSeed: boolean = false;
    let copiedPositiveStyle: boolean = false;
    let copiedNegativeStyle: boolean = false;
    let copiedPromptWithStyle: boolean = false;
    let copiedNegativePromptWithStyle: boolean = false;

    let showStyle: boolean = false;

    function copyPrompt() {
        navigator.clipboard.writeText(image.prompt);
        copiedPrompt = true;
        setTimeout(() => {
            copiedPrompt = false;
        }, 2000);
    }

    function copyNegativePrompt() {
        navigator.clipboard.writeText(image.negativePrompt);
        copiedNegativePrompt = true;
        setTimeout(() => {
            copiedNegativePrompt = false;
        }, 2000);
    }

    function copySeed() {
        navigator.clipboard.writeText(image.seed);
        copiedSeed = true;
        setTimeout(() => {
            copiedSeed = false;
        }, 2000);
    }

    function copyPositiveStyle() {
        navigator.clipboard.writeText(getStylePrompt(image.style).prompt);
        copiedPositiveStyle = true;
        setTimeout(() => {
            copiedPositiveStyle = false;
        }, 2000);
    }

    function copyNegativeStyle() {
        navigator.clipboard.writeText(getStylePrompt(image.style).negativePrompt);
        copiedNegativeStyle = true;
        setTimeout(() => {
            copiedNegativeStyle = false;
        }, 2000);
    }

    function copyPromptWithStyle() {
        navigator.clipboard.writeText(getStylePrompt(image.style).prompt.replace('{prompt}', image.prompt));
        copiedPromptWithStyle = true;
        setTimeout(() => {
            copiedPromptWithStyle = false;
        }, 2000);
    }

    function copyNegativePromptWithStyle() {
        navigator.clipboard.writeText(image.negativePrompt + " " + getStylePrompt(image.style).negativePrompt);
        copiedNegativePromptWithStyle = true;
        setTimeout(() => {
            copiedNegativePromptWithStyle = false;
        }, 2000);
    }

    function getStylePrompt(name) {
        return styles.find(style => {
            return style.name === name;
        });
    }
</script>

<div class="flex flex-col flex-0 w-full gap-4 py-3">
    <div class="flex flex-col justify-center w-full group">
        <p class="text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300">
            Filename
        </p>
        <p class="text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300">
            {image.fileName}
        </p>
    </div>
    <div class="flex flex-col justify-center w-full group">
        <div class="flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300">
            <p>Prompt</p>
            <button on:click={() => copyPrompt()} title="Copy prompt"
                class="relative p-1 rounded-lg border border-transparent hover:border-neutral-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                {#if copiedPrompt}
                    <div class="absolute -right-12 top-0 translate-x-full bg-emerald-900 z-20 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap">
                        Copied prompt!
                    </div>
                {/if}
            </button>
            <button on:click={() => copyPromptWithStyle()} title="Copy prompt with style"
                class="relative p-1 flex items-center rounded-lg border border-transparent hover:border-neutral-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 -ml-1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6" />
                </svg>
                {#if copiedPromptWithStyle}
                    <div class="absolute -right-2 top-0 translate-x-full bg-emerald-900 z-20 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap">
                        Copied prompt with style!
                    </div>
                {/if}
            </button>
        </div>
        <p class="text-neutral-400 font-bold leading-tight group-hover:text-neutral-300">
            {image.prompt}
        </p>
    </div>
    <div class="flex flex-col justify-center w-full group">
        <div class="flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300">
            <p>Negative Prompt</p>
            <button on:click={() => copyNegativePrompt()}
                class="relative p-1 rounded-lg border border-transparent hover:border-neutral-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                {#if copiedNegativePrompt}
                    <div class="absolute -right-12 top-0 translate-x-full bg-emerald-900 z-20 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap">
                        Copied negative prompt!
                    </div>
                {/if}
            </button>
            <button on:click={() => copyNegativePromptWithStyle()} title="Copy prompt with style"
                class="relative p-1 flex items-center rounded-lg border border-transparent hover:border-neutral-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 -ml-1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6" />
                </svg>
                {#if copiedNegativePromptWithStyle}
                    <div class="absolute -right-2 top-0 translate-x-full bg-emerald-900 z-20 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap">
                        Copied negative prompt with style!
                    </div>
                {/if}
            </button>
        </div>
        <p class="text-neutral-400 font-bold leading-tight group-hover:text-neutral-300">
            {image.negativePrompt}
        </p>
    </div>
    <div class="flex flex-col justify-center w-full group">
        <div class="flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300">
            <p>Style</p>
            <button on:click={() => showStyle = !showStyle}
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
        <p class="text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300">
            {image.style}
        </p>
        {#if showStyle}
            <div class="flex flex-col justify-center w-full group p-2 rounded-lg border border-neutral-500 mt-2">
                <div class="flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300">
                    <p>Style Positive</p>
                    <button on:click={() => copyPositiveStyle()}
                        class="relative p-1 rounded-lg border border-transparent hover:border-neutral-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                        </svg>
                        {#if copiedPositiveStyle}
                            <div class="absolute -right-2 top-0 translate-x-full bg-emerald-900 z-20 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap">
                                Copied positive style!
                            </div>
                        {/if}
                    </button>
                </div>
                <p class="text-neutral-400 text-xs leading-tight group-hover:text-neutral-300">
                    {getStylePrompt(image.style).prompt}
                </p>
                <div class="flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300 mt-2">
                    <p>Style Negative</p>
                    <button on:click={() => copyNegativeStyle()}
                        class="relative p-1 rounded-lg border border-transparent hover:border-neutral-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                        </svg>
                        {#if copiedNegativeStyle}
                            <div class="absolute -right-2 top-0 translate-x-full bg-emerald-900 z-20 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap">
                                Copied negative style!
                            </div>
                        {/if}
                    </button>
                </div>
                <p class="text-neutral-400 text-xs leading-tight group-hover:text-neutral-300">
                    {getStylePrompt(image.style).negativePrompt}
                </p>
            </div>
        {/if}
    </div>
    <div class="flex flex-col justify-center w-full group">
        <div class="flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300">
            <p>Seed</p>
            <button on:click={() => copySeed()}
                class="relative p-1 rounded-lg border border-transparent hover:border-neutral-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                {#if copiedSeed}
                    <div class="absolute -right-2 top-0 translate-x-full bg-emerald-900 z-20 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap">
                        Copied seed!
                    </div>
                {/if}
            </button>
        </div>
        <p class="text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300">
            {image.seed}
        </p>
    </div>
    <div class="flex flex-col justify-center w-full group">
        <p class="text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300">
            Performance
        </p>
        <p class="text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300">
            {image.performance}
        </p>
    </div>
    <div class="flex flex-col justify-center w-full group">
        <p class="text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300">
            Resolution
        </p>
        <p class="text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300">
            {image.resolution[0]} x {image.resolution[1]}
        </p>
    </div>
    <div class="flex flex-col justify-center w-full group">
        <p class="text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300">
            Sharpness
        </p>
        <p class="text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300">
            {image.sharpness}
        </p>
    </div>
    <div class="flex flex-col justify-center w-full group">
        <p class="text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300">
            Base Model
        </p>
        <p class="text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300">
            {image.baseModel}
        </p>
    </div>
    <div class="flex flex-col justify-center w-full group">
        <p class="text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300">
            Refiner Model
        </p>
        <p class="text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300">
            {image.refinerModel}
        </p>
    </div>
</div>