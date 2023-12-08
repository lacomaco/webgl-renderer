import { Model } from "../loader/model";
import { Shader } from "../shader/shader";
import { shader } from "../shader/modelShader";

export const defaultTexture = "";

export class Renderer {
  canvas = document.createElement("canvas");
  gl = this.canvas.getContext("webgl2") as WebGL2RenderingContext;

  zelda = new Model(this.gl,"./src/assets/zelda/zeldaPosed001.fbx");

  
  /*
  chair = new Model(
    this.gl,
    "./src/assets/chair/chair.obj",
    "./src/assets/chair/chair.mtl",
  );
  */
  

  shader: Shader;

  constructor() {
    this.shader = new Shader(shader.vs, shader.fs, this.gl);
    //this.chair.setScale(0.3);
    this.zelda.setScale(0.01);
    this.initialize();
  }

  chairUpdate() {
    //this.chair.modelWorldData.currentXRotate += 0.001;
    //this.chair.modelWorldData.currentYRotate += 0.001;
  }

  zeldaUpdate() {
    this.zelda.modelWorldData.currentXRotate += 0.001;
    this.zelda.modelWorldData.currentYRotate += 0.001;
  }

  createWhiteDefaultTexture() {
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    const whitePixel = new Uint8Array([255, 255, 255, 255]);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      1,
      1,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      whitePixel,
    );

    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.LINEAR,
    );
  }

  initialize() {
    document.body.appendChild(this.canvas);
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.gl?.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render() {
    if (!this.gl) return;
    //this.chairUpdate();
    this.zeldaUpdate();
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.clearDepth(1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.clearColor(1, 0, 0, 0);
    this.zelda.draw(this.shader);
    //this.chair.draw(this.shader);
  }

  keepRerender() {
    this.render();
    requestAnimationFrame(this.keepRerender.bind(this));
  }
}
