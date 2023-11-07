import * as glm from "gl-matrix";
import { ShaderProgram } from "../renderer/shaderProgram"

const TriangleShader = {
    vertex: `#version 300 es

layout(location=0) in vec4 position;
in vec3 color;
uniform mat4 rotationMatrix;

out vec3 varyingColor;

void main() {
    gl_Position = position * rotationMatrix;
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
            0.5, 0,
        ],
        color: [
            1,0,0,
            0,1,0,
            0,0,1,
        ],
        index: [
            0,2,1
        ],
        float32Data: [
            0, 0, 1, 0, 0,
            0, 0.5, 0, 1, 0,
            0.5, 0, 0, 0, 1,
        ]
    }

    // vertex-shader in vec4 position;
    vao : WebGLVertexArrayObject | null = null;

    rotation = 0; // radian임
    rotationMatrix = glm.mat4.create();

    constructor(private gl: WebGL2RenderingContext | null) {
        if(!this.gl){
            console.error('WebGL2RenderingContext가 존재하지 않습니다.');
            return;
        }

        this.shaderInitialize();
        this.controller();
    }

    controller(){
        const input = document.querySelector('input[type="range"]');
        input?.addEventListener('input',(e: any)=>{
            this.rotation = glm.glMatrix.toRadian(e.target.value);
        });
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
        this.createInitBuffer();
    }

    createInitBuffer() {
        if(!this.gl || !this.program) return;

        const vertexPositionAttributeLocation = this.gl.getAttribLocation(this.program, 'position');
        const vertexColorAttributeLocation = this.gl.getAttribLocation(this.program, 'color');

        // 교훈을 위해 남겨둠. 버퍼는 enableAttribute 이후에 생성해야함.
        // const indexBuffer = this.gl.createBuffer();
        // this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        // this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.vertex.index), this.gl.STATIC_DRAW);

        this.gl.bindVertexArray(this.vao); // <-- enableVertexAttribArray를 호출하기 위해 필요함.

        this.gl.enableVertexAttribArray(vertexPositionAttributeLocation);
        this.gl.enableVertexAttribArray(vertexColorAttributeLocation);

        // 버퍼 생성
        // 버퍼는 enableVertexAttribArray 다음에 생성하는것이 좋음.
        // 원인은 모르겠지만 indexBuffer를 enableVertexAttribArray 이전에 생성하면 정점이 그려지지 않는 이슈가 있음.
        const indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.vertex.index), this.gl.STATIC_DRAW);

        const vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertex.float32Data), this.gl.STATIC_DRAW);
        // 버퍼 생성


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

    putUniformBuffer(){
        if(!this.gl || !this.program) return;

        const rotationMatrix = this.gl.getUniformLocation(this.program, 'rotationMatrix');
        glm.mat4.rotateZ(this.rotationMatrix, glm.mat4.create(), this.rotation);

        this.gl.uniformMatrix4fv(rotationMatrix, false, this.rotationMatrix);

    }

    drawTriangle(){
        if(!this.gl || !this.program){
            return;
        }

        this.gl.useProgram(this.program);
        this.putUniformBuffer();
        this.gl.bindVertexArray(this.vao);
        const indexType = this.gl.UNSIGNED_SHORT;
        this.gl.drawElements(this.gl.TRIANGLES,3,indexType,0);
    }
}