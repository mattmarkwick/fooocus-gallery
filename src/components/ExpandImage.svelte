<script lang="ts">
    import type ImageGeneration from "../types/ImageGeneration";
    export let image: ImageGeneration;
    import { clickOutside } from "../helpers/ClickOutside";

    export let expand = false;

</script>

<div class="relative z-30" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-neutral-950 bg-opacity-95 transition-opacity"></div>
  
    <div class="fixed inset-0 z-10 overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        
        <div use:clickOutside on:click_outside={() => expand = false} class="relative transform overflow-hidden rounded-lg shadow-xl transition-all">
          <div class="sm:flex sm:items-start">
                <img src={image.imgSource} alt="{image.fileName}" width="{image.resolution[0]}" height="{image.resolution[1]}"
                    class="rounded shadow-lg h-auto max-w-full"
                />
          </div>
        </div>
      </div>
    </div>
  </div>