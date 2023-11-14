import * as glm from 'gl-matrix';
import { Circle2D } from "../models/regacy/circle2D";
import { TextureBox } from "../models/regacy/textureBox";
import { ModelObject } from '../models/modelObject';
import { Model } from '../models/model';


export class Renderer {
    canvas = document.createElement('canvas');
    gl = this.canvas.getContext("webgl2");

    boxModel = new Model('./src/assets/cube/cubeModel.json',this.gl);

    constructor() {
        this.initialize();
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
        this.boxModel.render();

    }

    keepRerender(){
        this.render();
        requestAnimationFrame(this.keepRerender.bind(this));
    }
}