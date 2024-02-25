<script lang="ts">
    import ImageGallery from "./components/ImageGallery.svelte";
    import { createImageGenObject } from "./helpers/ImageGenFactory";
    import type ImageGeneration from "./types/ImageGeneration";

    let initialised: boolean = false;

    const nodes: NodeList = document.querySelectorAll('.image-container');
    const miscData: NodeList = document.querySelectorAll('p');
    const title: string = miscData[0].textContent;

    const images: ImageGeneration[] = [];

    nodes.forEach((node: HTMLTableElement) => {
        let imageGen: ImageGeneration | null = createImageGenObject(node);

        if (imageGen !== null) {
            images.push(imageGen);
        }
        node.remove();
    });

    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    }

    initialised = true;
</script>

{#if initialised}
    <ImageGallery images={images} title={title} />
{/if}

<style global lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    .hide-scrollbar::-webkit-scrollbar{
        display: none;
    }
    .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>