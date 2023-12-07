import { Model } from "../loader/model";
import { Shader } from "../shader/shader";
import {shader} from '../shader/modelShader';

export class Renderer {
  canvas = document.createElement("canvas");
  gl = this.canvas.getContext("webgl2") as WebGL2RenderingContext;

  zelda = new Model(this.gl,
    "./src/assets/zelda/zeldaPosed001.fbx");

  shader: Shader;

  constructor() {
    this.shader = new Shader(
      shader.vs,
      shader.fs,
      this.gl,
    );
    this.initialize();
  }

  initialize() {
    document.body.appendChild(this.canvas);
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.gl?.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render() {
    if (!this.gl) return;
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.clearDepth(1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.clearColor(1, 0, 0, 0);
    this.zelda.draw(this.shader);
  }

  keepRerender() {
    this.render();
    requestAnimationFrame(this.keepRerender.bind(this));
  }
}
