
import '../css/style.css'
import * as THREE from '../node_modules/three';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';//相机控件
import Stats from '../node_modules/three/examples/jsm/libs/stats.module.js';
import { GUI } from '../node_modules/three/examples/jsm/libs/lil-gui.module.min.js'
import {GLTFLoader} from "../node_modules/three/examples/jsm/loaders/GLTFLoader.js";


const loader=new GLTFLoader();
const scene=new THREE.Scene();
const url='../../web_3d_end/moudels/ceshi.glb';

loader.load(url,function(gltf){
    console.log('gltf',gltf);
    model.add(gltf.scene);
})
const gui=new GUI();
const ambient = new THREE.AmbientLight(  0x404040 ,2);//环境光:没有特定方向，整体改变场景的光照明暗
scene.add(ambient);

const axesHelper=new THREE.AxesHelper(150)
scene.add(axesHelper);

const camera=new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
);
camera.position.set(100,100,100);

camera.lookAt(0,0,0)
const stats=new Stats();//查看渲染帧率
document.body.appendChild(stats.domElement);

const renderer=new THREE.WebGLRenderer();
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.setClearColor(0x404040)
renderer.render(scene,camera);
document.body.appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);


function animate(){
    stats.update();
    controls.update();//更新（轨道控制器）
    requestAnimationFrame(animate)
    renderer.render(scene,camera)//渲染
}//渲染函数
animate()

window.onresize=function(){
    renderer.setSize(window.innerWidth,window.innerHeight);//更新画布尺寸
    camera.aspect=window.innerWidth / window.innerHeight;//重新写入宽高比
    camera.updateProjectionMatrix();//更新投影矩阵
}


