<script lang="ts">
    type ImageGeneration = {
        fileName: string,
        prompt: string,
        negativePrompt: string,
        style: string,
        performance: string,
        resolution: [number, number],
        sharpness: number,
        baseModel: string,
        refinerModel: string,
        seed: string,
        imgSource: string,
    }

    const nodes: NodeList = document.querySelectorAll('div');
    const images: ImageGeneration[] = [];

    nodes.forEach((node: HTMLDivElement) => {
        let imageGen: ImageGeneration = {
            fileName: '',
            prompt: '',
            negativePrompt: '',
            style: '',
            performance: '',
            resolution: [0, 0],
            sharpness: 0,
            baseModel: '',
            refinerModel: '',
            seed: '',
            imgSource: '',
        };

        let data: NodeList = node.querySelectorAll('p');
        imageGen.imgSource = node.querySelector('img').src;


        data.forEach((value: HTMLParagraphElement) => {
            if (value.textContent.includes('.png')) {
                imageGen.fileName = value.textContent;
            }

            if (value.textContent.includes('Prompt:')) {
                imageGen.prompt = value.textContent;
            }

            if (value.textContent.includes('Negative Prompt:')) {
                imageGen.negativePrompt = value.textContent;
            }

            if (value.textContent.includes('Style:')) {
                imageGen.style = value.textContent;
            }

            if (value.textContent.includes('Performance:')) {
                imageGen.performance = value.textContent;
            }

            if (value.textContent.includes('Resolution:')) {
                value.textContent.replace('(', '');
                value.textContent.replace(')', '');
                let resolution: string[] = value.textContent.split(', ');
                imageGen.resolution = [parseInt(resolution[0].split(' ')[1]), parseInt(resolution[1])];
            }

            if (value.textContent.includes('Sharpness:')) {
                imageGen.sharpness = parseInt(value.textContent.split(' ')[1]);
            }

            if (value.textContent.includes('Base Model:')) {
                imageGen.baseModel = value.textContent;
            }

            if (value.textContent.includes('Refiner Model:')) {
                imageGen.refinerModel = value.textContent;
            }

            if (value.textContent.includes('Seed:')) {
                imageGen.seed = value.textContent;
            }
        });

        images.push(imageGen);
    });

    console.log(images);
</script>


<style>
    .body {
        text-align: center;
    }
</style>