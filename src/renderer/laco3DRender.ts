import { GPGPU } from "./gpgpu";
import { Triangle } from "./triangle";

export class Laco3DRender {
    canvas = document.createElement('canvas');
    ctx: GPUCanvasContext = this.canvas.getContext('webgpu') as GPUCanvasContext;
    presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    adapter: GPUAdapter | null = null;
    device: GPUDevice | null = null;
    triangle: Triangle = new Triangle();
    gpgpu: GPGPU = new GPGPU();

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

    async testGPGPU() {
        if(this.device === null){
            return;
        }
        
        const module = this.gpgpu.createModule(this.device as GPUDevice);
        const pipeline = this.gpgpu.createPipeline(this.device as GPUDevice, module);
        const workBuffer = this.gpgpu.createBuffer(this.device as GPUDevice);
        const resultBuffer = this.gpgpu.createResultBuffer(this.device as GPUDevice);
        const bindGroup = this.gpgpu.createBindGroup(this.device as GPUDevice, pipeline, workBuffer);

        const encoder = this.device.createCommandEncoder({
            label: 'gpgpu encoder',
        });

        {
            const pass = encoder.beginComputePass();
            pass.setPipeline(pipeline);
            pass.setBindGroup(0, bindGroup);
            pass.dispatchWorkgroups(this.gpgpu.input.length);
            pass.end();
        }

        encoder.copyBufferToBuffer(workBuffer, 0, resultBuffer, 0, this.gpgpu.input.byteLength);
        const commandBuffer = encoder.finish();
        this.device.queue.submit([commandBuffer]);

        await resultBuffer.mapAsync(GPUMapMode.READ);
        const result = new Float32Array(resultBuffer.getMappedRange());
        console.log('input',this.gpgpu.input);
        console.log('result',result);

        resultBuffer.unmap();
    
    }

    resize(){
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}