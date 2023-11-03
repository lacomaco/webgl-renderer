import { shader } from "../shader/shaders.wgsl";

const rand = (min?:number, max?:number) => {
    if (min === undefined) {
      min = 0;
      max = 1;
    } else if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + Math.random() * (max - min);
  };
   

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

        const kColorOffset = 0;
        const kOffsetOffset = 6;

        const kNumObjects = 100;
        const objectInfos = [];

        for (let i = 0; i < kNumObjects; ++i) {
          const uniformBuffer = device.createBuffer({
            label: `uniforms for obj: ${i}`,
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
          });
       
          // uniform을 위해 사용할 값을 저장할 typedarray를 자바스크립트에서 만듬
          const uniformValues = new Float32Array(uniformBufferSize / 4);
          uniformValues.set([rand(), rand(), rand(), 1], kColorOffset);        // set the color
          uniformValues.set([rand(-0.9, 0.9), rand(-0.9, 0.9)], kOffsetOffset);      // set the offset
       
          const bindGroup = device.createBindGroup({
            label: `bind group for obj: ${i}`,
            layout: pipeline.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: { buffer: uniformBuffer }},
            ],
          });
       
          objectInfos.push({
            scale: rand(0.2, 0.5),
            uniformBuffer,
            uniformValues,
            bindGroup,
          });
        }

        return objectInfos;
    }

    render(device: GPUDevice, ctx: GPUCanvasContext){
        // all command will be stored in this
        const encoder = device.createCommandEncoder({
            label: 'triangle encoder',
        })

        const module = this.createModule(device);
        const pipeline = this.createPipeline(device,module);
        const bindGroups = this.createBindGroup(device,pipeline);
        const renderPassDescription = this.createRenderPassDescriptior(ctx);

        const aspect = window.innerWidth / window.innerHeight;
        const kScaleOffset = 2;

        const pass = encoder.beginRenderPass(renderPassDescription);
        pass.setPipeline(pipeline);

        for (const {scale, bindGroup, uniformBuffer, uniformValues} of bindGroups) {
            uniformValues.set([scale / aspect, scale], kScaleOffset); // set the scale
            device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
             pass.setBindGroup(0, bindGroup);
             pass.draw(3);  // call our vertex shader 3 times
          }
          pass.end();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
    }
}