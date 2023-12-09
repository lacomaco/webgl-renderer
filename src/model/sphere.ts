import * as glm from 'gl-matrix';
import { Vertex } from '../loader/mesh';

export class Sphere {
    vertex: Vertex[];
    indices: number[];

    constructor(radius: number,numSlices: number,numStacks: number){
        const theta = 2 * Math.PI / numStacks;
        const phi = Math.PI / numSlices;

        const vertices: Vertex[] = [];

        for(let j = 0; j <= numStacks; j++){
            let stackStartPoint = glm.vec3.transformMat4(
                glm.vec3.create(),
                glm.vec3.fromValues(0,-radius,0.0),
                glm.mat4.fromZRotation(glm.mat4.create(),phi * j)
            );

            for(let i = 0; i <= numSlices; i++){
                const position = glm.vec3.transformMat4(
                    glm.vec3.create(),
                    stackStartPoint,
                    glm.mat4.fromYRotation(glm.mat4.create(),theta * i)
                );

                const normal = glm.vec3.normalize(
                    glm.vec3.create(),
                    glm.vec3.fromValues(position[0],position[1],position[2])
                );

                const texcoord = glm.vec2.fromValues(
                    i / numSlices,
                    1.0 - j / numStacks
                );

                vertices.push({
                    position: [position[0],position[1],position[2]],
                    normal: [normal[0],normal[1],normal[2]],
                    texcoords: [texcoord[0],texcoord[1]]
                })
            }
        }

        const indices = [];
        for (let j = 0; j < numStacks; j++) {
            const offset = (numSlices + 1) * j;
        
            for (let i = 0; i < numSlices; i++) {
                indices.push(offset + i);
                indices.push(offset + i + numSlices + 1);
                indices.push(offset + i + 1 + numSlices + 1);
        
                indices.push(offset + i);
                indices.push(offset + i + 1 + numSlices + 1);
                indices.push(offset + i + 1);
            }
        }

        this.vertex = vertices;
        this.indices = indices;
    }
}