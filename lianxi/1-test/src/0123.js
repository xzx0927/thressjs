
import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';//相机控件

const scene=new THREE.Scene();
const geometry=new THREE.BoxGeometry(100,100,100);
// const material=new THREE.MeshBasicMaterial({
//     color:0x00ff00,//设置颜色
//     transparent:true,//开启透明
//     opacity:0.6//设置透明度
// });//基础网格模型不会受到光照影响
const material=new THREE.MeshLambertMaterial({color:0x00ff00,});//受到光照影响的材质
const axesHelper=new THREE.AxesHelper(150)//设置大小
scene.add(axesHelper);//添加辅助观察坐标系
const mesh=new THREE.Mesh(geometry,material);

/*
光源分为环境光AmbientLight//只改变整个场景的光暗
点光源PointLight//类似灯泡向四周发光
聚光灯光源SpotLight//物台聚光灯由点向一个方向发光
平行光DirectionLight//平行发光
 */
// const pointLight=new THREE.PointLight(0xffffff,2);//点光源括号里属性是光照颜色和强度
// pointLight.decay=0.0;//衰减（这设置为不衰减）
// pointLight.position.set(200,200,200);//设置光源位置
// scene.add(pointLight);//将光源加入场景
//
// const pointLightHelper = new THREE.PointLightHelper(pointLight, 10);// 光源辅助观察
// scene.add(pointLightHelper);
// const ambient = new THREE.AmbientLight(0xffffff, 0.4);//环境光:没有特定方向，整体改变场景的光照明暗
// scene.add(ambient);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);// 平行光
directionalLight.position.set(80, 100, 50);// 设置光源的方向：通过光源position属性和目标指向对象的position属性计算
directionalLight.target = mesh;// 方向光指向对象网格模型mesh，可以不设置，默认的位置是0,0,0
scene.add(directionalLight);
const dirLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5,0xff0000);// DirectionalLightHelper：可视化平行光
scene.add(dirLightHelper);
scene.add(mesh);
mesh.position.set(0,0,0);
const camera=new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,//窗口文档显示区的宽度作为画布宽度，窗口文档显示区的高度作为画布高度
    0.1,
    1000
);
camera.position.set(200,200,200);
camera.lookAt(0,0,0);
const renderer=new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.render(scene,camera);
document.body.appendChild(renderer.domElement);
// function reder(){
//     mesh.rotateX(0.01)//旋转速度
//     mesh.rotateY(0.01)
//     renderer.render(scene,camera)//更新画布内容(即重新旋转)
//     requestAnimationFrame(reder)
// }
// reder();
// const controls=new OrbitControls(camera,renderer.domElement)//设置轨道控制器
// controls.addEventListener('change',function(){
//     renderer.render(scene,camera)//重新渲染
// });
const controls=new OrbitControls(camera,renderer.domElement);

function animate(){
    controls.update();//更新（轨道控制器）
    requestAnimationFrame(animate)
    mesh.rotation.x+=0.001;
    mesh.rotation.y+=0.001;
    renderer.render(scene,camera)//渲染
}//渲染函数
animate()

window.onresize=function(){
    renderer.setSize(window.innerWidth,window.innerHeight);//更新画布尺寸
    camera.aspect=window.innerWidth / window.innerHeight;//重新写入宽高比
    camera.updateProjectionMatrix();//更新投影矩阵

}

