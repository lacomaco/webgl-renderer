import { Shader } from "../shader/shader";

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
  Diffuse = 'texture_diffuse',
  Specular = 'texture_specular',
  Ambient = 'texture_ambient',
  Normal = 'texture_normal',
  Height = 'texture_height',
}

export interface Texture {
  id: number; // 텍스처 고유 id값. 텍스처를 찾을 때 사용
  type: TextureType; // diffuse, specular, normal, height
}

export class Mesh {
  private vao!: WebGLVertexArrayObject;
  private vbo!: WebGLBuffer; // vertex buffer object
  private ebo!: WebGLBuffer; // element buffer object

  constructor(
    public vertices: Vertex[],
    public indices: number[],
    public textures: Texture[],
    private gl: WebGL2RenderingContext,
  ) {
    this.setupMesh();
  }

  draw(shader: Shader): void {
    /*
      gl.drawElements()를 사용하여 메쉬를 지우는 코드 작성
    */
    let diffuseN = 1;
    let specularN = 1;
    for (let i = 0; i < this.textures.length; i++) {
      this.gl.activeTexture(this.gl.TEXTURE0 + i);
      let number;
      let name = this.textures[i].type;
      if(name === TextureType.Diffuse){
        number = diffuseN++;
      } else if (name === TextureType.Specular){
        number = specularN++;
      }

      shader.setInt('material.'+name+number,i);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[i].id);
    }
    this.gl.activeTexture(this.gl.TEXTURE0);

    this.gl.bindVertexArray(this.vao);
    this.gl.drawElements(
      this.gl.TRIANGLES, 
      this.indices.length, 
      this.gl.UNSIGNED_INT, 
      0
    )
    // unbind
    this.gl.bindVertexArray(0);;
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

    // vertex attribute 설정
    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribPointer(
      0,
      3,
      this.gl.FLOAT,
      false,
      8 * Float32Array.BYTES_PER_ELEMENT,
      0,
    );

    // position
    this.gl.enableVertexAttribArray(1);
    this.gl.vertexAttribPointer(
      1,
      3,
      this.gl.FLOAT,
      false,
      8 * Float32Array.BYTES_PER_ELEMENT,
      3 * Float32Array.BYTES_PER_ELEMENT,
    );

    // normal
    this.gl.enableVertexAttribArray(2);
    this.gl.vertexAttribPointer(
      2,
      2,
      this.gl.FLOAT,
      false,
      8 * Float32Array.BYTES_PER_ELEMENT,
      6 * Float32Array.BYTES_PER_ELEMENT,
    );

    // unbind
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, 0);
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
