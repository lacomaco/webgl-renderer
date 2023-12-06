// sum: 8
export interface Vertex {
  position: [number, number, number];
  normal: [number, number, number];
  texcoords: [number, number];
}

export enum TextureType {
  Diffuse = 0,
  Specular = 1,
  Ambient = 2,
  Normal = 3,
  Height = 4,
}

/*
 * shader속 texture 이름은 아래와 같은 형식으로 증가한다.
 * texture_diffuseN;
 * texture_specularN;
 * texture_normalN;
 */
export interface Texture {
  id: number; // 텍스처 고유 id값. 텍스처를 찾을 때 사용
  type: TextureType; // diffuse, specular, normal, height
}

class Mesh {
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

  draw(): void {
    /*
        gl.drawElements()를 사용하여 메쉬를 지우는 코드 작성
        */
    let diffuseN = 1;
    let specularN = 1;
    for (let i = 0; i < this.textures.length; i++) {}
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
