import { FBXLoader } from "three/examples/jsm/loaders/fbxLoader.js";
import * as THREE from "three";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 0, 2);
const render = new THREE.WebGLRenderer();
render.setSize(window.innerWidth, window.innerHeight);
render.setClearColor(0xffffff, 1);

document.body.appendChild(render.domElement);

const fbxLoader = new FBXLoader();

fbxLoader.load(
  "./src/assets/zelda/zeldaPosed001.fbx",
  (object) => {
    console.log("fbx", object);
    object.scale.set(0.005, 0.005, 0.005);
    scene.add(object);
    render.render(scene, camera);
    object.traverse(function (child: any) {
      if (child.isMesh) {
        console.log(child.material.map);
      }
    });
  },
  (progress) => {
    console.log(progress);
  },
  (error) => {
    console.error(error);
  },
);

// assimp 테스트용 코드
