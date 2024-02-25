
import type ImageGeneration from "../types/ImageGeneration";

export function createImageGenObject(node: HTMLTableElement): ImageGeneration | null {
    let imageGen: ImageGeneration = {
        fileName: '',
        prompt: '',
        negativePrompt: '',
        v2Expansion: '',
        styles: [],
        performance: '',
        resolution: [0, 0],
        sharpness: 0,
        guidanceScale: 4,
        admGuidance: '',
        baseModel: '',
        refinerModel: '',
        refinerSwitch: 0.5,
        sampler: '',
        scheduler: '',
        seed: '',
        loras: [],
        version: '',
        imgSource: '',
        additionalData: {},
    };

    let metadata: Element = node.querySelectorAll('.metadata')[0];
    let data: NodeList = metadata.querySelectorAll('tr');

    imageGen.imgSource = node.querySelector('img').src;

    // checkIfImageExists(imageGen.imgSource, (exists) => {
    //     if (!exists) {
    //         return null;
    //     }
    // });

    let splitFileName = node.querySelector('img').src.split('/');
    imageGen.fileName = splitFileName[splitFileName.length - 1];

    data.forEach((row: HTMLTableRowElement) => {
        let key : string = row.cells[0].textContent;
        let value : string = row.cells[1].textContent;

        if (key.includes('Prompt')) {
            if (key.includes('Negative Prompt')) {
                imageGen.negativePrompt = value;
            } else {
                imageGen.prompt = value;
            }
        }

        if (key.includes('LoRA')) {
            let [loraName, loraValue] = value.split(' : ');
            imageGen.loras.push([loraName, parseFloat(loraValue)]);
        }

        switch (key) {
            case 'Fooocus V2 Expansion':
                imageGen.v2Expansion = value;
                break;
            case 'Styles':
                imageGen.styles = JSON.parse(value.replace(/'/g, '"'));
                break;
            case 'Performance':
                imageGen.performance = value;
                break;
            case 'Resolution':
                let resolution: string[] = value.replace(/[()]/g, '').split(', ');
                imageGen.resolution = [parseInt(resolution[0]), parseInt(resolution[1])];
                break;
            case 'Sharpness':
                imageGen.sharpness = parseInt(value);
                break;
            case 'Guidance Scale':
                imageGen.guidanceScale = parseInt(value);
                break;
            case 'ADM Guidance':
                imageGen.admGuidance = value;
                break;
            case 'Base Model':
                imageGen.baseModel = value;
                break;
            case 'Refiner Model':
                imageGen.refinerModel = value;
                break;
            case 'Refiner Switch':
                imageGen.refinerSwitch = parseFloat(value);
                break;
            case 'Sampler':
                imageGen.sampler = value;
                break;
            case 'Scheduler':
                imageGen.scheduler = value;
                break;
            case 'Seed':
                imageGen.seed = value;
                break;
            case 'Version':
                imageGen.version = value;
                break;
            default:
                imageGen.additionalData[key] = value;
                break;
        }
    });

    return imageGen;
}

const checkIfImageExists = (url: string, callback: (exists: boolean) => void) => {
    const img = new Image();
    img.src = url;
  
    if (img.complete) {
      callback(true);
    } else {
      img.onload = () => {
        callback(true);
      };
  
      img.onerror = () => {
        callback(false);
      };
    }
  };