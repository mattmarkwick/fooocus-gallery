<script lang="ts">
    import type ImageGeneration from "../types/ImageGeneration";
    import ImageGenerationDetails from "./ImageGenerationDetails.svelte";
    import ExpandImage from "./ExpandImage.svelte";

    export let images: ImageGeneration[] = [];

    export let title: string = '';

    let imageSize: number = 25;

    let selectedImage: ImageGeneration = images[0];

    let expand = false;

    function expandImage(image: ImageGeneration) {
        selectedImage = image;
        expand = true;
    }

    document.body.addEventListener('keydown', (event: KeyboardEvent) => {
        let index = images.indexOf(selectedImage);
 
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                if (index > 0) {
                    selectedImage = images[index - 1];
                }
                break;
            case 'ArrowRight':
                event.preventDefault();
                if (index < images.length - 1) {
                    selectedImage = images[index + 1];
                }
                break;
            case ' ':
                if (expand) {
                    event.preventDefault();
                    expand = false;
                } else {
                    event.preventDefault();
                    expandImage(selectedImage);
                }
                break;
            case 'Enter':
                event.preventDefault();
                expandImage(selectedImage);
                break;
            case 'Escape':
                event.preventDefault();
                expand = false;
                break;
        }
    });
</script>

<div class="relative flex flex-col h-full w-full overflow-y-hidden">
    <div class="py-20 px-44 flex flex-1 w-screen h-full justify-center bg-gradient-to-b from-neutral-900 to-neutral-950">
        <nav class="absolute top-0 inset-x-0 w-full h-16 bg-gradient-to-b from-neutral-950 to-transparent px-6 py-3 text-center">
            <h1 class="text-lg text-neutral-400 font-bold">{ title }</h1>
        </nav>
        <div class="flex mx-auto items-center gap-6 px-3 h-[95%]">
            <div class="w-1/3 h-full flex items-center">
                <ImageGenerationDetails image={selectedImage} />
            </div>
            <div class="gallery grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-scroll overflow-x-hidden px-6 py-6 h-full">
                {#each images as image}
                    <div class="flex justify-between items-center">
                        <div class="relative group">
                            <img on:click={() => selectedImage = image}
                                 src={image.imgSource} alt="{image.fileName}" width="{image.resolution[0]}" height="{image.resolution[1]}"
                                 class="rounded shadow-lg h-auto max-w-full cursor-pointer hover:opacity-75 transition ease-in-out duration-150
                                 {selectedImage === image ? 'ring-2 ring-white ring-offset-4 ring-offset-neutral-900' : ''}"
                            />
                            <div class="hidden group-hover:flex transition ease-in-out duration-150 absolute z-20 inset-x-0 bottom-0 w-full bg-neutral-950 opacity-90 py-1 px-6 justify-center items-center">
                                <div on:click={() => expandImage(image)}
                                     class="text-gray-300 hover:text-gray-100 border border-transparent hover:border-gray-100 p-1 rounded-lg cursor-pointer">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
        {#if expand}
            <ExpandImage image={selectedImage} bind:expand={expand} />
        {/if}
    </div>
</div>

<style>
    .gallery::-webkit-scrollbar{
        display: none;
    }
    .gallery {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>