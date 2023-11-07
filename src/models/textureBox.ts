import { ShaderProgram } from "../renderer/shaderProgram";

const TexutreBoxShader = {
    vertex: `# version 300 es
in vec4 position;
in vec3 color;

out vec3 varyingColor;
void main() {
    gl_Position = position;
    varyingColor = color;
}
`,
    fragment: `# version 300 es
precision highp float;

in vec3 varyingColor;
out vec4 outColor;

void main() {
    outColor = vec4(varyingColor.xyz, 1);
}
`
}
export class TextureBox {
    program?: WebGLProgram;
    vao: WebGLVertexArrayObject | null = null;

    vertex = {
        position: [
            0,0,// 중앙 <- 0
            -1,0 // 왼쪽 중앙 <- 1
            -1,-1, // 왼쪽 아래 <- 2
            0,-1 // 아래 중앙 <- 3
        ],
        color: [
            // 다 빨간색 나중에 uv 좌표로 변경할 예정
            1,0,0,
            1,0,0,
            1,0,0,
            1,0,0,
        ],
        index: [
            0,1,2,
            0,2,3
        ],
        float32Data: [
            0,0,1,0,0,
            -1,0,1,0,0,
            -1,-1,1,0,0,
            0,-1,1,0,0,
        ],
    }

    constructor(private gl: WebGL2RenderingContext | null) {
        if(!this.gl){
            console.error('WebGL2RenderingContext가 존재하지 않습니다.');
            return;
        }
        
        this.shaderInitialize(this.gl);
    }

    shaderInitialize(gl:WebGL2RenderingContext) {
        const vertexShader = ShaderProgram.createShader(gl, TexutreBoxShader.vertex, gl.VERTEX_SHADER);
        const fragmentShader = ShaderProgram.createShader(gl, TexutreBoxShader.fragment, gl.FRAGMENT_SHADER);

        if(!vertexShader || !fragmentShader) return;

        this.program = ShaderProgram.createProgram(gl, vertexShader, fragmentShader);

        this.bindBuffer();
    }

    bindBuffer(){
        if(!this.gl || !this.program) return;

        this.vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.vao);

        
        this.createVertexBuffer();
        this.createIndexBuffer();
    }
    
    createVertexBuffer(){
        if(!this.gl || !this.program) return;

        const positionAttributeLocation = this.gl.getAttribLocation(this.program, 'position');
        const colorAttributeLocation = this.gl.getAttribLocation(this.program, 'color');

        this.gl.enableVertexAttribArray(positionAttributeLocation);
        this.gl.enableVertexAttribArray(colorAttributeLocation);

        const vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertex.float32Data), this.gl.STATIC_DRAW);

        this.gl.vertexAttribPointer(
            positionAttributeLocation, 
            2, 
            this.gl.FLOAT, 
            false, 
            5*Float32Array.BYTES_PER_ELEMENT,
            0
        );

        this.gl.vertexAttribPointer(
            colorAttributeLocation, 
            3, 
            this.gl.FLOAT, 
            false, 
            5*Float32Array.BYTES_PER_ELEMENT, 
            2*Float32Array.BYTES_PER_ELEMENT
        );
    }

    createIndexBuffer(){
        if(!this.gl) return;

        const indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.vertex.index), this.gl.STATIC_DRAW);
    }

    drawBox(){
        if(!this.gl || !this.program || !this.vao) return;

        const indexType = this.gl.UNSIGNED_SHORT;

        this.gl.useProgram(this.program);
        this.gl.bindVertexArray(this.vao);
        this.gl.drawElements(this.gl.TRIANGLES, this.vertex.index.length, indexType, 0);
    }
}