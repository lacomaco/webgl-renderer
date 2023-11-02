import { shader } from "../shader/shaders.wgsl";

export class Triangle {
    createModule(device: GPUDevice){
        return device.createShaderModule({
            label: 'out hardcoded red triangle shaders',
            code: shader.vertex + shader.fragment,
        })
    }

    createPipeline(device: GPUDevice, module: GPUShaderModule){
        return device.createRenderPipeline({
            label: 'out hardcoded red triangle pipeline',
            layout: 'auto',
            vertex: {
                module,
                entryPoint: 'vs',
            },
            fragment: {
                module,
                entryPoint: 'fs',
                targets: [{
                    format: 'bgra8unorm',
                }]
            },
        });
    }

    createRenderPassDescriptior(ctx: GPUCanvasContext): GPURenderPassDescriptor{
        return {
            label: 'out basic canvas renderPass',
            colorAttachments: [{
                view: ctx.getCurrentTexture().createView(),
                clearValue: [0.3, 0.3, 0.3, 1],
                loadOp:'clear',
                storeOp:'store',
            }],
        }
    }

    render(device: GPUDevice, ctx: GPUCanvasContext){
        // all command will be stored in this
        const encoder = device.createCommandEncoder({
            label: 'triangle encoder',
        })

        const module = this.createModule(device);
        const pipeline = this.createPipeline(device,module);
        const renderPassDescription = this.createRenderPassDescriptior(ctx);

        {
            const pass = encoder.beginRenderPass(renderPassDescription);
            pass.setPipeline(pipeline);
            pass.draw(3);
            pass.end();
        }

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
    }
}