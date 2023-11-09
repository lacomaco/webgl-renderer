import * as glm from 'gl-matrix';
import { Circle2D } from "../models/circle2D";
import { TextureBox } from "../models/textureBox";

export class Renderer {
    canvas = document.createElement('canvas');
    gl = this.canvas.getContext("webgl2");

    circles: Circle2D[] = [];
    textureBox = new TextureBox(this.gl);
    textureBox2 = new TextureBox(this.gl);

    constructor() {
        this.initialize();

        // 첫번쨰 텍스쳐 박스 설정
        {

            const move = glm.mat4.create();
            glm.mat4.translate(move, move, [-0.5,0,0]);
            glm.mat4.scale(move, move, [0.3,0.3,0.3]);
            glm.mat4.rotateY(move, move, Math.PI/4);
            this.textureBox.modelMatrix = move;
        }


        // 첫번쨰 텍스쳐 박스 설정
        {
            const move = glm.mat4.create();
            glm.mat4.translate(move, move, [0.5,0,0]);
            glm.mat4.scale(move, move, [0.3,0.3,0.3]);
            this.textureBox2.modelMatrix = move;
        }
    }

    initialize(){
        document.body.appendChild(this.canvas);
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.gl?.viewport(0,0,this.canvas.width, this.canvas.height);

        if(this.gl){
            this.circles.push(new Circle2D(
                this.gl,
                [-0.1,0.1,0.1],
                [1,0,0],
                0.3
            ),
            new Circle2D(
                this.gl,
                [0,0,0.08],
                [0,1,0],
                0.3
            ),
            new Circle2D(
                this.gl,
                [0.3,0.1,0.3],
                [0,0,1],
                0.3
            ),
            );
        }
    }

    render(){
        if(!this.gl) return;
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.clearDepth(1.0);
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.textureBox.render();
        this.textureBox2.render();

    }

    keepRerender(){
        this.render();
        requestAnimationFrame(this.keepRerender.bind(this));
    }
}