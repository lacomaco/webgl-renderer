import { camera } from "../caremalight/camera";
import { Shader } from "../shader/shader";
import { textureMap } from "./model";
import { Mesh as TMESH } from "three";
import * as glm from "gl-matrix";

// sum: 8
export interface Vertex {
  position: [number, number, number];
  normal: [number, number, number];
  texcoords: [number, number];
}

/*
 * shader속 texture 이름은 아래와 같은 형식으로 증가한다.
 * texture_diffuseN;
 * texture_specularN;
 * texture_normalN;
 */
export enum TextureType {
  Diffuse = "texture_diffuse",
  Specular = "texture_specular",
  Ambient = "texture_ambient",
  Normal = "texture_normal",
  Height = "texture_height",
}

export interface Texture {
  id: number; // 텍스처 고유 id값. 텍스처를 찾을 때 사용
  type: TextureType; // diffuse, specular, normal, height
}

export interface VertexMaterial {
  ambient: [number, number, number];
  diffuse: [number, number, number];
  specular: [number, number, number];
  shininess: number;
}

export interface MeshMaterial {
  texture: Texture[];
  material: VertexMaterial;
}

export class Mesh {
  private vao!: WebGLVertexArrayObject;
  private vbo!: WebGLBuffer; // vertex buffer object
  private ebo!: WebGLBuffer; // element buffer object

  worldData = {
    currentXRotate: 0,
    xIncrease: 0.008,
    currentYRotate: 0,
    yIncrease: 0.008,
  };

  constructor(
    public vertices: Vertex[],
    public indices: number[],
    private materials: MeshMaterial[],
    private gl: WebGL2RenderingContext,
    private mesh: TMESH,
  ) {
    this.setupMesh();
  }

  setupMesh(): void {
    this.vao = this.gl.createVertexArray() as WebGLVertexArrayObject;
    this.vbo = this.gl.createBuffer() as WebGLBuffer;
    this.ebo = this.gl.createBuffer() as WebGLBuffer;

    this.gl.bindVertexArray(this.vao);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.vertexSerialization(),
      this.gl.STATIC_DRAW,
    );

    // vertex attribute 설정 position
    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribPointer(
      0,
      3,
      this.gl.FLOAT,
      false,
      8 * Float32Array.BYTES_PER_ELEMENT,
      0,
    );

    // normal
    this.gl.enableVertexAttribArray(1);
    this.gl.vertexAttribPointer(
      1,
      3,
      this.gl.FLOAT,
      false,
      8 * Float32Array.BYTES_PER_ELEMENT,
      3 * Float32Array.BYTES_PER_ELEMENT,
    );

    // texcoord
    this.gl.enableVertexAttribArray(2);
    this.gl.vertexAttribPointer(
      2,
      2,
      this.gl.FLOAT,
      false,
      8 * Float32Array.BYTES_PER_ELEMENT,
      6 * Float32Array.BYTES_PER_ELEMENT,
    );

    // index 설정
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      new Uint32Array(this.indices),
      this.gl.STATIC_DRAW,
    );
  }

  draw(shader: Shader) {
    shader.use();
    this.gl.bindVertexArray(this.vao);

    //camera.setCameraPositionUniform(this.gl, shader.program);
    camera.setViewUniform(this.gl, shader.program);
    camera.setProjectionUniform(this.gl, shader.program);

    const defaultModel = glm.mat4.create();
    glm.mat4.scale(defaultModel, defaultModel, [0.3, 0.3, 0.3]);
    glm.mat4.rotateX(defaultModel, defaultModel, this.worldData.currentXRotate);
    glm.mat4.rotateY(defaultModel, defaultModel, this.worldData.currentYRotate);

    this.worldData.currentXRotate += this.worldData.xIncrease;
    this.worldData.currentYRotate += this.worldData.yIncrease;

    shader.setMat4("model", defaultModel);

    if (this.materials.length === 1) {
      this.callDraw(shader, this.materials[0], 0, this.indices.length);
      return;
    }

    this.materials.forEach((material, index) => {
      const group = this.mesh.geometry.groups[index];
      this.callDraw(shader, material, group.start, group.count);
    });
  }

  callDraw(
    shader: Shader,
    meshMaterial: MeshMaterial,
    start: number,
    count: number,
  ): void {
    const { texture, material } = meshMaterial;
    if (texture.length === 0) {
      texture.push({
        id: Infinity,
        type: TextureType.Diffuse,
      });
      texture.push({
        id: Infinity,
        type: TextureType.Specular,
      });
      texture.push({
        id: Infinity,
        type: TextureType.Normal,
      });
    }

    let diffuseN = 1;
    let specularN = 1;
    for (let i = 0; i < texture.length; i++) {
      let number;
      let name = texture[i].type;
      if (name === TextureType.Diffuse) {
        number = diffuseN++;
      } else if (name === TextureType.Specular) {
        number = specularN++;
      }

      shader.setInt("material." + name + number, i);
      this.gl.activeTexture(this.gl.TEXTURE0 + i);
      if (texture[i].id === Infinity) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, Shader.defaultTexture);
      } else {
        this.gl.bindTexture(
          this.gl.TEXTURE_2D,
          textureMap.get(texture[i].id) as WebGLTexture,
        );
      }
    }

    shader.setVec3("material.ambient", material.ambient);
    shader.setVec3("material.diffuse", material.diffuse);
    shader.setVec3("material.specular", material.specular);
    shader.setFloat("material.shininess", material.shininess);

    this.gl.drawElements(
      this.gl.TRIANGLES,
      count,
      this.gl.UNSIGNED_INT,
      start * Uint32Array.BYTES_PER_ELEMENT,
    );
  }

  vertexSerialization() {
    const result: number[] = [];
    for (const vertex of this.vertices) {
      result.push(...vertex.position);
      result.push(...vertex.normal);
      result.push(...vertex.texcoords);
    }
    return new Float32Array(result);
  }
}
