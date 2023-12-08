/*
todo: 나중에 라이트를 여러개로 만들어서 라이트마다 다른 색상을 가지게 할 수 있도록 하자.
*/
export class DirectLight {
  lightStrength = [1, 1, 1]; // 백색광
  lightDirection = [0, 0, -1];
  lightPosition = [0, 10, 5];

  setLightInfo(gl: WebGL2RenderingContext, program: WebGLProgram) {
    const lightStrengthLocation = gl.getUniformLocation(
      program,
      "light.lightStrength",
    );
    gl.uniform3fv(lightStrengthLocation, this.lightStrength);

    const lightDirectionLocation = gl.getUniformLocation(
      program,
      "light.lightDirection",
    );
    gl.uniform3fv(lightDirectionLocation, this.lightDirection);

    const lightPositionLocation = gl.getUniformLocation(
      program,
      "light.lightPosition",
    );
    gl.uniform3fv(lightPositionLocation, this.lightPosition);
  }
}

export const directLight = new DirectLight();
