import * as THREE from 'three';
import {GLTFLoader} from "three/addons/loaders/GLTFLoader";

const loader=new GLTFLoader();

const model=new THREE.Group();
loader.load('../20221009140556_parent_directory_办公楼01.gltf',function(gltf){
    // console.log('gltf',gltf);
    model.add(gltf.scene);
})

export default model;