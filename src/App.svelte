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
    const miscData: NodeList = document.querySelectorAll('p');
    const title: string = miscData[0].textContent;

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
                if (value.textContent.includes('Negative Prompt:')) {
                    imageGen.negativePrompt = value.textContent.replace("Negative Prompt: ", '');
                } else {
                    imageGen.prompt = value.textContent.replace("Prompt: ", '');
                }
            }

            if (value.textContent.includes('Style:')) {
                let valueNodes: NodeList = value.querySelectorAll('b');
                imageGen.style = valueNodes[0].textContent;
                imageGen.performance = valueNodes[1].textContent;
            }

            if (value.textContent.includes('Resolution:')) {
                let valueNodes: NodeList = value.querySelectorAll('b');

                let resolution: string[] = valueNodes[0].textContent.replace(/[()]/g, '').split(', ');

                imageGen.sharpness = parseInt(valueNodes[1].textContent);

                imageGen.resolution = [parseInt(resolution[0]), parseInt(resolution[1])];
            }

            if (value.textContent.includes('Base Model:')) {
                let valueNodes: NodeList = value.querySelectorAll('b');
                imageGen.baseModel = valueNodes[0].textContent;
                imageGen.refinerModel = valueNodes[1].textContent;
            }

            if (value.textContent.includes('Seed:')) {
                let valueNodes: NodeList = value.querySelectorAll('b');
                imageGen.seed = valueNodes[0].textContent;
            }
        });

        images.push(imageGen);
        node.remove();
    });

    console.log(images);

    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    }
</script>


<style>
    .body {
        text-align: center;
    }
</style>