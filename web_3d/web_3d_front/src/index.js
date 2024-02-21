import * as THREE from "three";//导入three.js
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"//导入轨道控制器

const scene=new THREE.Scene();//创建场景

const camera=new THREE.PerspectiveCamera(
    45,//视角
    window.innerWidth/window.innerHeight,//宽高比
    0.1,//最近看到物体（近平面）
    1000//(远平面)
);//创建相机

const renderer=new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth,window.innerHeight);//渲染器

document.body.appendChild(renderer.domElement);//将画布添加到body上
const geometry=new THREE.BoxGeometry(1,1,1);//创建几何体
const material=new THREE.MeshBasicMaterial({color:0x00ff00});//设置材质
const cube=new THREE.Mesh(geometry,material)//创建网格
scene.add(cube)//添加到场景中

camera.position.z=5;
camera.position.y=2;
camera.position.x=2;
camera.lookAt(0,0,0);//设置相机位置

const axesHelper=new THREE.AxesHelper(5)
scene.add(axesHelper)//添加世界辅助坐标器
const controls =new OrbitControls(camera,renderer.domElement);//添加轨道控制器
controls.enableDamping=true;//设置阻尼的惯性（带惯性）
controls.dampingFactor=0.01;//设置阻尼系数

function animate(){
    controls.update();//更新（轨道控制器）
    requestAnimationFrame(animate);
    //旋转
    // cube.rotation.x+=0.01;
    // cube.rotation.y+=0.01;
    renderer.render(scene,camera)//渲染
}//渲染函数
animate()