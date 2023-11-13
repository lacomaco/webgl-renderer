import * as glm from 'gl-matrix';
import { Circle2D } from "../models/regacy/circle2D";
import { TextureBox } from "../models/textureBox";
import { ModelObject } from '../models/modelObject';


export class Renderer {
    canvas = document.createElement('canvas');
    gl = this.canvas.getContext("webgl2");

    circles: Circle2D[] = [];
    textureBox = new TextureBox(this.gl);

    constructor() {
        this.initialize();

        {
            const move = glm.mat4.create();

            glm.mat4.scale(move,move,[0.5,0.5,0.5]);
            glm.mat4.rotateX(move,move,15*Math.PI / 180);
            glm.mat4.rotateY(move,move,110*Math.PI / 180);
            this.textureBox.modelMatrix = move;
        }

        const test = new ModelObject();
    }

    initialize(){
        document.body.appendChild(this.canvas);
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.gl?.viewport(0,0,this.canvas.width, this.canvas.height);
    }

    render(){
        if(!this.gl) return;
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clearDepth(1.0);
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.textureBox.render();

    }

    keepRerender(){
        this.render();
        requestAnimationFrame(this.keepRerender.bind(this));
    }
}