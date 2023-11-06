import { Triangle } from "../models/triangle";

export class Renderer {
    canvas = document.createElement('canvas');
    gl = this.canvas.getContext("webgl2");

    triangle: Triangle;

    constructor() {
        this.initialize();
        this.triangle = new Triangle(this.gl);
    }

    initialize(){
        document.body.appendChild(this.canvas);
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.gl?.viewport(0,0,this.gl.canvas.width, this.gl.canvas.height);
    }

    render(){
        if(!this.gl) return;
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.triangle.drawTriangle();
    }
}