import {
  Mesh,
  Texture,
  TextureType,
  Vertex,
  VertexMaterial,
  MeshMaterial,
} from "./mesh";
import { FBXLoader } from "three/examples/jsm/loaders/fbxLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { BehaviorSubject } from "rxjs";
import { Shader } from "../shader/shader";
import {
  Group,
  Object3D,
  Mesh as TMESH,
  BufferGeometry,
  Material,
  MeshLambertMaterial,
  LoadingManager,
  MeshPhongMaterial,
} from "three";

export const textureMap = new Map<number, any>();

const manager = new LoadingManager();

let modelLoadCallbackQueue: any[] = [];

export class Model {
  public isModelLoaded = new BehaviorSubject(false);

  private meshes: Mesh[] = [];

  fbxLoader = new FBXLoader(manager);
  objLoader = new OBJLoader(manager);
  mtlLoader = new MTLLoader(manager);

  static defaultTexture = undefined;

  modelWorldData = {
    currentXRotate: 0,
    xIncrease: 0.008,
    currentYRotate: 0,
    yIncrease: 0.008,
    scale:1,
  };

  constructor(
    // 나중에 undefind 지우고 실구현할거임
    private gl: WebGL2RenderingContext,
    private directoryPath: string,
    private mtl?: string,
  ) {
    this.init();
  }

  setScale(scale:number){
    this.modelWorldData.scale = scale;
  }

  setRotateX(x: number) {
    this.modelWorldData.currentXRotate = x;
  }

  setRotateY(y: number) {
    this.modelWorldData.currentYRotate = y;
  }

  draw(shader: Shader) {
    if (this.meshes.length === 0) return;
    this.meshes.forEach((mesh) => {
      mesh.setScale(this.modelWorldData.scale);
      mesh.setRotateX(this.modelWorldData.currentXRotate);
      mesh.setRotateY(this.modelWorldData.currentYRotate);
      mesh.draw(shader);
    });
  }

  private async init() {
    try{
      const result = await this.loadModel();
      modelLoadCallbackQueue.push(
        () => {
          this.processNode(result);
          this.disposeLoadeObj(result);
          this.isModelLoaded.next(true);
        }
      );
      manager.onLoad = () => {
        modelLoadCallbackQueue.forEach(callback => callback());
        modelLoadCallbackQueue = [];
      };
    }catch(e){
      console.error(e);
    }
  }

  private loadModel(): Promise<Group> {
    return new Promise((resolve, reject) => {
      if (this.mtl) {
        this.mtlLoader.load(this.mtl, (materials) => {
          materials.preload();
          this.objLoader.setMaterials(materials);

          this.objLoader.load(this.directoryPath, (obj) => {
            resolve(obj);
          },()=>{},(e)=>{
            console.error(e);  
            reject(e)
          });
        });

        return;
      }

      this.fbxLoader.load(this.directoryPath, (obj) => {
        resolve(obj);
      },()=>{},(e)=>{
        console.error(e);
        reject(e)
      });
    });
  }

  private processNode(group: Group | Object3D) {
    if (group instanceof TMESH) {
      const mesh = this.processMesh(group);
      this.meshes.push(mesh);
    }

    group.children.forEach((group) => this.processNode(group));
  }

  private processMesh(mesh: TMESH) {
    const vertices: Vertex[] = [];
    let indices: number[] = [];
    // MeshMaterial 사용하도록 구조 변경 해야함...
    const meshsMaterials: MeshMaterial[] = [];

    const limit = mesh.geometry.attributes.position.count;
    let count = 0;

    // vertices 작업
    while (count < limit) {
      const position: [number, number, number] = [
        mesh.geometry.attributes.position.array[count * 3],
        mesh.geometry.attributes.position.array[count * 3 + 1],
        mesh.geometry.attributes.position.array[count * 3 + 2],
      ];
      const normal: [number, number, number] = [
        mesh.geometry.attributes.normal.array[count * 3],
        mesh.geometry.attributes.normal.array[count * 3 + 1],
        mesh.geometry.attributes.normal.array[count * 3 + 2],
      ];
      const texcoords: [number, number] = [
        mesh.geometry.attributes.uv.array[count * 2] ?? 0,
        mesh.geometry.attributes.uv.array[count * 2 + 1] ?? 0,
      ];

      vertices.push({
        position,
        normal,
        texcoords,
      });

      count++;
    }

    // indices 작업
    if (mesh.geometry.attributes.index) {
      indices = [...mesh.geometry.attributes.index.array];
    } else {
      // index없으면 position 순서대로 그림
      for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
        indices.push(i);
      }
    }

    // diffuse
    let covertedMaterial = mesh.material as
      | MeshLambertMaterial
      | MeshLambertMaterial[]
      | MeshPhongMaterial
      | MeshPhongMaterial[];
    if (!(covertedMaterial instanceof Array)) {
      covertedMaterial = [covertedMaterial];
    }

    covertedMaterial.forEach((material, index) => {
      const textures: Texture[] = [];

      if (material.map) {
        textures.push({
          id: material.map.id,
          type: TextureType.Diffuse,
        });
        this.createTexture(material.map.id, material.map.source?.data);
      }

      /*
     메모 Three.JS map
     alphaMap <- 물체 투명도를 조정하는 map
     aoMap <- Ambient Occlusion Map: 물체 구석 굴곡 그림자 효과 표현
     bumpMap <- 요철같은 표면 표현
     EmissiveMap <- 물체가 스스로 빛을 발하는 맵. ambientMap과 비슷함
     envMap: <- 물체 주변 환경을 반사하는 효과
     lightMap: <- 빛,그림자 효과.
     map <- diffuseMap
     normalMap <- 노말맵 맞음 ㅇㅇ
     specularMap <- 스파큘러맵임 ㅇㅇ
  */

      // ambient
      if (material.aoMap) {
        textures.push({
          id: material.aoMap.id,
          type: TextureType.Ambient,
        });
        this.createTexture(material.aoMap.id, material.aoMap.source.data);
      }

      // specular
      if (material.specularMap) {
        textures.push({
          id: material.specularMap.id,
          type: TextureType.Specular,
        });
        this.createTexture(
          material.specularMap.id,
          material.specularMap.source.data,
        );
      }

      // normalMap
      if (material.normalMap) {
        textures.push({
          id: material.normalMap.id,
          type: TextureType.Normal,
        });
        this.createTexture(
          material.normalMap.id,
          material.normalMap.source.data,
        );
      }

      // material 정립

      // ambient <- 없음 우선은 emissive 로
      let emissive: [number, number, number] = [0, 0, 0];
      let diffuse: [number, number, number] = [1, 1, 1];
      let specular: [number, number, number] = [1, 1, 1];
      let shininess = 0;

      if (material.emissive) {
        emissive = [
          material.emissive.r,
          material.emissive.g,
          material.emissive.b,
        ];
      }

      // diffuse <- color
      if (material.color) {
        diffuse = [material.color.r, material.color.g, material.color.b];
      }

      // specular <- specular
      const phongMaterial = material as MeshPhongMaterial;
      if (phongMaterial.specular) {
        specular = [
          phongMaterial.specular.r,
          phongMaterial.specular.g,
          phongMaterial.specular.b,
        ];
      }

      // shininess <- shininess
      if (phongMaterial.shininess) {
        shininess = phongMaterial.shininess;
      }

      meshsMaterials.push({
        texture: textures,
        material: {
          ambient: emissive,
          diffuse,
          specular,
          shininess,
        },
      });
    });
    return new Mesh(vertices, indices, meshsMaterials, this.gl, mesh);
  }

  private createTexture(id: number, image: HTMLImageElement) {
    if (textureMap.has(id) || !image) {
      return;
    }

    const texture = this.gl.createTexture() as WebGLTexture;
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.NEAREST,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.NEAREST,
    );
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      image,
    );
    textureMap.set(id, texture);
  }

  private disposeLoadeObj(node: Object3D | Group) {
    if (node instanceof TMESH) {
      const mesh = node as TMESH<BufferGeometry, Material | Material[]>;

      if (mesh.geometry) {
        mesh.geometry.dispose();
      }

      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => material.dispose());
        } else {
          (mesh.material as THREE.Material).dispose();
        }
      }
    }

    node.children.forEach((child) => this.disposeLoadeObj(child));
  }
}
