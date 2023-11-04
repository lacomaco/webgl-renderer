import { basicShader } from "./shader";

// https://gpuweb.github.io/types/interfaces/GPUAdapter.html <- WebGPU API 문서
export class State {
    canvas: HTMLCanvasElement = document.createElement('canvas');
    ctx = this.canvas.getContext('webgpu');

    adapter: GPUAdapter | null = null;

    device?: GPUDevice | null = null;

    queue?: GPUQueue;

    size = {
        x: window.innerWidth,
        y: window.innerHeight
    };

    renderPipeline: GPURenderPipeline | null = null;

    constructor() {
        this.initialize();
        this.eventBinding();
    }

    createCanvas() {
        document.body.appendChild(this.canvas);
        this.canvas.width = this.size.x;
        this.canvas.height = this.size.y;
    }

    async initialize() {
        this.createCanvas();
        this.adapter = await navigator.gpu.requestAdapter();

        if(!this.adapter) {
            console.error('webgpu is not supported');
            return ;
        }

        this.device = await this.adapter.requestDevice();

        if(!this.device) {
            console.error('webgpu is not supported');
            return ;
        }

        this.queue = this.device.queue;

        this.ctx?.configure({
            device: this.device,
            format: navigator.gpu.getPreferredCanvasFormat()
        });

        const shader = this.device.createShaderModule({
            label: 'shader',
            code: basicShader
        });

        const renderPipelineLayout = this.device.createPipelineLayout({
            label:'hi',
            bindGroupLayouts: []
        })

        this.renderPipeline = this.device.createRenderPipeline({
            label: 'render pipeline',
            layout: renderPipelineLayout,
            vertex: {
                module: shader,
                entryPoint: 'vs_main',
                buffers: []
            },
            fragment: {
                module: shader,
                entryPoint: 'fs_main',
                targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                }]
            },
            primitive: {
                topology: 'triangle-list',
                frontFace: 'ccw',
                cullMode: 'back',
                unclippedDepth: false,
            },
            depthStencil: undefined,
            multisample: {
                count:1,
                mask: 0xffffffff,
                alphaToCoverageEnabled: false,
            },
            // remove the multiview property
        });

        setTimeout(()=>{
            this.keepRerender();
        },100)
    }

    resize () {
        this.canvas.width = this.size.x = window.innerWidth;
        this.canvas.height = this.size.y = window.innerHeight;
    }

    // 이벤트 바인딩은 이곳에서.
    eventBinding() {
        this.canvas.addEventListener('resize', this.resize.bind(this));
    }

    // 이곳에서 물체에 대한 업데이트를 진행한다.
    update() {

    }

    render() {
        this.update();

        const output = this.ctx?.getCurrentTexture();
        let view = output?.createView();

        if(!output || !view) {
            return ;
        }

        const commandEncoder = this.device?.createCommandEncoder({
            label: 'Render encoder'
        });

        if(!commandEncoder ){
            return;
        }

        const renderPass = commandEncoder.beginRenderPass({
            label: 'render pass',
            colorAttachments: [{
                view,
                clearValue: [0.1, 0.2, 0.3, 1],
                loadOp:'clear',
                storeOp:'store',
            }],
        });

        

        if(!this.queue){
            return;
        }

        if(!this.renderPipeline){
            return;
        }

        renderPass.setPipeline(this.renderPipeline);
        renderPass.draw(3,1,0,0);
        renderPass.end();

        const commandBuffer = commandEncoder.finish();

        this.queue.submit([commandBuffer]);
    }

    keepRerender(){
        requestAnimationFrame(this.render.bind(this));
    }
}
