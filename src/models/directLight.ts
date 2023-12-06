export class DirectLight {
  lightStrength = [1, 1, 1]; // 백색광
  lightDirection = [0, 0, -1];
  lightPosition = [0, 0, 10];

  setLightInfo(gl: WebGL2RenderingContext, program: WebGLProgram) {
    const lightStrengthLocation = gl.getUniformLocation(
      program,
      "u_lightStrength",
    );
    gl.uniform3fv(lightStrengthLocation, this.lightStrength);

    const lightDirectionLocation = gl.getUniformLocation(
      program,
      "u_lightDirection",
    );
    gl.uniform3fv(lightDirectionLocation, this.lightDirection);

    const lightPositionLocation = gl.getUniformLocation(
      program,
      "u_lightPosition",
    );
    gl.uniform3fv(lightPositionLocation, this.lightPosition);
  }
}

export const directLight = new DirectLight();
