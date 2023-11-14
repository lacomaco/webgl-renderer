import * as glm from  'gl-matrix';

class _Camera {
    cameraPosition = [0,0,5];
    lookAtPoint = [0,0,0];
    upDirection = [0,1,0];

    viewMatrix = glm.mat4.lookAt(
        glm.mat4.create(),
        new Float32Array(this.cameraPosition),
        new Float32Array(this.lookAtPoint),
        new Float32Array(this.upDirection)
    );

    projectionMatrix = glm.mat4.perspective(
        glm.mat4.create(),
        glm.glMatrix.toRadian(55),
        window.innerWidth / window.innerHeight,
        0.1,
        100
    );

    setViewUniform(gl: WebGL2RenderingContext, program: WebGLProgram){
        const viewMatrixLocation = gl.getUniformLocation(program, "u_view");
        gl.uniformMatrix4fv(viewMatrixLocation, false, this.viewMatrix);
    }

    setProjectionUniform(gl: WebGL2RenderingContext, program: WebGLProgram){
        const projectionMatrixLocation = gl.getUniformLocation(program, "u_projection");
        gl.uniformMatrix4fv(projectionMatrixLocation, false, this.projectionMatrix);
    };


    cameraHandle() {
        // @Todo: 카메라 움직임 구현
    }
}

export const camera = new _Camera();