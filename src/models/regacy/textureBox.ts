import { ShaderProgram } from "../../renderer/shaderProgram";
import * as glm from 'gl-matrix'

const TexutreBoxShader = {
    vertex: `# version 300 es
in vec4 position;
in vec2 a_texcoord;

uniform float u_aspectRatio;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

out vec2 v_texcoord;

void main() {
    gl_Position = projection * view * model * position;

    v_texcoord = a_texcoord;
}
`,
    fragment: `# version 300 es
precision highp float;

in vec2 v_texcoord;

uniform sampler2D u_texture0;
uniform sampler2D u_texture1;

out vec4 outColor;

void main() {
    vec4 color0 = texture(u_texture0, v_texcoord);
    vec4 color1 = texture(u_texture1, v_texcoord);


    outColor = color0 + color1 * 0.2;
}
`
}
export class TextureBox {
    program?: WebGLProgram;
    vao: WebGLVertexArrayObject | null = null;

    vertex = {
        vertex: [
            -1,1,1, //v0
            -1,1,-1, //v1
            1,1,-1, //v2
            1,1,1, //v3
            -1,-1,1, //v4
            1,-1,1, //v5
            1,-1,-1, //v6
            -1,-1,-1, //v7
        ],
        index: [
            // 앞면
            3,0,4,
            3,4,5,
            // 아랫면
            5,4,7,
            5,7,6,
            // 윗면
            1,0,2,
            2,0,3,
            // 뒷면
            2,7,1,
            2,6,7,
            // 오른쪽면
            2,3,5,
            2,5,6,
            // 왼쪽면
            1,4,0,
            1,7,4,
        ],
        uv: [
            0,1, // v0
            1,1, // v1
            0,1, // v2
            1,1, // v3
            0,0, // v4
            1,0, // v5
            0,0, // v6
            1,0, // v7
        ],
        float32Data: [
            -1,1,1,0,1, //v0
            -1,1,-1,1,1, //v1
            1,1,-1,1,1, //v2
            1,1,1,1,1, //v3
            -1,-1,1,0,0, //v4
            1,-1,1,1,0, //v5
            1,-1,-1,1,1, //v6
            -1,-1,-1,1,0, //v7
        ],
    }

    isWallLoad = false;
    isAwesomeFaceLoad = false;

    modelMatrix = glm.mat4.create();

    images = [
        new Image(),
        new Image(),
    ];

    cameraPosition = [0,0,5];
    lookAtPoint = [0,0,0];
    upDirection = [0,1,0];

    viewMatrix = glm.mat4.lookAt(
        glm.mat4.create(),
        new Float32Array(this.cameraPosition),
        new Float32Array(this.lookAtPoint),
        new Float32Array(this.upDirection)
    );

    view = {
        projectionMatrix: glm.mat4.perspective(
            glm.mat4.create(),
            55 * Math.PI / 180, // fov
            this.gl ? this.gl.canvas.width / this.gl.canvas.height : 1, // aspect
            0.1, // near clipping
            100.0, // far clipping
        )
    }

    xDegree = 0;
    yDegree = 0;
    increase = 1;


    constructor(
        private gl: WebGL2RenderingContext | null,
        ) {
        if(!this.gl){
            console.error('WebGL2RenderingContext가 존재하지 않습니다.');
            return;
        }

        Promise.all([
            this.imageLoad(0, './src/assets/wall.jpg'),
            this.imageLoad(1, './src/assets/awesomeface.png')
        ]).then(()=>{
            if(!this.gl) return;
            this.shaderInitialize(this.gl);
        })
    }

    imageLoad(index:number,src:string) {
        return new Promise((resolove)=>{
            this.images[index].src = src;
            this.images[index].addEventListener('load',()=>{
                resolove(true);
            })
        });
    }

    shaderInitialize(gl:WebGL2RenderingContext) {
        const vertexShader = ShaderProgram.createShader(gl, TexutreBoxShader.vertex, gl.VERTEX_SHADER);
        const fragmentShader = ShaderProgram.createShader(gl, TexutreBoxShader.fragment, gl.FRAGMENT_SHADER);

        if(!vertexShader || !fragmentShader) return;

        this.program = ShaderProgram.createProgram(gl, vertexShader, fragmentShader);

        this.gl?.useProgram(this.program!);
        this.bindBuffer();
        this.createTexture();
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

        this.gl.vertexAttribPointer(
            positionAttributeLocation, 
            3, 
            this.gl.FLOAT, 
            false, 
            5*Float32Array.BYTES_PER_ELEMENT,
            0
        );

        this.gl.vertexAttribPointer(
            textureAttributeLocation, 
            2, 
            this.gl.FLOAT, 
            false, 
            5*Float32Array.BYTES_PER_ELEMENT, 
            3*Float32Array.BYTES_PER_ELEMENT
        );
    }

    createTexture(){
        if(!this.gl || !this.program) return;

        const textures = [];
        for(let i = 0 ; i < 2 ; i++){
            const texture = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

            // 밉맵을 사용하지 않는 파라메터를 설정합니다.
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

    
            this.gl.texImage2D(
                this.gl.TEXTURE_2D,
                0,
                this.gl.RGBA,
                this.gl.RGBA,
                this.gl.UNSIGNED_BYTE,
                this.images[i]
            );
            // this.gl.generateMipmap(this.gl.TEXTURE_2D);
            textures.push(texture);
        }

        const u_image0Location = this.gl.getUniformLocation(this.program, 'u_texture0');
        const u_image1Location = this.gl.getUniformLocation(this.program, 'u_texture1');

        this.gl.uniform1i(u_image0Location, 0);
        this.gl.uniform1i(u_image1Location, 1);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textures[0]);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textures[1]);
    }

    createIndexBuffer(){
        if(!this.gl) return;

        const indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.vertex.index), this.gl.STATIC_DRAW);
    }

    createUniformBuffer() {
        if(!this.gl || !this.program) return;

        const aspectRatio = this.gl.getUniformLocation(this.program, 'u_aspectRatio');

        this.gl.uniform1f(aspectRatio, this.gl.canvas.width / this.gl.canvas.height);

        const moveMatrix = this.gl.getUniformLocation(this.program, 'model');
        this.gl.uniformMatrix4fv(moveMatrix, false, this.modelMatrix);

        // 모델 매트릭스 업데이트
        {
            this.xDegree += this.increase;
            this.yDegree += this.increase;

            const move = glm.mat4.create();

            glm.mat4.scale(move,move,[0.5,0.5,0.5]);
            glm.mat4.rotateX(move,move,this.xDegree * Math.PI / 180);
            glm.mat4.rotateY(move,move,this.yDegree * Math.PI / 180);
            this.modelMatrix = move;
        }

        const projectionMatrix = this.gl.getUniformLocation(this.program, 'projection');
        this.gl.uniformMatrix4fv(projectionMatrix, false, this.view.projectionMatrix);

        const viewMatrix = this.gl.getUniformLocation(this.program, 'view');
        this.gl.uniformMatrix4fv(viewMatrix, false, this.viewMatrix);
    }

    render(){
        if(!this.gl || !this.program || !this.vao) return;

        const indexType = this.gl.UNSIGNED_SHORT;
        this.gl.useProgram(this.program);
        // texutre를 uniform으로 넘겨주기 때문에 draw시 호출하도록 수정
        this.createUniformBuffer();
        this.gl.bindVertexArray(this.vao);
        this.gl.drawElements(this.gl.TRIANGLES, this.vertex.index.length, indexType, 0);
    }
}