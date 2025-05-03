import * as THREE from "three";
import * as CANNON from 'cannon-es';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// 控制参数对象
const controlsParams = {
    showCube: true,
    showPlane: false, // 平面默认隐藏
    enableFallingObjects: true,
    maxFallingObjects: 10,
    modelColor: '#00ff00',
    planeColor: '#cccccc',
    backgroundColor: '#f0f0f0',
    showAxes: false, // 坐标轴默认隐藏
    autoRotate: false,
    autoRotateSpeed: 1.0,
    planeWidth: 10, // 平面宽度
    planeHeight: 10 // 平面高度
};

// 创建场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(controlsParams.backgroundColor);

// 创建透视相机
const camera = new THREE.PerspectiveCamera(
    45, // 视场角
    window.innerWidth / window.innerHeight, // 宽高比
    0.1, // 近裁剪面
    1000 // 远裁剪面
);

// 获取DOM元素
const viewContainer = document.getElementById('view');
const canvas = document.getElementById('model-canvas');

// 创建WebGL渲染器
const renderer = new THREE.WebGLRenderer({ 
    canvas,
    antialias: true // 开启抗锯齿
});

// 设置渲染器尺寸
function setRendererSize() {
    const width = viewContainer.clientWidth * 0.8;
    const height = viewContainer.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

// 初始设置渲染器尺寸
setRendererSize();

// 创建立方体测试对象
function createTestCube() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        wireframe: false
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    return cube;
}

const testCube = createTestCube();

// 设置相机初始位置
function setupCamera() {
    camera.position.set(2, 2, 5);
    camera.lookAt(0, 0, 0);
}

setupCamera();

// 添加坐标轴辅助
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
axesHelper.visible = controlsParams.showAxes;

// 创建轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 启用阻尼效果
controls.dampingFactor = 0.05; // 阻尼系数

// 初始化GUI并整合到画布
const gui = new GUI({ 
    width: 280,
    closed: true,
    container: canvas.parentElement
});
gui.domElement.style.position = 'absolute';
gui.domElement.style.right = '0';
gui.domElement.style.top = '0';
// 设置所有文件夹默认关闭
gui.close();

// 物理世界
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0) // 标准重力
});

// 物理物体
const physicsBodies = {
    fallingObjects: [],
    groundBody: null
};

// 下落物体参数
const fallingObjectParams = {
    dropInterval: 2000, // 下落间隔(ms)
    lastDropTime: 0,
    autoRemoveDistance: 10 // 自动消失距离
};

// 创建下落物体
function createFallingObject() {
    const geometry = new THREE.SphereGeometry(0.3);
    // 生成随机颜色
    const color = new THREE.Color(
        Math.random(),
        Math.random(), 
        Math.random()
    );
    const material = new THREE.MeshBasicMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);
    
    // 设置随机位置
    sphere.position.set(
        Math.random() * 4 - 2,
        5,
        Math.random() * 4 - 2
    );
    
    // 物理属性
    const shape = new CANNON.Sphere(0.3);
    const body = new CANNON.Body({
        mass: 1,
        shape,
        position: new CANNON.Vec3(
            sphere.position.x,
            sphere.position.y,
            sphere.position.z
        ),
        material: new CANNON.Material({restitution: 0.3}),
        linearDamping: 0.01
    });
    
    // 确保物体能受重力影响
    body.type = CANNON.Body.DYNAMIC;
    body.collisionResponse = true;
    
    world.addBody(body);
    scene.add(sphere);
    
    physicsBodies.fallingObjects.push({
        mesh: sphere,
        body: body
    });
    
    return sphere;
}

// 物理对象初始化
function createPhysicsObjects() {
    // 移除旧的物理平面
    if(physicsBodies.groundBody) {
        world.removeBody(physicsBodies.groundBody);
        physicsBodies.groundBody = null;
    }
    
    // 创建立方体物理体
    const cubeShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const cubeBody = new CANNON.Body({
        mass: 0, // 静态物体
        shape: cubeShape,
        position: new CANNON.Vec3().copy(testCube.position)
    });
    world.addBody(cubeBody);
    
    // 平面物理体
    if(controlsParams.showPlane) {
        const groundShape = new CANNON.Plane();
        physicsBodies.groundBody = new CANNON.Body({
            mass: 0,
            shape: groundShape
        });
        physicsBodies.groundBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(1, 0, 0),
            -Math.PI / 2
        );
        physicsBodies.groundBody.position.y = -0.5;
        world.addBody(physicsBodies.groundBody);
    }
}

// 更新下落物体状态
function updateFallingObjects() {
    const currentTime = Date.now();
    
    // 定时创建新下落物体
    if(currentTime - fallingObjectParams.lastDropTime > fallingObjectParams.dropInterval) {
        createFallingObject();
        fallingObjectParams.lastDropTime = currentTime;
        
        // 限制最大物体数量
        if(physicsBodies.fallingObjects.length > controlsParams.maxFallingObjects) {
            const oldestObj = physicsBodies.fallingObjects.shift();
            world.removeBody(oldestObj.body);
            scene.remove(oldestObj.mesh);
        }
    }
    
    // 检查下落物体状态
    physicsBodies.fallingObjects.forEach((obj, index) => {
        const pos = obj.body.position;
        // 如果平面隐藏，下落距离增加
        const removeDistance = controlsParams.showPlane ? 
            fallingObjectParams.autoRemoveDistance : 
            fallingObjectParams.autoRemoveDistance * 2;
            
        // 使用最新的平面尺寸计算边界
        const planeHalfWidth = controlsParams.planeWidth / 2;
        const planeHalfHeight = controlsParams.planeHeight / 2;
        
        // 确保物理平面尺寸同步
        if(physicsBodies.groundBody && controlsParams.showPlane) {
            physicsBodies.groundBody.position.x = 0;
            physicsBodies.groundBody.position.z = 0;
        }
        
        // 如果超出平面边界，大幅增加下落速度
        const isOutOfBounds = Math.abs(pos.x) > planeHalfWidth || Math.abs(pos.z) > planeHalfHeight;
        if(isOutOfBounds) {
            console.log(`物体超出边界: x=${pos.x.toFixed(2)}, z=${pos.z.toFixed(2)}`);
            obj.body.velocity.y = -0.5; // 设置较大的下落速度
            obj.body.velocity.x = 0; // 清除水平速度
            obj.body.velocity.z = 0;
        }
        
        // 当下落太远时移除
        if(pos.y < -removeDistance) {
            // 移除超出范围的物体
            world.removeBody(obj.body);
            scene.remove(obj.mesh);
            physicsBodies.fallingObjects.splice(index, 1);
        }
    });
}

// 添加平面
let planeGeometry = new THREE.PlaneGeometry(controlsParams.planeWidth, controlsParams.planeHeight);
let planeMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xcccccc,
    side: THREE.DoubleSide
});
let plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -0.5;
scene.add(plane);
plane.visible = controlsParams.showPlane;

// 更新平面尺寸函数
function updatePlaneSize() {
    scene.remove(plane);
    planeGeometry.dispose();
    planeMaterial.dispose();
    
    planeGeometry = new THREE.PlaneGeometry(controlsParams.planeWidth, controlsParams.planeHeight);
    planeMaterial = new THREE.MeshBasicMaterial({ 
        color: controlsParams.planeColor,
        side: THREE.DoubleSide
    });
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.5;
    scene.add(plane);
    plane.visible = controlsParams.showPlane;
    
    createPhysicsObjects();

    // 平面尺寸变化后检查所有物体是否超出新边界
    physicsBodies.fallingObjects.forEach((obj, index) => {
        const pos = obj.body.position;
        const planeHalfWidth = controlsParams.planeWidth / 2;
        const planeHalfHeight = controlsParams.planeHeight / 2;
        
        if(Math.abs(pos.x) > planeHalfWidth || Math.abs(pos.z) > planeHalfHeight) {
            // 超出新边界，使其掉落
            obj.body.velocity.y = -10.0;
        }
    });
}

// 创建模型控制文件夹
const modelFolder = gui.addFolder('模型控制');
modelFolder.add(controlsParams, 'showCube')
    .name('显示立方体')
    .onChange((value) => {
        testCube.visible = value;
    });
modelFolder.addColor(controlsParams, 'modelColor')
    .name('立方体颜色')
    .onChange((value) => {
        testCube.material.color.set(value);
    });
modelFolder.add(controlsParams, 'showPlane')
    .name('显示平面')
    .onChange((value) => {
        plane.visible = value;
        createPhysicsObjects();
    });
modelFolder.addColor(controlsParams, 'planeColor')
    .name('平面颜色')
    .onChange((value) => {
        plane.material.color.set(value);
    });
modelFolder.add(controlsParams, 'planeWidth', 1, 20, 1)
    .name('平面宽度')
    .onChange(updatePlaneSize);
modelFolder.add(controlsParams, 'planeHeight', 1, 20, 1)
    .name('平面高度')
    .onChange(updatePlaneSize);

// 创建下落物体控制文件夹
const fallingObjectsFolder = gui.addFolder('下落物体控制');
fallingObjectsFolder.add(controlsParams, 'enableFallingObjects')
    .name('启用下落物体');
fallingObjectsFolder.add(controlsParams, 'maxFallingObjects', 1, 20, 1)
    .name('最大数量')
    .onChange(() => {
        // 当数量调整时，移除超出数量的物体
        while(physicsBodies.fallingObjects.length > controlsParams.maxFallingObjects) {
            const oldestObj = physicsBodies.fallingObjects.shift();
            world.removeBody(oldestObj.body);
            scene.remove(oldestObj.mesh);
        }
    });

// 创建场景控制文件夹
const sceneFolder = gui.addFolder('场景控制');
sceneFolder.addColor(controlsParams, 'backgroundColor')
    .name('背景颜色')
    .onChange((value) => {
        scene.background = new THREE.Color(value);
    });
sceneFolder.add(controlsParams, 'showAxes')
    .name('显示坐标轴')
    .onChange((value) => {
        axesHelper.visible = value;
    });

// 创建动画控制文件夹
const animationFolder = gui.addFolder('动画控制');
animationFolder.add(controlsParams, 'autoRotate')
    .name('自动旋转')
    .onChange((value) => {
        controls.autoRotate = value;
    });
animationFolder.add(controlsParams, 'autoRotateSpeed', 0.1, 5.0)
    .name('旋转速度')
    .onChange((value) => {
        controls.autoRotateSpeed = value;
    });

// 窗口大小变化处理
function handleWindowResize() {
    setRendererSize();
}

window.addEventListener('resize', handleWindowResize);


// 动画循环函数
function animate() {
    requestAnimationFrame(animate);

    // 先进行边界检查
    if(controlsParams.enableFallingObjects) {
        physicsBodies.fallingObjects.forEach(obj => {
            const pos = obj.body.position;
            const planeHalfWidth = controlsParams.planeWidth * 0.95 / 2; // 5%缓冲
            const planeHalfHeight = controlsParams.planeHeight * 0.95 / 2;
            
            if(Math.abs(pos.x) > planeHalfWidth || Math.abs(pos.z) > planeHalfHeight) {
                obj.body.collisionResponse = false; // 临时禁用碰撞
                obj.body.velocity.y = -10.0;
                obj.body.velocity.x = 0;
                obj.body.velocity.z = 0;
            } else {
                obj.body.collisionResponse = true; // 恢复碰撞
            }
        });
    }

    // 物理模拟步进
    world.step(1/60);
    
    // 更新下落物体状态
    if(controlsParams.enableFallingObjects) {
        updateFallingObjects();
    }
    
    // 同步物理和渲染对象
    physicsBodies.fallingObjects.forEach(obj => {
        obj.mesh.position.copy(obj.body.position);
        obj.mesh.quaternion.copy(obj.body.quaternion);
    });
    
    // 同步立方体物理状态
    if(physicsBodies.cubeBody && testCube.userData.updatePhysics) {
        testCube.userData.updatePhysics();
    }
    
    // 更新控制器
    controls.update();
    
    // 渲染场景
    renderer.render(scene, camera);
}

// 初始化物理对象
createPhysicsObjects();

// 启动动画循环
animate();

// 搜索功能实现
function handleSearch(searchTerm) {
    const params = new URLSearchParams();
    params.set('data', searchTerm);
    window.location.href = `http://127.0.0.1:8000/model_search_url/${params.toString()}/`;
}

document.addEventListener('DOMContentLoaded', () => {
    // 搜索按钮事件
    document.getElementById('search-button').addEventListener('click', () => {
        const searchTerm = document.getElementById('search-input').value.trim();
        if (searchTerm) {
            handleSearch(searchTerm);
        }
    });

    // 格式按钮事件
    const formatButtons = document.querySelectorAll('.format-btn');
    formatButtons.forEach(button => {
        button.addEventListener('click', () => {
            const format = button.dataset.format;
            handleSearch(format);
        });
    });
});