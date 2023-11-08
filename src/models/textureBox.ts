import { ShaderProgram } from "../renderer/shaderProgram";

const TexutreBoxShader = {
    vertex: `# version 300 es
in vec4 position;
in vec2 a_texcoord;

out vec2 v_texcoord;

void main() {
    gl_Position = position;
    v_texcoord = a_texcoord;
}
`,
    fragment: `# version 300 es
precision highp float;

in vec2 v_texcoord;

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
    outColor = texture(u_texture, v_texcoord);
}
`
}
export class TextureBox {
    program?: WebGLProgram;
    vao: WebGLVertexArrayObject | null = null;

    vertex = {
        index: [
            0,1,2,
            0,2,3
        ],
        float32Data: [
            0,0, 1,1, // 중앙
            -1,0, 0,1, // 왼쪽 중앙
            -1,-1, 0,0, // 왼쪽 아래
            0,-1, 1,0, // 아래 중앙
        ],
    }

    isWallLoad = false;
    isAwesomeFaceLoad = false;

    wallImage = new Image();
    awesomeFaceImage = new Image();

    constructor(private gl: WebGL2RenderingContext | null) {
        if(!this.gl){
            console.error('WebGL2RenderingContext가 존재하지 않습니다.');
            return;
        }

        Promise.all([
            this.imageLoad(this.wallImage, './src/assets/wall.jpg'),
            this.imageLoad(this.awesomeFaceImage, './src/assets/awesomeface.png')
        ]).then(()=>{
            if(!this.gl) return;
            this.shaderInitialize(this.gl);
        })
    }

    imageLoad(image: HTMLImageElement,src:string) {
        return new Promise((resolove)=>{
            image.src = src;
            image.addEventListener('load',()=>{
                resolove(true);
            })
        });
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
        const textureAttributeLocation = this.gl.getAttribLocation(this.program, 'a_texcoord');

        this.gl.enableVertexAttribArray(positionAttributeLocation);
        this.gl.enableVertexAttribArray(textureAttributeLocation);

        const vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertex.float32Data), this.gl.STATIC_DRAW);

        // 텍스처 바인드
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            this.wallImage
        );
        this.gl.generateMipmap(this.gl.TEXTURE_2D);

        // 텍스처 바인드 끝

        this.gl.vertexAttribPointer(
            positionAttributeLocation, 
            2, 
            this.gl.FLOAT, 
            false, 
            4*Float32Array.BYTES_PER_ELEMENT,
            0
        );

        this.gl.vertexAttribPointer(
            textureAttributeLocation, 
            2, 
            this.gl.FLOAT, 
            false, 
            4*Float32Array.BYTES_PER_ELEMENT, 
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