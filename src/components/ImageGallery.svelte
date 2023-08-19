<script lang="ts">
    import type ImageGeneration from "../types/ImageGeneration";
    import ImageGenerationDetails from "./ImageGenerationDetails.svelte";
    import ExpandImage from "./ExpandImage.svelte";

    export let images: ImageGeneration[] = [];

    export let title: string = '';

    let imagesPerRow: number = 5;

    let selectedImage: ImageGeneration = images[0];

    let expand = false;

    function expandImage(image: ImageGeneration) {
        selectedImage = image;
        expand = true;
    }

    function toggleFullscreen() {
        if (!window.screenTop && !window.screenY) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
        }

        let elem: HTMLElement = document.body;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
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
        <nav class="flex justify-between items-center absolute top-0 inset-x-0 w-full bg-gradient-to-b from-indigo-950 to-transparent py-3 px-6">
            <h1 class="text-lg text-neutral-400 font-bold">Fooocus Gallery</h1>
            <h2 class="text-lg text-neutral-400 font-bold">{ title.replace("Fooocus Log", "").replace(" (private)", "") }</h2>
            <div class="flex gap-2">
                <div class="flex flex-col justify-between items-center">
                    <label for="cell-size" class="text-neutral-400 text-sm">Image size</label>
                    <input type="range" id="cell-size" class="accent-neutral-800 rounded text-neutral-950" min="1" max="10" bind:value={imagesPerRow}>
                </div>
                <button on:click={() => toggleFullscreen()}
                        class="text-neutral-400 hover:text-neutral-300" title="Full screen">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-neutral-400" viewBox="0 0 24 24" stroke-width="1.5"
                         stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M3 16m0 1a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1z" />
                        <path d="M4 12v-6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-6" />
                        <path d="M12 8h4v4" />
                        <path d="M16 8l-5 5" />
                    </svg>
                </button>
            </div>
        </nav>
        <div class="flex mx-auto items-center gap-6 px-3 h-[95%] mt-10">
            <div class="w-1/3 h-full flex items-center">
                <ImageGenerationDetails image={selectedImage} />
            </div>
            <div class="gallery grid gap-6 overflow-y-scroll overflow-x-hidden px-6 py-6 h-full border-l-2 border-indigo-950"
                 style="grid-template-columns: repeat({10 - imagesPerRow}, minmax(0, 1fr));"        
            >
                {#each images as image}
                    <div id={image.fileName}
                         class="flex justify-between items-center">
                        <div class="relative group">
                            <img on:click={() => selectedImage = image} on:error={() => document.getElementById(image.fileName).style.display = 'none'}
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