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


    cameraHandle() {
        // @Todo: 카메라 움직임 구현
    }
}

export const camera = new _Camera();