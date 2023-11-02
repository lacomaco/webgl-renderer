import { Triangle } from "./triangle";

export class Laco3DRender {
    canvas = document.createElement('canvas');
    ctx: GPUCanvasContext = this.canvas.getContext('webgpu') as GPUCanvasContext;
    presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    adapter: GPUAdapter | null = null;
    device: GPUDevice | null = null;
    triangle: Triangle = new Triangle();

    constructor() {
        document.body.appendChild(this.canvas);
        this.resize();
        window.addEventListener('resize',this.resize.bind(this));

        this.loadWebGpu();
    }

    async loadWebGpu(){
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter?.requestDevice();

        if(!device || !adapter){
            console.error('webgpu is not supported');
            return;
        }

        this.adapter = adapter;
        this.device = device;
        this.ctx.configure({
            device,
            format:this.presentationFormat,
        })
        console.log('webgpu is ready');
    }

    drawTriangle(){
        if(this.device){
            this.triangle.render(this.device, this.ctx);
        }
    }

    resize(){
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}