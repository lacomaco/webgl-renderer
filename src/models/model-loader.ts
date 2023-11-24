import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader.js';
import {Mesh,Object3D, Object3DEventMap, TypedArray} from 'three';
import { loadOBJ } from '../helper/objLoader';

export enum ModelType {
    OBJ = 'obj',
    MTL = 'mtl',
    // 추후 더 추가
    FBX = 'fbx',
}

const ModelLoaders = {
    [ModelType.OBJ]: new OBJLoader(),
    // 추후 더 추가
}

const MaterialLoaders = {
    [ModelType.MTL]: new MTLLoader(),
}

export interface MeshData {
    position: TypedArray,
    normal: TypedArray,
    texcoord: TypedArray,
    indices: TypedArray,
    materialName?: string,
}

export interface Material {
    // 3벡터
    ambient: number[],
    // 3벡터
    diffuse: number[],
    // 3벡터
    specular: number[],
    shininess: number,
    texture: HTMLImageElement,
}

export interface SimpleMeshGroup {
    meshData: MeshData,
    material: Material,
}

export async function modelLoad(url: string, type: ModelType) {
    return new Promise<MeshData[]>((resolve,reject)=>{  
        ModelLoaders[type as keyof typeof ModelLoaders]
        .load(url,(object)=>{
            const meshDatas: MeshData[] = [];

            object.children.forEach((obj)=>{
                createMeshData(obj,meshDatas);
            });
            
            console.log(meshDatas);
            resolve(meshDatas);
        },(progress)=>{
            //console.log(progress.total);
        },(error)=>{
            console.error(error);
            reject(error);
        })
    });
}

// 하얀색 기본 texutre 용 데이터
const canvas = document.createElement('canvas');
canvas.width = 1;
canvas.height = 1;

const ctx = canvas.getContext('2d')!;

ctx.fillStyle = 'rgba(255, 255, 255, 1)';
ctx.fillRect(0, 0, 1, 1);
const dataURL = canvas.toDataURL();
const defaultTextureImage = new Image();
defaultTextureImage.src = dataURL;
//


function createMeshData(object: Object3D<Object3DEventMap>,meshDatas: MeshData[]){
    if(object.children.length !== 0){
        object.children.forEach((obj:Object3D)=>{
            createMeshData(obj,meshDatas);
        });
    }

    if(object.type !== 'Mesh') return;
    const typeCastingObj = object as Mesh;

    const position = typeCastingObj.geometry.getAttribute('position').array;
    const normal = typeCastingObj.geometry.getAttribute('normal').array;
    const texcoord = typeCastingObj.geometry.getAttribute('uv').array;

    // create indices
    let indices = typeCastingObj.geometry.index?.array;

    if(!indices) {
        indices = position;
    }

    //find materialName
    const materialName = (typeCastingObj.material as any).name;

    meshDatas.push({
        position,
        normal,
        texcoord,
        indices,
        materialName,
    })
}

export async function materialLoad(url: string, type: ModelType) {
    return new Promise<{[key:string]:Material}>((resolve,reject)=>{
        MaterialLoaders[type as keyof typeof MaterialLoaders]
        .load(url,(material)=>{
            const materials: {
                [key: string]: Material,
            } = {};

            const getMaterialInfo = async (key: string) => {
                const info = material.materialsInfo[key];
                const ambient = (info as any).ka ?? [0.2,0.2,0.2];
                const diffuse = info.kd ?? [0.8,0.8,0.8];
                const specular = info.ks ?? [0.2,0.2,0.2];
                const shininess = info.ns ?? 100;
                
                let image = defaultTextureImage;
                if(info.map_kd){
                    image = await loadImage(url,info.map_kd);
                }
                materials[key] = {
                    ambient,
                    diffuse,
                    specular,
                    shininess,
                    // 지금은 kd만 map_kd만 대응
                    texture: image,
                }

                return;
            }

            const loadMaterials: Promise<any>[] = [];

            Object.keys(material.materialsInfo).forEach((key)=>{
                getMaterialInfo(key);
                loadMaterials.push(getMaterialInfo(key));
            });

            Promise.all(loadMaterials).then(()=>{
                resolve(materials);
            });
        },(progress)=>{
            //console.log(progress.total);
        },(error)=>{
            console.error(error);
            reject(error);
        })
    });
}

export function combineMeshGroup(meshData:MeshData[],materials:{[key:string]:Material}): SimpleMeshGroup[] {
    return meshData.map((data)=>{
        return {
            meshData: data,
            material: materials[data.materialName!],
        }
    });
}

export function loadImage(url: string, imageName:string){
    const lastIndex = url.lastIndexOf('/');
    const baseUrl = url.slice(0,lastIndex);
    return new Promise<HTMLImageElement>((resolve,reject)=>{
        const image = new Image();
        image.src = `${baseUrl}/${imageName}`;
        image.onload = ()=>{
            resolve(image);
        }
        image.onerror = (err)=>{
            console.error(err);
            reject();
        }
    })
}