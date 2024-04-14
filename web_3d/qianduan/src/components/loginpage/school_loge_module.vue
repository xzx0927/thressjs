
<script setup>
import {ref,onMounted} from "vue";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js' ;//相机控件
const webgl=ref(null);//ref获取dom节点
onMounted(()=>{
  const height = webgl.value.offsetHeight
  const width=webgl.value.offsetWidth
  const scene=new THREE.Scene();
  const geometry=new THREE.BoxGeometry(100,100,100);
  const material=new THREE.MeshLambertMaterial({color:0x00ff00,});
  const axesHelper=new THREE.AxesHelper(150)
  scene.add(axesHelper);
  const mesh=new THREE.Mesh(geometry,material);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(80, 100, 50);// 设置光源的方向：通过光源position属性和目标指向对象的position属性计算
  directionalLight.target = mesh;
  scene.add(directionalLight);
  const dirLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5,0xff0000);// DirectionalLightHelper：可视化平行光
  scene.add(dirLightHelper);
  scene.add(mesh);
  mesh.position.set(0,0,0);
  const camera=new THREE.PerspectiveCamera(
      75,
      width / height,//窗口文档显示区的宽度作为画布宽度，窗口文档显示区的高度作为画布高度
      0.1,
      1000
  );
  camera.position.set(200,200,200);
  camera.lookAt(0,0,0);
  const renderer=new THREE.WebGLRenderer();
  renderer.setSize(width,height);
  renderer.render(scene,camera);
  // document.body.appendChild(renderer.domElement);
  webgl.value.appendChild(renderer.domElement);
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
      renderer.setSize(width,height);//更新画布尺寸
      camera.aspect= width / height;//重新写入宽高比
      camera.updateProjectionMatrix();//更新投影矩阵
  }
})
</script>


<template>
  <div ref="webgl" id="kuang">
  </div>
</template>

<style scoped>
#kuang{
  display: block;
  position: fixed;
  left: 0;
  top: 0;
  width: 60vw;
  height: 100vh;
}
</style>