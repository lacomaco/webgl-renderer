// vertex, fragment 모두 포함하는 쉐이더 프로그램
export class ShaderProgram {
  // shaderType <- gl.VERTEX_SHADER or gl.FRAGMENT_SHADER only
  static createShader(
    gl: WebGL2RenderingContext,
    shaderSource: string,
    shaderType: number,
    label?: string,
  ) {
    const shader = gl.createShader(shaderType);

    if (!shader) {
      console.error(`${label} shader 생성 실패!`);
      return;
    }

    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    const isSuccess = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if (!isSuccess) {
      console.error(`${label}컴파일 실패 오류!`);
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return;
    }

    return shader;
  }

  static createProgram(
    gl: WebGL2RenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
    label?: string,
  ) {
    const program = gl.createProgram();

    if (!program) {
      console.error(`${label} 쉐이더 프로그램 생성 실패!`);
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    const isSuccess = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!isSuccess) {
      console.error(`${label} 쉐이더 프로그램 링크 실패!`);
      console.error(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return;
    }

    return program;
  }
}
