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

        commandEncoder.beginRenderPass({
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

        const commandBuffer = commandEncoder.finish();

        this.queue.submit([commandBuffer]);
    }

    keepRerender(){
        requestAnimationFrame(this.render.bind(this));
    }
}
