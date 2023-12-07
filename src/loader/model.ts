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

export const textureMap = new Map<number, WebGLTexture>();

export class Model {
  public isModelLoaded = new BehaviorSubject(false);

  private meshes: Mesh[] = [];
  private directory: string = "";

  fbxLoader = new FBXLoader();
  objLoader = new OBJLoader();
  mtlLoader = new MTLLoader();

  constructor(
    // 나중에 undefind 지우고 실구현할거임
    private gl: WebGL2RenderingContext,
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
      const mesh = this.processMesh(group);
      this.meshes.push(mesh);
    }

    group.children.forEach((group) => this.processNode(group));
  }

  private processMesh(mesh: TMESH) {
    /*
      three mesh -> mesh로 변환해주세요 ~ㅇㅅㅇ~
    */
    const vertices: Vertex[] = [];
    let indices: number[] = [];
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
    if(mesh.geometry.attributes.index){
      indices = [...mesh.geometry.attributes.index.array];
    } else {
      // index없으면 position 순서대로 그림
      for(let i=0; i< mesh.geometry.attributes.position.count/3; i++) {
        indices.push(i);
      }
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
        });
        this.createTexture(covertedMaterial.aoMap.id,covertedMaterial.aoMap.source.data);
    }

    // specular
    if(covertedMaterial.specularMap){
        textures.push({
            id: covertedMaterial.specularMap.id,
            type: TextureType.Specular,
        })
        this.createTexture(covertedMaterial.specularMap.id,covertedMaterial.specularMap.source.data);
    }

    // normalMap
    if(covertedMaterial.normalMap){
        textures.push({
            id: covertedMaterial.normalMap.id,
            type: TextureType.Normal,
        })
        this.createTexture(covertedMaterial.normalMap.id,covertedMaterial.normalMap.source.data);
    }

    return new Mesh(
        vertices,
        indices,
        textures,
        this.gl,
    );
  }

  private createVertexData(vertices: number[]) {
    const uniqueVertices:number[] = [];
    const indices:number[] = [];
    const vertexMap = new Map<string,number>();

    for (let i = 0; i < vertices.length; i += 3) {
        const vertex = [vertices[i], vertices[i + 1], vertices[i + 2]].join(',');

        if (vertexMap.has(vertex)) {
            // 중복 정점의 인덱스 사용
            indices.push(vertexMap.get(vertex) as number);
        } else {
            // 새 정점 추가 및 인덱스 할당
            const index = uniqueVertices.length / 3;
            uniqueVertices.push(vertices[i], vertices[i + 1], vertices[i + 2]);
            vertexMap.set(vertex, index);
            indices.push(index);
        }
    }

    return { uniqueVertices, indices };
}


  private createTexture(id: number,image: HTMLImageElement){
    if(textureMap.has(id)){
        return;
    }
    
    const texture = this.gl.createTexture() as WebGLTexture ;
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
    textureMap.set(id,texture);
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
