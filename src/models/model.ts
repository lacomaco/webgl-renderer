import { Geometry, Material, loadOBJ } from "../helper/objLoader";
import { ShaderProgram } from "../renderer/shaderProgram";
import * as glm from 'gl-matrix'
import {shader} from '../shader/modelShader';
import {camera} from '../models/camera';
import { directLight } from "./directLight";
import * as tw from 'twgl.js';

const defaultMaterial = {
    ambient: [0.2, 0.2, 0.2],
    diffuse: [0.8, 0.8, 0.8],
    specular: [0.2,0.2,0.2],
    shininess: 100,
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

    worldData = {
        currentXRotate: 0,
        xIncrease: 0.1,
        currentYRotate: 0,
        yIncrease: 0.2,
    }

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
        Object.keys(this.parts).forEach((materialName)=>{
            const material = this.parts[materialName].mtl;
            this.createTextureBuffer(material);
        });

        this.isModelLoaded = true;
    }

    worldMove() {
        const move = glm.mat4.create();
        glm.mat4.scale(move,move,[0.3,0.3,0.3]);
        glm.mat4.translate(move,move,[0,-2.3,0])
        // glm.mat4.rotateX(move,move, this.worldData.currentXRotate * Math.PI / 180);
        glm.mat4.rotateY(move, move, this.worldData.currentYRotate * Math.PI / 180);

        this.worldMatrix = move;

        this.worldData.currentXRotate += this.worldData.xIncrease;
        this.worldData.currentYRotate += this.worldData.yIncrease;
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
        const textureAttributeLocation = this.gl?.getAttribLocation(this.program!, 'a_texcoord');

        this.gl?.enableVertexAttribArray(positionAttributeLocation!);
        this.gl?.enableVertexAttribArray(normalAttributeLocation!);
        this.gl?.enableVertexAttribArray(textureAttributeLocation);

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

        this.gl?.vertexAttribPointer(
            textureAttributeLocation, 
            2, 
            this.gl.FLOAT, 
            false, 
            8*Float32Array.BYTES_PER_ELEMENT, 
            6*Float32Array.BYTES_PER_ELEMENT
        );
        
    }
    
    // not yet
    /*
    ambient Map
    diffuse Map
    specular Map
    normal Map
    */
    createTextureBuffer(mtl: Material) {
        if(!this.gl || !this.program) return;

            const texture = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

            // 밉맵을 사용하지 않는 파라메터를 설정합니다.
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

            this.gl.texImage2D(
                this.gl.TEXTURE_2D,
                0,
                this.gl.RGBA,
                this.gl.RGBA,
                this.gl.UNSIGNED_BYTE,
                mtl.diffuseImage!
            )

            mtl.diffuseMapBuffer = texture;
    }

    changeTextureBuffer(mtl: Material) {
        const u_imageLocation = this.gl?.getUniformLocation(this.program!, 'u_diffuseMap');
        if(!u_imageLocation || !mtl.diffuseMapBuffer) return;
        this.gl?.uniform1i(u_imageLocation, 0);

        this.gl?.activeTexture(this.gl.TEXTURE0);
        this.gl?.bindTexture(this.gl.TEXTURE_2D, mtl.diffuseMapBuffer)
    }

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
            this.gl.uniform1f(this.uniformBuffer.shininess, material.shininess);
        }
    }

    setWorldUniformBuffer() {
        const worldMatrixLocation = this.gl?.getUniformLocation(this.program!, 'u_world');
        this.gl?.uniformMatrix4fv(worldMatrixLocation!, false, this.worldMatrix);

        const worldInvTransposeMatrixLocation = this.gl?.getUniformLocation(this.program!, 'u_worldInvTranspose');
        const worldInvTransposeMatrix = glm.mat4.create();
        glm.mat4.invert(worldInvTransposeMatrix, this.worldMatrix);
        glm.mat4.transpose(worldInvTransposeMatrix, worldInvTransposeMatrix);
        this.gl?.uniformMatrix4fv(worldInvTransposeMatrixLocation!, false, worldInvTransposeMatrix);
    }

    render(){
        if(!this.gl || !this.program || !this.vao) return;

        this.worldMove();

        this.gl.useProgram(this.program);
        this.createUniformBuffer();
        this.setWorldUniformBuffer();
        camera.setCameraPositionUniform(this.gl, this.program);
        camera.setViewUniform(this.gl, this.program);
        camera.setProjectionUniform(this.gl, this.program);
        directLight.setLightInfo(this.gl, this.program);

        this.gl.bindVertexArray(this.vao);

        let currentOffset = 0;
        Object.keys(this.parts).forEach((materialName)=>{
            const material = this.parts[materialName].mtl;
            // this.createTextureBuffer(material);
            this.changeTextureBuffer(material);
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
