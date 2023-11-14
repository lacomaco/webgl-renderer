import { Geometry, Material, loadOBJ } from "../helper/objLoader";
import { ShaderProgram } from "../renderer/shaderProgram";
import * as glm from 'gl-matrix'
import {shader} from '../shader/modelShader';
import {camera} from '../models/camera';

const defaultMaterial = {
    ambient: [0.2, 0.2, 0.2],
    diffuse: [0.8, 0.8, 0.8],
    specular: [0.2,0.2,0.2],
    shininess: 5,
}

export class Model {
    parts: {
        [materialName: string]: {
            obj: Geometry[],
            mtl: Material,
            materialInfo: {
                ambient?: number[],
                diffuse?: number[],
                specular?: number[],
                shininess?: number,
            }
        },
    } = {};

    uniformBuffer: {
        ambient: WebGLUniformLocation | null,
        diffuse: WebGLUniformLocation | null,
        specular: WebGLUniformLocation | null,
        shininess: WebGLUniformLocation | null,
    } = {
        ambient: null,
        diffuse: null,
        specular: null,
        shininess: null,
    }

    isModelLoaded = false;

    // vec3
    totalVertexCount = 0;
    // vec3
    totalNormalCount = 0;
    // vec2
    totalTexCoordCount = 0;

    vao: WebGLVertexArrayObject | null = null;

    worldMatrix = glm.mat4.create();

    private program?: WebGLProgram;

    constructor(private url: string,private gl: WebGL2RenderingContext | null){
        this.createUniformBuffer();
        this.init();
    }

    async init() {
        if(!this.gl) return;
        const {obj,mtl} = await loadOBJ(this.url);

        obj.geometries.forEach((geometry)=>{
            if(!this.parts[geometry.material]){
                const materialInfo = (mtl && mtl[geometry.material]) || defaultMaterial;

                this.parts[geometry.material] = {
                    obj: [],
                    mtl: materialInfo,
                    materialInfo: {
                        ambient: materialInfo.ambient,
                        diffuse: materialInfo.diffuse,
                        specular: materialInfo.specular,
                        shininess: materialInfo.shininess,
                    }
                };
            }

            this.parts[geometry.material].obj.push(geometry);
            this.totalVertexCount += geometry.data.position.length;
            this.totalNormalCount += geometry.data.normal.length;
            this.totalTexCoordCount += geometry.data.texcoord.length;
        });

        const vertexShader = ShaderProgram.createShader(this.gl, shader.vs, this.gl.VERTEX_SHADER);
        const fragmentShader = ShaderProgram.createShader(this.gl, shader.fs, this.gl.FRAGMENT_SHADER);

        if(!vertexShader || !fragmentShader) return;

        this.program = ShaderProgram.createProgram(this.gl, vertexShader, fragmentShader);

        this.createVertexBuffer();

        this.isModelLoaded = true;
    }

    createVertexBuffer() {
        if(!this.gl || !this.program) return;
        this.vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.vao);

        const bufferData: number[] = [];

        Object.keys(this.parts).forEach((materialName)=>{
            const objs = this.parts[materialName].obj;
            for(const obj of objs){
                const vertexCount = obj.data.position.length / 3;
                let start = 0;
                while(start < vertexCount){

                    //vertex 정보 축척
                    bufferData.push(obj.data.position[start * 3]);
                    bufferData.push(obj.data.position[start * 3 + 1]);
                    bufferData.push(obj.data.position[start * 3 + 2]);

                    //normal 정보 축척
                    bufferData.push(obj.data.normal[start * 3]);
                    bufferData.push(obj.data.normal[start * 3 + 1]);
                    bufferData.push(obj.data.normal[start * 3 + 2]);

                    //texcoord 정보 축척
                    bufferData.push(obj.data.texcoord[start * 2]);
                    bufferData.push(obj.data.texcoord[start * 2 + 1]);

                    start++;
                }
            }
        });

        const positionAttributeLocation = this.gl?.getAttribLocation(this.program!, 'a_position');
        const normalAttributeLocation = this.gl?.getAttribLocation(this.program!, 'a_normal');
        // texcoord는 임시로 사용x 필요할때 규격에 맞게 추가할것.
        // const textureAttributeLocation = this.gl?.getAttribLocation(this.program!, 'a_texcoord');

        this.gl?.enableVertexAttribArray(positionAttributeLocation!);
        this.gl?.enableVertexAttribArray(normalAttributeLocation!);

        const vertexBuffer = this.gl?.createBuffer();
        this.gl?.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl?.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(bufferData), this.gl.STATIC_DRAW);

        this.gl?.vertexAttribPointer(
            positionAttributeLocation!, 
            3, 
            this.gl.FLOAT, 
            false, 
            8*Float32Array.BYTES_PER_ELEMENT,
            0
        );

        this.gl?.vertexAttribPointer(
            normalAttributeLocation!, 
            3, 
            this.gl.FLOAT, 
            false, 
            8*Float32Array.BYTES_PER_ELEMENT, 
            3*Float32Array.BYTES_PER_ELEMENT
        );

        /*
        // 나중에 텍스처 사용할때 주석 풀고 사용할것
        this.gl?.vertexAttribPointer(
            textureAttributeLocation!, 
            2, 
            this.gl.FLOAT, 
            false, 
            8*Float32Array.BYTES_PER_ELEMENT, 
            6*Float32Array.BYTES_PER_ELEMENT
        );
        */
    }
    
    // not yet
    createTextureBuffer() {}

    createUniformBuffer() {
        if(!this.gl || !this.program) return;

        this.uniformBuffer.ambient = this.gl.getUniformLocation(this.program, 'u_materialAmbient');
        this.uniformBuffer.diffuse = this.gl.getUniformLocation(this.program, 'u_materialDiffuse');
        this.uniformBuffer.specular = this.gl.getUniformLocation(this.program, 'u_materialSpecular');
        this.uniformBuffer.shininess = this.gl.getUniformLocation(this.program, 'u_materialShininess');


    }
    
    setMaterialUniformBuffer(material: Material) {
        if(!this.gl || !this.program) return;

        if(material.ambient){
            this.gl.uniform3fv(this.uniformBuffer.ambient, material.ambient);
        }

        if(material.diffuse){
            this.gl.uniform3fv(this.uniformBuffer.diffuse, material.diffuse);
        }

        if(material.specular){
            this.gl.uniform3fv(this.uniformBuffer.specular, material.specular);
        }

        if(material.shininess){
            this.gl.uniform1f(this.uniformBuffer.specular, material.shininess);
        }
    }

    setWorldUniformBuffer() {
        const worldMatrixLocation = this.gl?.getUniformLocation(this.program!, 'u_world');
        this.gl?.uniformMatrix4fv(worldMatrixLocation!, false, this.worldMatrix);
    }

    createTexture() {
        // 나중에 텍스처 필요할때 구현할것.
    }

    render(){
        if(!this.gl || !this.program || !this.vao) return;

        this.gl.useProgram(this.program);
        this.createUniformBuffer();
        this.setWorldUniformBuffer();
        camera.setViewUniform(this.gl, this.program);
        camera.setProjectionUniform(this.gl, this.program);

        this.gl.bindVertexArray(this.vao);

        let currentOffset = 0;
        Object.keys(this.parts).forEach((materialName)=>{
            const material = this.parts[materialName].mtl;
            this.setMaterialUniformBuffer(material);

            const objs = this.parts[materialName].obj;
            for(const obj of objs){
                const vertexCount = obj.data.position.length / 3;
                if(!this.gl) return;
                
                this.gl.drawArrays(
                    this.gl.TRIANGLES,
                    currentOffset,
                    vertexCount
                );
                currentOffset += vertexCount;
            }
        });


    }
}
