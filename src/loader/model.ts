import { Mesh } from "./mesh";
import { FBXLoader } from "three/examples/jsm/loaders/fbxLoader.js";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { BehaviorSubject } from "rxjs";
import { Shader } from "../shader/shader";


export class Model {
    public isModelLoaded = new BehaviorSubject(false);

    private meshes: Mesh[] = [];
    private directory: string = '';
    /*
    fbx일 경우엔 directoryPath만

    obj경우엔 obj, mtl 둘다 채워주세요 ~ㅇㅅㅇ~
    */
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
        this.meshes.forEach((mesh)=>{
            mesh.draw(shader);
        });
    }

    private async init() {
        const result = await this.loadModel();
        console.log(result);
    }

    private loadModel(){
        return new Promise((resolve,reject)=>{
            if(this.mtl){
                this.mtlLoader.load(this.mtl,(materials)=>{
                    materials.preload();
                    this.objLoader.setMaterials(materials);

                    this.objLoader.load(this.directory,(obj)=>{
                        resolve(obj);
                    });
                })

                return;
            }

            this.fbxLoader.load(this.directoryPath,(obj)=>{
                resolve(obj);
            });
        });
    }

    private processNode() {
        /*
        three object node -> mesh로 변환해주세요 ~ㅇㅅㅇ~
        */
    }

    private processMesh() {
        /*
        three mesh -> mesh로 변환해주세요 ~ㅇㅅㅇ~
        */
    }

    async loadMeterialTexture() {
        /*
        mtl 파일을 로드해서 텍스처를 로드해주세요 ~ㅇㅅㅇ~
        */
    }
}