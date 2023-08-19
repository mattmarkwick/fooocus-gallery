<script lang="ts">
    import type ImageGeneration from "../types/ImageGeneration";
    import styles from "../helpers/Styles";

    export let image: ImageGeneration;

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
    <div class="relative flex flex-col justify-center items-center gap-3 group">
        <div class="justify-center items-center absolute -left-28 flex gap-2">
            <div on:click={() => navigator.clipboard.writeText(image.prompt)} 
                    class="flex justify-center items-center h-7 text-gray-400 group-hover:text-gray-300 rounded-lg p-1 border border-gray-500 group-hover:bg-gray-800 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                        class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
            </div>
            <p class="text-5xl text-gray-400 font-thin ml-1 -mt-3">
                &#123;
            </p>
        </div>
        <div class="relative flex flex-col justify-center w-full group">
            <div on:click={() => navigator.clipboard.writeText(image.prompt)}
                class="absolute -left-10 text-gray-400  hover:text-gray-300 rounded-lg p-1 border border-gray-500 hover:bg-gray-800 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
            </div>
            <p class="text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300">
                Prompt
            </p>
            <p class="text-neutral-400 font-bold leading-tight group-hover:text-neutral-300">
                {image.prompt}
            </p>
        </div>
        <div class="relative flex flex-col justify-center w-full group">
            <div on:click={() => navigator.clipboard.writeText(image.style)}
                class="absolute -left-10 text-gray-400  hover:text-gray-300 rounded-lg p-1 border border-gray-500 hover:bg-gray-800 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
            </div>
            <p class="text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300">
                Style
            </p>
            <p class="text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300">
                {image.style}
            </p>
        </div>
    </div>
    <div class="relative flex flex-col justify-center w-full group">
        <div on:click={() => navigator.clipboard.writeText(image.negativePrompt)}
            class="absolute -left-10 top-1/2 text-gray-400 -translate-y-1/2 hover:text-gray-300 rounded-lg p-1 border border-gray-500 hover:bg-gray-800 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
        </div>
        <p class="text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300">
            Negative Prompt
        </p>
        <p class="text-neutral-400 font-bold leading-tight group-hover:text-neutral-300">
            {image.negativePrompt}
        </p>
    </div>
    <div class="relative flex flex-col justify-center w-full group">
        <div on:click={() => navigator.clipboard.writeText(image.seed)}
            class="absolute -left-10 top-1/2 text-gray-400 -translate-y-1/2 hover:text-gray-300 rounded-lg p-1 border border-gray-500 hover:bg-gray-800 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
        </div>
        <p class="text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300">
            Seed
        </p>
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