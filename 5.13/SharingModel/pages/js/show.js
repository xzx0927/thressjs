import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import $ from 'jquery';
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader"; // 加载obj文件
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader"; // 加载fbx文件
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader"; // 加载MTL材质文件
import { TGALoader } from "three/examples/jsm/loaders/TGALoader"; // 加载tga文件
import { DDSLoader } from "three/examples/jsm/loaders/DDSLoader"; // 加载dds文件


// 首先定义默认参数和params对象
const defaultParams = {
    cameraX: 5,
    cameraY: 5,
    cameraZ: 5,
    cameraFov: 75,
    backgroundColor: '0xf2f2f2',
    modelScale: 1,
    modelX: 0,
    modelY: 0,
    modelZ: 0,
    modelRotationX: 0,
    modelRotationY: 0,
    modelRotationZ: 0,
    modelVisible: true,
    showAxes: false,
    autoRotate: false,
    autoRotateSpeed: 1.0,
    ambientColor: '#404040',
    ambientIntensity: 0.4,
    directionalColor: '#ffffff',
    directionalIntensity: 5,
    pointLightColor: '#ffffff',
    pointLightIntensity: 1,
    pointLightX: 50,
    pointLightY: 50,
    pointLightZ: 50,
    zoomSensitivity: 1.0,
    emissiveIntensity: 0,
    autoScale: true,
    maxSize: 10,
    autoPlayAnimation: true,
    animationSpeed: 1.0
};

const params = {...defaultParams};

// 初始化currentModel变量
let currentModel = null;

const scene = new THREE.Scene(); // 创建场景
// 添加坐标轴辅助线 (长度单位)
const axesHelper = new THREE.AxesHelper(100);
axesHelper.visible = false; // 默认隐藏坐标系
scene.add(axesHelper);

const camera = new THREE.PerspectiveCamera(params.cameraFov, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(5, 5, 5); // 调整相机位置到更近的距离
camera.lookAt(0, 0, 0); // 确保相机看向原点

const renderer = new THREE.WebGLRenderer({ antialias: true }); // 创建渲染器
renderer.setSize(window.innerWidth, window.innerHeight); // 设置渲染器大小
renderer.setPixelRatio(window.devicePixelRatio); // 设置像素比
renderer.setClearColor(parseInt(params.backgroundColor)); // 设置画布背景颜色
const container = document.getElementById('model-container');
container.appendChild(renderer.domElement); // 将画布添加到容器上

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 启用阻尼效果
controls.dampingFactor = 0.25; // 阻尼系数
controls.screenSpacePanning = false; // 禁用屏幕空间平移
controls.maxPolarAngle = Math.PI / 2; // 最大垂直角度
controls.zoomSpeed = params.zoomSensitivity; // 设置初始缩放灵敏度

const stats = new Stats(); // 创建状态监视器
container.appendChild(stats.domElement); // 将状态监视器添加到容器上

// 初始化GUI
const gui = new GUI();
// 设置所有文件夹默认关闭
gui.close();

// 添加环境光
const ambientLight = new THREE.AmbientLight(params.ambientColor, params.ambientIntensity);
scene.add(ambientLight);

// 添加方向光
const directionalLight = new THREE.DirectionalLight(params.directionalColor, params.directionalIntensity);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

// 添加点光源
const pointLight = new THREE.PointLight(params.pointLightColor, params.pointLightIntensity, 2);
pointLight.position.set(params.pointLightX, params.pointLightY, params.pointLightZ);
scene.add(pointLight);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}); // 监听窗口大小变化

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // 更新轨道控制器
    
    // 更新动画混合器
    if (currentModel && currentModel.userData.mixer) {
        currentModel.userData.mixer.update(0.016); // 使用固定时间步长
    }
    
    renderer.render(scene, camera);
    stats.update();
} // 渲染函数

function updateAnimation() {
    if (currentModel && currentModel.userData.mixer) {
        if (params.autoPlayAnimation) {
            currentModel.userData.mixer.clipAction(currentModel.animations[0]).play();
        } else {
            currentModel.userData.mixer.clipAction(currentModel.animations[0]).stop();
        }
    }
}

function updateAnimationSpeed() {
    if (currentModel && currentModel.userData.mixer) {
        currentModel.userData.mixer.timeScale = params.animationSpeed;
    }
}

function updateAutoRotate() {
    controls.autoRotate = params.autoRotate;
    controls.autoRotateSpeed = params.autoRotateSpeed;
}

animate();//启动动画循环

// 添加GUI控制器
const cameraFolder = gui.addFolder('相机设置');
cameraFolder.close();
cameraFolder.add(params, 'cameraX', -100, 100).onChange(updateCameraPosition);
cameraFolder.add(params, 'cameraY', -100, 100).onChange(updateCameraPosition);
cameraFolder.add(params, 'cameraZ', -100, 100).onChange(updateCameraPosition);
cameraFolder.add(params, 'cameraFov', 30, 120).name('视野').onChange(updateCameraFov);
cameraFolder.add(params, 'autoRotate').name('自动旋转').onChange(updateAutoRotate);
cameraFolder.add(params, 'autoRotateSpeed', 0.1, 5.0).name('旋转速度').onChange(updateAutoRotate);
cameraFolder.add(params, 'zoomSensitivity', 0.1, 5.0).name('缩放灵敏度').onChange(value => {
    controls.zoomSpeed = value;
});

// 添加背景色控制
// 添加重置按钮
gui.add({
    resetAll: () => {
        Object.assign(params, defaultParams);
        updateAllControls();
    }
}, 'resetAll').name('重置所有设置');
// 添加模型设置文件夹
const modelFolder = gui.addFolder('模型设置');
modelFolder.close();
modelFolder.add(params, 'modelX', -10, 10).name('X位置').onChange(updateModelPosition);
modelFolder.add(params, 'modelY', -10, 10).name('Y位置').onChange(updateModelPosition);
modelFolder.add(params, 'modelZ', -10, 10).name('Z位置').onChange(updateModelPosition);
modelFolder.add(params, 'modelRotationX', 0, Math.PI*2).name('X旋转').onChange(updateModelRotation);
modelFolder.add(params, 'modelRotationY', 0, Math.PI*2).name('Y旋转').onChange(updateModelRotation);
modelFolder.add(params, 'modelRotationZ', 0, Math.PI*2).name('Z旋转').onChange(updateModelRotation);
modelFolder.add(params, 'modelScale', 0.1, 5).name('缩放').onChange(updateModelScale);
modelFolder.add(params, 'modelVisible').name('显示模型').onChange(updateModelVisibility);
modelFolder.add(params, 'emissiveIntensity', 0, 2).name('自发光强度').onChange(updateEmissiveIntensity);
modelFolder.add(params, 'autoScale').name('自适应缩放').onChange(updateModelScale);
modelFolder.add(params, 'maxSize', -10, 200).name('最大尺寸').onChange(updateModelScale);
modelFolder.add(params, 'autoPlayAnimation').name('自动播放动画').onChange(updateAnimation);
modelFolder.add(params, 'animationSpeed', 0.1, 5.0).name('动画速度').onChange(updateAnimationSpeed);

const rendererFolder = gui.addFolder('渲染设置');
rendererFolder.close();
const bgPresets = {
    '默认': '0xf2f2f2',
    '白色': '0xffffff',
    '黑色': '0x000000',
    '灰色': '0x808080',
    '自定义': 'custom'
};

// 自定义背景色
params.customBackgroundColor = '#ffffff';

// 添加背景色选择
const bgColorControl = rendererFolder.add(params, 'backgroundColor', bgPresets).name('背景预设');
bgColorControl.onChange(value => {
    if (value === 'custom') {
        rendererFolder.addColor(params, 'customBackgroundColor')
            .name('自定义颜色')
            .onChange(color => {
                params.backgroundColor = '0x' + color.substring(1);
                updateBackgroundColor();
            });
    } else {
        params.backgroundColor = value;
        updateBackgroundColor();
    }
});
rendererFolder.add(params, 'showAxes').name('显示坐标系').onChange(updateAxesVisibility);

// 光源设置整合到一个文件夹
const lightFolder = gui.addFolder('光源设置');
lightFolder.close();

const ambientFolder = lightFolder.addFolder('环境光');
ambientFolder.close();
ambientFolder.addColor(params, 'ambientColor').onChange(updateAmbientLight);
ambientFolder.add(params, 'ambientIntensity', 0, 2).onChange(updateAmbientLight);

const dirLightFolder = lightFolder.addFolder('方向光');
dirLightFolder.close();
dirLightFolder.addColor(params, 'directionalColor').onChange(updateDirectionalLight);
dirLightFolder.add(params, 'directionalIntensity', 0, 10).onChange(updateDirectionalLight);

const pointLightFolder = lightFolder.addFolder('点光源');
pointLightFolder.close();
pointLightFolder.addColor(params, 'pointLightColor').onChange(updatePointLight);
pointLightFolder.add(params, 'pointLightIntensity', 0, 5).onChange(updatePointLight);
pointLightFolder.add(params, 'pointLightX', -100, 100).name('X位置').onChange(updatePointLightPosition);
pointLightFolder.add(params, 'pointLightY', -100, 100).name('Y位置').onChange(updatePointLightPosition);
pointLightFolder.add(params, 'pointLightZ', -100, 100).name('Z位置').onChange(updatePointLightPosition);

// 更新背景颜色
function updateBackgroundColor() {
    if (params.backgroundColor === 'custom') {
        renderer.setClearColor(new THREE.Color(params.customBackgroundColor));
    } else {
        renderer.setClearColor(parseInt(params.backgroundColor));
    }
}

// 更新坐标轴可见性
function updateAxesVisibility() {
    axesHelper.visible = params.showAxes;
}

// 更新模型缩放
function updateModelScale() {
    if (currentModel) {
        const originalScale = currentModel.userData.originalScale || 1;
        currentModel.scale.set(
            originalScale * params.modelScale,
            originalScale * params.modelScale,
            originalScale * params.modelScale
        );
    }
}

// 更新所有控制器
function updateAllControls() {
    updateCameraPosition();
    updateCameraFov();
    updateBackgroundColor();
    updateModelPosition();
    updateModelRotation();
    updateModelScale();
    updateModelVisibility();
    updateAxesVisibility();
    updateAutoRotate();
    updateAmbientLight();
    updateDirectionalLight();
    updatePointLight();
    updatePointLightPosition();
    updateEmissiveIntensity();
}

function updateEmissiveIntensity() {
    if (currentModel) {
        currentModel.traverse(child => {
            if (child.isMesh) {
                child.material.emissiveIntensity = params.emissiveIntensity;
            }
        });
    }
}

// 更新模型位置
function updateModelPosition() {
    if (currentModel) {
        currentModel.position.set(params.modelX, params.modelY, params.modelZ);
    }
}

// 更新模型旋转
function updateModelRotation() {
    if (currentModel) {
        currentModel.rotation.set(params.modelRotationX, params.modelRotationY, params.modelRotationZ);
    }
}

// 更新模型可见性
function updateModelVisibility() {
    if (currentModel) {
        currentModel.visible = params.modelVisible;
    }
}

// 更新相机视野
function updateCameraFov() {
    camera.fov = params.cameraFov;
    camera.updateProjectionMatrix();
}

// 更新相机位置
function updateCameraPosition() {
    camera.position.set(params.cameraX, params.cameraY, params.cameraZ);
    camera.lookAt(0, 0, 0);
}

// 更新环境光
function updateAmbientLight() {
    ambientLight.color.setHex(params.ambientColor.replace('#', '0x'));
    ambientLight.intensity = params.ambientIntensity;
}

// 更新方向光
function updateDirectionalLight() {
    directionalLight.color.setHex(params.directionalColor.replace('#', '0x'));
    directionalLight.intensity = params.directionalIntensity;
}

// 更新点光源
function updatePointLight() {
    pointLight.color.setHex(params.pointLightColor.replace('#', '0x'));
    pointLight.intensity = params.pointLightIntensity;
}

// 更新点光源位置
function updatePointLightPosition() {
    pointLight.position.set(params.pointLightX, params.pointLightY, params.pointLightZ);
}

const baseUrl = '../../media/'; // 模型文件所在目录
const loaders = {
    dds: new DDSLoader(), // 首先初始化DDSLoader
    gltf: (() => {
        const loader = new GLTFLoader();
        loader.setCrossOrigin('anonymous');
        
        // 仅保留必要的DRACO解码器配置，解决服务器出错
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        loader.setDRACOLoader(dracoLoader);
        
        return loader;
    })(),
    obj: new OBJLoader(),
    fbx: new FBXLoader(), // FBXLoader会自动检测已初始化的DDSLoader
    mtl: new MTLLoader(),
    tga: new TGALoader()
};

// 获取URL参数
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) {
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
    });
    return params;
}

// 解析模型并添加到场景中
function parseModel(model, scale) {
    if (currentModel && scene) {
        scene.remove(currentModel);
    }
    currentModel = model;
    currentModel.scale.set(scale, scale, scale);
    currentModel.position.set(params.modelX, params.modelY, params.modelZ);
    currentModel.rotation.set(params.modelRotationX, params.modelRotationY, params.modelRotationZ);
    currentModel.visible = params.modelVisible;
    scene.add(currentModel);
    
    // 检测并处理模型动画
    if (model.animations && model.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(model.animations[0]);
        action.play();
        
        // 将mixer保存到模型上以便后续访问
        model.userData.mixer = mixer;
        model.userData.hasAnimation = true;
    } else {
        model.userData.hasAnimation = false;
    }
    
    // 添加自发光
    model.traverse(child => {
        if (child.isMesh) {
            child.material.emissive = child.material.color;
            child.material.emissiveIntensity = params.emissiveIntensity;
        }
    });
}



// 加载模型
function loadModel(loader, url, callback) {
    // console.log('Loading model from:', url);
    
    // 标准化URL路径
    const normalizedUrl = url.replace(/\\/g, '/');
    const basePath = normalizedUrl.substring(0, normalizedUrl.lastIndexOf('/') + 1);
    
    // 设置GLTFLoader的资源路径
    if (loader instanceof GLTFLoader) {
        console.log('Setting GLTF resource path to:', basePath);
        loader.setResourcePath(basePath);
        
        // 配置DRACOLoader
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');//解决
        dracoLoader.setDecoderConfig({ type: 'js' });
        loader.setDRACOLoader(dracoLoader);
        
        // 配置纹理加载路径
        const textureLoader = new THREE.TextureLoader();
        textureLoader.setCrossOrigin('anonymous');
        textureLoader.setPath(basePath);
    }
    
    // 创建进度条容器
    const progressContainer = document.createElement('div');
    progressContainer.style.position = 'absolute';
    progressContainer.style.top = '50%';
    progressContainer.style.left = '50%';
    progressContainer.style.transform = 'translate(-50%, -50%)';
    progressContainer.style.width = '300px';
    progressContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
    progressContainer.style.padding = '20px';
    progressContainer.style.borderRadius = '10px';
    progressContainer.style.textAlign = 'center';
    
    // 创建进度文本
    const progressText = document.createElement('div');
    progressText.style.color = 'white';
    progressText.style.marginBottom = '10px';
    progressText.textContent = `正在加载模型: ${url.split('/').pop()}`;
    
    // 创建进度条
    const progressBar = document.createElement('div');
    progressBar.style.width = '100%';
    progressBar.style.height = '20px';
    progressBar.style.backgroundColor = 'rgba(255,255,255,0.2)';
    progressBar.style.borderRadius = '10px';
    progressBar.style.overflow = 'hidden';
    
    // 创建进度条填充
    const progressBarFill = document.createElement('div');
    progressBarFill.style.height = '100%';
    progressBarFill.style.width = '0%';
    progressBarFill.style.backgroundColor = '#4CAF50';
    progressBarFill.style.transition = 'width 0.3s';
    
    progressBar.appendChild(progressBarFill);
    progressContainer.appendChild(progressText);
    progressContainer.appendChild(progressBar);
    container.appendChild(progressContainer);

    const onProgress = (xhr) => {
        if (xhr.total > 0) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            progressBarFill.style.width = `${percent}%`;
            progressText.textContent = `正在加载模型: ${percent}%`;
        }
    };

    loader.load(url, model => {
        container.removeChild(progressContainer);
        callback(model);
    }, onProgress, error => {
        handleLoadError(url, loadingMsg, error);
    });
}

// 加载纹理
function loadTexture(url) {
    // 统一使用正斜杠路径
   
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(normalizedUrl, texture => {
        texture.needsUpdate = true;
        const material = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true
        });
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        // 添加自发光
        mesh.material.emissive = mesh.material.color;
        mesh.material.emissiveIntensity = 0.5;
    }, undefined, error => {
        console.error('Failed to load texture:', normalizedUrl, error);
        handleLoadError(normalizedUrl, null, error);
    });
}

// 计算自动缩放比例
function calculateAutoScale(loader, url) {
    return new Promise((resolve, reject) => {
        loader.load(url, gltf => {
            const box = new THREE.Box3().setFromObject(gltf.scene || gltf);
            const size = box.getSize(new THREE.Vector3()).length();
            const maxSize = params.maxSize; // 使用参数控制最大尺寸
            const scale = size > 0 ? maxSize / size : 1; // 防止除以零
            resolve(scale);
        }, undefined, error => {
            handleLoadError(url, null, error);
            reject(error);
        });
    });
}

// 根据文件类型返回对应的加载器配置
function getLoaderForFileType(fileType) {
    const supportedTypes = {
        'obj': { loader: loaders.obj, needsMaterial: true },
        'fbx': { loader: loaders.fbx },
        'glb': { loader: loaders.gltf },
        'gltf': { loader: loaders.gltf },
        'tga': { loader: loaders.tga, isTexture: true }
    };
    
    const config = supportedTypes[fileType];
    if (!config) {
        throw new Error(`Unsupported model type: ${fileType}`);
    }
    return config;
}

// 加载带有材质的OBJ模型
function loadObjWithMaterial(url, scale) {
    const mtlUrl = url.replace(/\.obj$/, '.mtl');
    
    return new Promise((resolve, reject) => {
        // 先检查.mtl文件是否存在
        fetch(mtlUrl, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    // 如果.mtl文件存在，加载它
                    loaders.mtl.load(mtlUrl, mtl => {
                        mtl.preload();
                        loaders.obj.setMaterials(mtl);
                        loadModel(loaders.obj, url, obj => {
                            parseModel(obj, scale);
                            resolve();
                            // console.log('MTL文件成功加载:', mtlUrl);
                        });
                    }, undefined, error => {
                        handleLoadError(mtlUrl, null, error);
                        reject(error);
                    });
                } else {
                    // 如果.mtl文件不存在，直接加载obj
                    loadModel(loaders.obj, url, obj => {
                        parseModel(obj, scale);
                        resolve();
                    });
                }
            })
            .catch(() => {
                // 如果检查失败，直接加载obj
                loadModel(loaders.obj, url, obj => {
                    parseModel(obj, scale);
                    resolve();
                });
            });
    });
}

// 根据文件类型加载模型
async function loadModelWithMaterial(url) {
    try {
        const fileType = url.split('.').pop().toLowerCase();// 获取文件类型
        const { loader, needsMaterial, isTexture } = getLoaderForFileType(fileType);// 获取加载器配置

        if (isTexture) {
            loadTexture(url);
            return;
        }

        let scale = params.modelScale;
        if (params.autoScale) {
            scale = await calculateAutoScale(loader, url);// 计算自动缩放比例
        }

        if (needsMaterial && fileType === 'obj') {// 加载带有材质的OBJ模型
            await loadObjWithMaterial(url, scale);// 加载带有材质的OBJ模型
        } else {// 加载其他模型
            await new Promise((resolve, reject) => {
                loadModel(loader, url, model => {
                    try {
                        parseModel(model.scene || model, scale);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        }
    } catch (error) {
        displayErrorMessage(`模型加载失败: ${error.message}`);
        console.error(`Failed to load model from ${url}:`, error);
    }
}

// 处理加载错误
function handleLoadError(url, loadingMsg, error) {
    console.error(`Failed to load ${loadingMsg ? 'model' : 'texture'} from ${url}:`, error);
    if (loadingMsg) {
        loadingMsg.textContent = `加载失败: ${url.split('/').pop()}`;
        loadingMsg.style.color = 'red';
        setTimeout(() => container.removeChild(loadingMsg), 3000);
    }
    displayErrorMessage(`无法加载 ${url}: ${error.message}`);
}

// 显示错误信息
function displayErrorMessage(message) {
    const errorMsg = document.createElement('div');
    errorMsg.style.position = 'absolute';
    errorMsg.style.top = '20px';
    errorMsg.style.left = '20px';
    errorMsg.style.color = 'red';
    errorMsg.textContent = message;
    container.appendChild(errorMsg);
    setTimeout(() => container.removeChild(errorMsg), 5000);
}

const urlParams = getUrlParams(); // 获取URL参数

if (urlParams.model_id) {
    $.ajax({
        url: `http://127.0.0.1:8000/model_show/${urlParams.model_id}/`, // 获取模型数据
        type: 'GET',
        success: async function(data) {
            try {
                // console.log(data.message);
                // console.log(data.model.model_path);
                const modelPath = data.model.model_path;
                // 标准化路径分隔符为正斜杠
                const normalizedPath = modelPath.replace(/\\/g, '/');
                
                // 尝试匹配/media/后的路径部分
                const mediaMatch = normalizedPath.match(/media\/(.+)/);
                if (!mediaMatch) {
                    throw new Error(`无法从路径中提取模型位置: ${modelPath}. 路径应包含'media'目录`);
                }
                
                const model_save_path = mediaMatch[1];
                const modelUrl = `${baseUrl}${model_save_path}`;
                // console.log('modelUrl',modelUrl);
                await loadModelWithMaterial(modelUrl);
            } catch (error) {
                console.error('Error processing response:', error);
                displayErrorMessage(`模型路径处理错误: ${error.message}`);
            }
        },
        error: function(xhr, status, error) {
            console.error(`AJAX request failed with status ${xhr.status}: ${xhr.statusText}`);
            displayErrorMessage(`AJAX请求失败，状态码: ${xhr.status}`);
        }
    });
} else {
    displayErrorMessage('URL中未提供model_id参数。');
    console.error('No model_id provided in URL parameters.');
}