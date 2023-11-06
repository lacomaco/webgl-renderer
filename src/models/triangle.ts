import { ShaderProgram } from "../renderer/shaderProgram"

const TriangleShader = {
    vertex: `#version 300 es

in vec4 position;
in vec3 color;

out vec3 varyingColor;

void main() {
    gl_Position = position;
    varyingColor = color;
}
    `,
    fragment: `#version 300 es
precision highp float;

in vec3 varyingColor;
out vec4 outColor;

void main() {
    outColor = vec4(varyingColor.xyz, 1);
}
    `,
}

export class Triangle {
    program?: WebGLProgram;

    vertex = {
        position: [
            0, 0,
            0, 0.5,
            0.7, 0,
        ],
        color: [
            1,0,0,
            0,1,0,
            0,0,1,
        ],
        float32Data: [
            0, 0, 1, 0, 0,
            0, 0.5, 0, 1, 0,
            0.7, 0, 0, 0, 1,
        ]
    }

    // vertex-shader in vec4 position;
    positionAttributeLocation: number | null = null;
    vao : WebGLVertexArrayObject | null = null;

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

        this.vao = this.gl.createVertexArray();
        this.putVertexBuffer();
    }

    putVertexBuffer() {
        if(!this.gl || !this.program) return;

        const vertexPositionAttributeLocation = this.gl.getAttribLocation(this.program, 'position');
        const vertexColorAttributeLocation = this.gl.getAttribLocation(this.program, 'color');

        const vertexBuffer = this.gl.createBuffer();

        if(!vertexBuffer){
            console.error('triangle buffer 생성 실패!');
            return;
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertex.float32Data), this.gl.STATIC_DRAW);

        this.gl.bindVertexArray(this.vao); // <-- enableVertexAttribArray를 호출하기 위해 필요함.

        this.gl.enableVertexAttribArray(vertexPositionAttributeLocation);
        this.gl.enableVertexAttribArray(vertexColorAttributeLocation);

        /*
        * [주의!!!!] vertexAttribPointer, stride, offset은 bytes 기준으로 값을 넣어줘야함.
        */
        // position attribute
        this.gl.vertexAttribPointer(
            vertexPositionAttributeLocation, 
            2, // size
            this.gl.FLOAT, // type
            false,  // normalize 여부
            5*Float32Array.BYTES_PER_ELEMENT, // stride <- size * typeof(type) 순으로 버퍼를 읽음
            0 // offset
            );

        // color attribute
        this.gl.vertexAttribPointer(
            vertexColorAttributeLocation, 
            3, // size
            this.gl.FLOAT, // type
            false,  // normalize 여부
            5*Float32Array.BYTES_PER_ELEMENT, // stride <- size * typeof(type) 순으로 버퍼를 읽음
            2*Float32Array.BYTES_PER_ELEMENT // offset
        );
    }

    drawTriangle(){
        if(!this.gl || !this.program){
            return;
        }

        this.gl.useProgram(this.program);
        this.gl.bindVertexArray(this.vao);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    }
}