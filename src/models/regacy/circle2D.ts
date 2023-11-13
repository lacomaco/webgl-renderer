import * as glm from 'gl-matrix';
import { ShaderProgram } from "../../renderer/shaderProgram"

const Circle2DShader = {
    vertex: `# version 300 es
in vec4 a_position;
    
uniform vec3 u_color;
uniform float u_aspectRatio;

void main() {
    gl_Position = a_position;
    gl_Position.y *= u_aspectRatio;
}
`,
    fragment: `# version 300 es
precision highp float;

uniform vec3 u_color;

out vec4 outColor;

void main() {
    outColor = vec4(u_color.xyz, 1);
}
`
}

export class Circle2D {
    program?: WebGLProgram;
    vao: WebGLVertexArrayObject | null = null;

    vertices:number[] = [];
    indexs:number[] = [];

    triangleCount = 60;

    constructor(
        private gl: WebGL2RenderingContext | null,
        private center: [number,number,number],
        private colors: [number,number,number],
        private radius: number, // 0 ~ 1
        ) {
        if(!this.gl){
            return;
        }
        this.initCircle();
        this.shaderInitialize();
    }

    initCircle() {
        const twoPI = Math.PI * 2;
        const deltaTheta = twoPI / this.triangleCount;

        this.vertices.push(this.center[0]);
        this.vertices.push(this.center[1]);
        this.vertices.push(this.center[2]);

        for(let theta = 0; theta < twoPI; theta += deltaTheta){

            this.vertices.push(this.center[0] + Math.cos(theta) * this.radius);
            this.vertices.push(this.center[1] + Math.sin(theta) * this.radius);
            this.vertices.push(this.center[2]);
        }

        for(let i = 1; i <= this.triangleCount; i++){
            this.indexs.push(0); // 중심원

            if(i === 1){
                this.indexs.push(this.triangleCount);
            }else {
                this.indexs.push(i - 1);
            }

            this.indexs.push(i);
        }
    }

    shaderInitialize() {
        if(!this.gl) return;

        const vertexShader = ShaderProgram.createShader(this.gl, Circle2DShader.vertex, this.gl.VERTEX_SHADER, 'Triangle');
        const fragmentShader = ShaderProgram.createShader(this.gl, Circle2DShader.fragment, this.gl.FRAGMENT_SHADER, 'Triangle');

        if(vertexShader === undefined || fragmentShader === undefined) return;

        this.program = ShaderProgram.createProgram(this.gl, vertexShader, fragmentShader);
        if(this.program === undefined) return;
        this.vao = this.gl.createVertexArray();
        this.createInitBuffer();
    }

    createInitBuffer() {
        if(!this.gl || !this.program) return;

        const vertexPositionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');

        this.gl.bindVertexArray(this.vao);

        this.gl.enableVertexAttribArray(vertexPositionAttributeLocation);

        // 인덱스 버퍼 생성
        const indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexs), this.gl.STATIC_DRAW);

        const vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);

        this.gl.vertexAttribPointer(
            vertexPositionAttributeLocation,
            3,
            this.gl.FLOAT,
            false,
            0, // vertex 버퍼만 넘기니까 0
            0
        );
    }

    putUniformBuffer() {
        if(!this.gl || !this.program) return;

        const colorUniformLocation = this.gl.getUniformLocation(this.program, 'u_color');
        this.gl.uniform3fv(colorUniformLocation, this.colors);

        const aspectRatio = this.gl.canvas.width / this.gl.canvas.height;
        const aspectRatioUniformLocation = this.gl.getUniformLocation(this.program, 'u_aspectRatio');
        this.gl.uniform1f(aspectRatioUniformLocation, aspectRatio);
    }

    draw() {
        if(!this.gl || !this.program || !this.vao) return;

        this.gl.useProgram(this.program);
        this.gl.bindVertexArray(this.vao);

        this.putUniformBuffer();

        this.gl.drawElements(
            this.gl.TRIANGLES,
            this.indexs.length,
            this.gl.UNSIGNED_SHORT,
            0
        );
    }
}