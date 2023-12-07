import { mat4 } from "gl-matrix";

export class Shader {
  vertexShader: WebGLShader;
  fragmentShader: WebGLShader;
  gl: WebGL2RenderingContext;
  program: WebGLProgram;

  constructor(
    vertex: string,
    fragment: string,
    context: WebGL2RenderingContext,
  ) {
    this.gl = context;
    this.vertexShader = this.createShader(vertex, this.gl.VERTEX_SHADER);
    this.fragmentShader = this.createShader(fragment, this.gl.FRAGMENT_SHADER);

    this.program = this.createProgram();
  }

  use() {
    this.gl.useProgram(this.program);
  }

  setBool(name: string, value: boolean) {
    this.gl.uniform1i(
      this.gl.getUniformLocation(this.program, name),
      value ? 1 : 0,
    );
  }

  setInt(name: string, value: number) {
    this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), value);
  }

  setFloat(name: string, value: number) {
    this.gl.uniform1f(this.gl.getUniformLocation(this.program, name), value);
  }

  setVec2(name: string, value: number[]) {
    this.gl.uniform2fv(this.gl.getUniformLocation(this.program, name), value);
  }

  setVec3(name: string, value: number[]) {
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, name), value);
  }

  setVec4(name: string, value: number[]) {
    this.gl.uniform4fv(this.gl.getUniformLocation(this.program, name), value);
  }

  setMat2(name: string, value: number[]) {
    this.gl.uniformMatrix2fv(
      this.gl.getUniformLocation(this.program, name),
      false,
      value,
    );
  }

  setMat3(name: string, value: number[]) {
    this.gl.uniformMatrix3fv(
      this.gl.getUniformLocation(this.program, name),
      false,
      value,
    );
  }

  setMat4(name: string, value: mat4) {
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(this.program, name),
      false,
      value,
    );
  }

  private createProgram() {
    const program = this.gl.createProgram();

    if (!program) {
      console.error(`쉐이더 프로그램 생성 실패!`);
      throw Error;
    }

    this.gl.attachShader(program, this.vertexShader);
    this.gl.attachShader(program, this.fragmentShader);

    this.gl.linkProgram(program);

    this.gl.deleteShader(this.vertexShader);
    this.gl.deleteShader(this.fragmentShader);

    const isSuccess = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
    if (!isSuccess) {
      console.error(`쉐이더 프로그램 링크 실패!`);
      console.error(this.gl.getProgramInfoLog(program));
      this.gl.deleteProgram(program);
      throw Error;
    }

    return program;
  }

  private createShader(shaderSource: string, type: GLenum): WebGLShader {
    const shader = this.gl.createShader(type);

    if (!shader) {
      console.error(`쉐이더 생성 실패!!!!!!!`);
      throw Error;
    }

    this.gl.shaderSource(shader, shaderSource);
    this.gl.compileShader(shader);

    const isSuccess = this.gl.getShaderParameter(
      shader,
      this.gl.COMPILE_STATUS,
    );

    if (!isSuccess) {
      console.error(`컴파일 실패 오류!`);
      console.error(this.gl.getShaderInfoLog(shader));
      this.cleanUp();
      throw Error;
    }

    return shader;
  }

  cleanUp() {
    this.gl.deleteProgram(this.program);
  }
}
