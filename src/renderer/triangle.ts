import { shader } from "../shader/shaders.wgsl";

export class Triangle {
    createModule(device: GPUDevice){
        return device.createShaderModule({
            label: 'hardcoded triangle',
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

    createBindGroup(device: GPUDevice,pipeline: GPURenderPipeline){
        const uniformBufferSize = 4*4 + 2*4 + 2*4;
        const uniformBuffer = device.createBuffer({
            size:uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const uniformValues = new Float32Array(uniformBufferSize/4);
        console.log(uniformBufferSize);

        const kColorOffset = 0;
        const kScaleOffset = 4;
        const kOffsetOffset = 6;
       
        uniformValues.set([0, 1, 0, 1], kColorOffset);
        uniformValues.set([-0.5, -0.25], kOffsetOffset);
            // 자바스크립트의 Float32Array에 uniform 값을 설정함
        const aspect = window.innerWidth / window.innerHeight;
        uniformValues.set([0.5 / aspect, 0.5], kScaleOffset); // scale 설정

        device.queue.writeBuffer(uniformBuffer,0,uniformValues); // cpu -> gpu 복사

        const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [{
                binding: 0,
                resource: {
                    buffer: uniformBuffer,
                },
            }],
        });

        return bindGroup;
    }

    render(device: GPUDevice, ctx: GPUCanvasContext){
        // all command will be stored in this
        const encoder = device.createCommandEncoder({
            label: 'triangle encoder',
        })

        const module = this.createModule(device);
        const pipeline = this.createPipeline(device,module);
        const bindGroup = this.createBindGroup(device,pipeline);
        const renderPassDescription = this.createRenderPassDescriptior(ctx);

        {
            const pass = encoder.beginRenderPass(renderPassDescription);
            pass.setPipeline(pipeline);
            pass.setBindGroup(0, bindGroup);
            pass.draw(3);
            pass.end();
        }

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
    }
}