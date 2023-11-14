import { Geometry, Material, loadOBJ } from "../helper/objLoader";
import { ShaderProgram } from "../renderer/shaderProgram";
import * as glm from 'gl-matrix'
import {shader} from '../shader/modelShader';

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

    private program?: WebGLProgram;

    // TODO: program 나중에 자체적으로 Model에서 생성하도록 변경할것
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
        });

        const vertexShader = ShaderProgram.createShader(this.gl, shader.vs, this.gl.VERTEX_SHADER);
        const fragmentShader = ShaderProgram.createShader(this.gl, shader.fs, this.gl.FRAGMENT_SHADER);

        if(!vertexShader || !fragmentShader) return;

        this.program = ShaderProgram.createProgram(this.gl, vertexShader, fragmentShader);

        this.createVertexBuffer();

        this.isModelLoaded = true;
    }

    createVertexBuffer() {}
    
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

    render(){

    }
}
