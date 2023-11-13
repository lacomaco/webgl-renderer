import { Geometry, Material, loadOBJ } from "../helper/objLoader";

export class Model {
    parts: {
        [materialName: string]: {
            obj: Geometry[],
            mtl: Material,
            materialBuffer: {
                ambient: WebGLUniformLocation | null,
                diffuse: WebGLUniformLocation | null,
                specular: WebGLUniformLocation | null,
                shininess: WebGLUniformLocation | null,
            }
        }
    } = {};
    // TODO: program 나중에 자체적으로 Model에서 생성하도록 변경할것
    constructor(private url: string,private gl: WebGL2RenderingContext | null, private program: WebGLProgram | null){
        this.init();
    }

    async init() {
        const {obj,mtl} = await loadOBJ(this.url);

        obj.geometries.forEach((geometry)=>{
            if(!this.parts[geometry.material]){
                this.parts[geometry.material] = {
                    obj: [],
                    mtl: mtl[geometry.material]
                };
            }

            this.parts[geometry.material].obj.push(geometry);
        });
    }

    createMaterialUniformBuffer(material: Material) {
        if(!this.gl || !this.program) return;

        const ambient = this.gl.getUniformLocation(this.program, 'u_materialAmbient');
        const diffuse = this.gl.getUniformLocation(this.program, 'u_materialDiffuse');
        const specular = this.gl.getUniformLocation(this.program, 'u_materialSpecular');
        const shininess = this.gl.getUniformLocation(this.program, 'u_materialShininess');

        if(material.ambient){
            this.gl.uniform3fv(ambient, material.ambient);
        }

        if(material.diffuse){
            this.gl.uniform3fv(diffuse, material.diffuse);
        }

        if(material.specular){
            this.gl.uniform3fv(specular, material.specular);
        }

        if(material.shininess){
            this.gl.uniform1f(shininess, material.shininess);
        }

    }
}
