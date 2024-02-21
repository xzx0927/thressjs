
import * as THREE from "three";


const scene=new THREE.Scene();//创建场景

const geometry=new THREE.BoxGeometry(100,100,100);//创建长方体括号里是长宽高
const material=new THREE.MeshBasicMaterial({color:0x00ff00});//创建材质（同物体一起使用）
const mesh=new THREE.Mesh(geometry,material);//创建网格模型并将长方体加入其中
mesh.position.set(0,0,0);//确定模型位置
scene.add(mesh);//将模型加入场景
const camera=new THREE.PerspectiveCamera(
    75,//视野角度
    window.innerWidth / window.innerHeight,//长宽比（宽高比）（这设置的是获取窗口的宽高比）
    0.1,//近端面
    1000//远端面
);//实例化透视相机对象
/* 含有属性fov — 摄像机视锥体垂直视野角度
aspect — 摄像机视锥体长宽比
near — 摄像机视锥体近端面
far — 摄像机视锥体远端面*/


camera.position.set(200,200,200);//设置相机在坐标系的位置
camera.lookAt(0,0,0);//设置相机指向位置
/*
camera.lookAt(0,0,0);//指向坐标原点
camera.lookAt(0,10,0);//指向y轴上10坐标位置
camera.lookAT(mesh.position);//指向mesh位置（一般为物体位置）
 */


const renderer=new THREE.WebGLRenderer();//创建渲染器
renderer.setSize(window.innerWidth,window.innerHeight);//设置画布尺寸（即渲染器宽高）
renderer.render(scene,camera)//进行渲染操作（通俗说是拍照）
document.body.appendChild(renderer.domElement);//将渲染器添加到body上
/*
/*
可以插入任意html元素中
例子
html中<div id="webgl" style="margin-top: 200px;margin-left: 100px;"></div>
document.getElementById('webgl').appendChild(renderer.domElement);//获取指定id对象
 */