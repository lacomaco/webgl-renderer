interface StateI {
    canvas: HTMLCanvasElement;
    device: GPUDevice;
    queue: GPUQueue;
    config: GPUCanvasConfiguration,
    size: {
        x: number,
        y: number,
    }
}

export class State {
    canvas: HTMLCanvasElement = document.createElement('canvas');

    constructor() {

    }

    async initialize() {


    }
}
