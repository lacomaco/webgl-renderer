import { Circle2D } from "../models/circle2D";

export class Renderer {
    canvas = document.createElement('canvas');
    gl = this.canvas.getContext("webgl2");

    circles: Circle2D[] = [];

    constructor() {
        this.initialize();
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
        this.gl.clearDepth(1.0);
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.circles.forEach((circle)=>{
            circle.draw();
        })
    }

    keepRerender(){
        this.render();
        requestAnimationFrame(this.keepRerender.bind(this));
    }
}