import { shader } from "../shader/gpgpu.wgsl";

export class GPGPU {
    input = new Float32Array([1,3,5]);

    createModule(device: GPUDevice){
        return device.createShaderModule({
            label: 'out gpgpu shaders',
            code: shader.gpgpu,
        })
    }

    createPipeline(device: GPUDevice, module: GPUShaderModule){
        return device.createComputePipeline({
            label: 'out gpgpu pipeline',
            compute: {
                module,
                entryPoint: 'computeSomething',
            },
            layout: "auto"
        });
    }

    // cpu -> gpu
    createBuffer(device:GPUDevice){
        const workBuffer = device.createBuffer({
            label: 'out work buffer',
            size: this.input.byteLength, // 4 bytes per float
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        });

        device.queue.writeBuffer(workBuffer, 0, this.input);
        return workBuffer;
    }

    // gpu -> cpu
    createResultBuffer(device:GPUDevice){
        return device.createBuffer({
            label: 'out result buffer',
            size: this.input.byteLength, // 4 bytes per float
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        });
    }

    createBindGroup(device: GPUDevice,pipeline:GPUComputePipeline,workBuffer:GPUBuffer){
        return device.createBindGroup({
            label: 'bindGroup for work buffer',
            layout: pipeline.getBindGroupLayout(0), // @group(0)
            entries: [{
                binding: 0, // @binding(0)
                resource: {
                    buffer: workBuffer, // @group(0) @binding(0)에 데이터 적재.
                }
            }]
        });
    }


}