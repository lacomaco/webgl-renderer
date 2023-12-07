import { Mesh, Texture, TextureType, Vertex } from "./mesh";
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
  MeshLambertMaterial
} from "three";

export class Model {
  public isModelLoaded = new BehaviorSubject(false);

  private meshes: Mesh[] = [];
  private directory: string = "";

  fbxLoader = new FBXLoader();
  objLoader = new OBJLoader();
  mtlLoader = new MTLLoader();

  constructor(
    // 나중에 undefind 지우고 실구현할거임
    private gl: WebGL2RenderingContext | string,
    private directoryPath: string,
    private mtl?: string,
  ) {
    this.init();
  }

  draw(shader: Shader) {
    this.meshes.forEach((mesh) => {
      mesh.draw(shader);
    });
  }

  private async init() {
    const result = await this.loadModel();
    console.log(result);
    this.processNode(result);

    this.disposeLoadeObj(result);
  }

  private loadModel(): Promise<Group> {
    return new Promise((resolve, reject) => {
      if (this.mtl) {
        this.mtlLoader.load(this.mtl, (materials) => {
          materials.preload();
          this.objLoader.setMaterials(materials);

          this.objLoader.load(this.directory, (obj) => {
            resolve(obj);
          });
        });

        return;
      }

      this.fbxLoader.load(this.directoryPath, (obj) => {
        resolve(obj);
      });
    });
  }

  private processNode(group: Group | Object3D) {
    if (group instanceof TMESH) {
      //const mesh = this.processMesh(group) as Mesh;
      //this.meshes.push(mesh);
    }

    group.children.forEach((group) => this.processNode(group));
  }

  private processMesh(mesh: TMESH) {
    /*
        three mesh -> mesh로 변환해주세요 ~ㅇㅅㅇ~
        */
    const vertices: Vertex[] = [];
    const indices: number[] = [];
    const textures: Texture[] = [];

    const limit = mesh.geometry.attributes.position.count / 3;
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
    for(let i=0; i < mesh.geometry.attributes.index.count; i++) {
      indices.push(mesh.geometry.attributes.index.array[i]);
    }

    // diffuse
    const covertedMaterial = mesh.material as MeshLambertMaterial;
    if(covertedMaterial.map){
        textures.push({
            id: covertedMaterial.map.id,
            type: TextureType.Diffuse,
        })
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
    if(covertedMaterial.aoMap){
        textures.push({
            id: covertedMaterial.aoMap.id,
            type: TextureType.Ambient,
        })
    }

    // specular
    if(covertedMaterial.specularMap){
        textures.push({
            id: covertedMaterial.specularMap.id,
            type: TextureType.Specular,
        })
    }

    // normalMap
    if(covertedMaterial.normalMap){
        textures.push({
            id: covertedMaterial.normalMap.id,
            type: TextureType.Normal,
        })
    }

    // heightMap
    if(covertedMaterial.displacementMap){
        textures.push({
            id: covertedMaterial.displacementMap.id,
            type: TextureType.Height,
        })
    }


    return new Mesh(
        vertices,
        indices,
        textures,
        // @Todo gl undefined 빠지면 이것도 수정할것.
        this.gl as WebGL2RenderingContext,
    );
    
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
