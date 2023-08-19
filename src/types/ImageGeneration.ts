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

export default ImageGeneration;