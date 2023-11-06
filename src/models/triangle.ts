import { ShaderProgram } from "../renderer/shaderProgram"

const TriangleShader = {
    vertex: `#version 300 es

in vec4 position;

void main() {
    gl_Position = position;
}
    `,
    fragment: `#version 300 es
precision highp float;

out vec4 outColor;

void main() {
    outColor = vec4(1, 0, 0.5, 1);
}
    `,
}

export class Triangle {
    program?: WebGLProgram;

    vertex = [
        0, 0,
        0, 0.5,
        0.7, 0,
    ];

    // vertex-shader in vec4 position;
    positionAttributeLocation: number | null = null;
    vao : WebGLVertexArrayObject | null = null;

    positionAttributeBufferInfo = {
        size: 2,
        normalize: false,
        stride: 0,
        offset: 0,
    }

    constructor(private gl: WebGL2RenderingContext | null) {
        if(!this.gl){
            console.error('WebGL2RenderingContext가 존재하지 않습니다.');
            return;
        }

        this.shaderInitialize();
    }

    /*
     * constructor에서 최초 한번만 실행하길 권장함.
     * 다음과 같은 임무를 수행함.
     * 1. 쉐이더 프로그램 컴파일
     * 2. 쉐이더 프로그램 생성
     * 3. 쉐이더 프로그램 링킹
     * 4. 정점 버퍼 생성
     * 5. 정점 버퍼 주입
     * 6. 쉐이더 프로그램 내 attribute 변수 위치 찾기
     */
    shaderInitialize(){
        if(!this.gl) return;
        const vertexShader = ShaderProgram.createShader(this.gl, TriangleShader.vertex, this.gl.VERTEX_SHADER, 'Triangle');
        const fragmentShader = ShaderProgram.createShader(this.gl, TriangleShader.fragment, this.gl.FRAGMENT_SHADER, 'Triangle');

        if(vertexShader === undefined || fragmentShader === undefined) return;

       this.program = ShaderProgram.createProgram(this.gl, vertexShader, fragmentShader, 'Triangle');

        if(this.program === undefined) return;

        this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'position');

        const vertexBuffer = this.gl.createBuffer();

        if(!vertexBuffer){
            console.error('triangle buffer 생성 실패!');
            return;
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertex), this.gl.STATIC_DRAW);

        this.vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.vao); // <-- enableVertexAttribArray를 호출하기 위해 필요함.
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.vertexAttribPointer(
            this.positionAttributeLocation, 
            this.positionAttributeBufferInfo.size, // size
            this.gl.FLOAT, // type
            this.positionAttributeBufferInfo.normalize,  // normalize 여부
            this.positionAttributeBufferInfo.stride, // stride <- size * typeof(type) 순으로 버퍼를 읽음
            this.positionAttributeBufferInfo.offset // offset
            );
    }

    drawTriangle(){
        if(!this.gl || !this.program){
            console.log('삼각형 그리기 실패!');
            return;
        }

        console.log('그려');

        this.gl.useProgram(this.program);
        this.gl.bindVertexArray(this.vao);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    }
}