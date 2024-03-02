
import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';//相机控件
import Stats from 'three/addons/libs/stats.module.js';

import model from './model.js';

const scene=new THREE.Scene();
scene.add(model);

const Light=new THREE.PointLight(0xffffff,2);
Light.decay=0.0;
Light.position.set(200,200,200);
scene.add(Light);

const axesHelper=new THREE.AxesHelper(150)
scene.add(axesHelper);

const camera=new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(200,200,200);


const stats=new Stats();//查看渲染帧率
document.body.appendChild(stats.domElement);

const renderer=new THREE.WebGLRenderer();
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.setSize(window.innerWidth,window.innerHeight);

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
