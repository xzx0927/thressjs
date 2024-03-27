import * as THREE from '../node_modules/three';
import {GLTFLoader} from "../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

const loader=new GLTFLoader();

const model=new THREE.Group();
const url='../web_3d_end/model/ceshi.glb'
loader.load(url,function(gltf){
    console.log('gltf',gltf);
    model.add(gltf.scene);
})
export default model;