type ImageGeneration = {
    fileName: string,
    prompt: string,
    negativePrompt: string,
    v2Expansion: string,
    styles: Array<string>,
    performance: string,
    resolution: [number, number],
    sharpness: number,
    guidanceScale: number,
    admGuidance: string,
    baseModel: string,
    refinerModel: string,
    refinerSwitch: number,
    sampler: string,
    scheduler: string,
    seed: string,
    loras: Array<[string, number]>
    version: string,
    imgSource: string,
    additionalData: object,
}

export default ImageGeneration;