import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { TextureLoader } from 'three';

// 初始化Three.js场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x808080);

// 初始化相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// 初始化渲染器
const renderer = new THREE.WebGLRenderer({ 
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 添加基础光照
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 5, 5);
scene.add(ambientLight, directionalLight);

// 添加辅助坐标轴
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// 添加轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 处理窗口大小变化
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 渲染循环
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

// 创建加载状态显示
const loadingDiv = document.createElement('div');
loadingDiv.style.position = 'absolute';
loadingDiv.style.top = '20px';
loadingDiv.style.left = '20px';
loadingDiv.style.color = 'white';
loadingDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
loadingDiv.style.padding = '10px';
loadingDiv.style.borderRadius = '5px';
document.body.appendChild(loadingDiv);

function showError(message) {
    loadingDiv.style.color = 'red';
    loadingDiv.textContent = message;
    console.error(message);
}

const textureLoader = new TextureLoader();
const fbxLoader = new FBXLoader();

loadingDiv.textContent = '正在加载模型...';
fbxLoader.load('../../media/fbx/free-1972-datsun-240k-gt/source/datsun240k.fbx', 
    (object) => {
        loadingDiv.textContent = '正在加载贴图...';
        
        // 加载纹理贴图
        const textures = {
            black: textureLoader.load('../../media/fbx/free-1972-datsun-240k-gt/textures/black.png',
                undefined, undefined, 
                (err) => showError('black.png加载失败: ' + err)),
            body: textureLoader.load('../../media/fbx/free-1972-datsun-240k-gt/textures/c4d13e1ef5c20e49d7206aefff123f19--no-signa.jpg',
                undefined, undefined,
                (err) => showError('body贴图加载失败: ' + err)),
            headlight: textureLoader.load('../../media/fbx/free-1972-datsun-240k-gt/textures/headlight_normal.jpg',
                undefined, undefined,
                (err) => showError('headlight_normal.jpg加载失败: ' + err)),
            plate: textureLoader.load('../../media/fbx/free-1972-datsun-240k-gt/textures/plate.png',
                undefined, undefined,
                (err) => showError('plate.png加载失败: ' + err)),
            shadow: textureLoader.load('../../media/fbx/free-1972-datsun-240k-gt/textures/shadow.png',
                undefined, undefined,
                (err) => showError('shadow.png加载失败: ' + err)),
            stickers: textureLoader.load('../../media/fbx/free-1972-datsun-240k-gt/textures/stickers.png',
                undefined, undefined,
                (err) => showError('stickers.png加载失败: ' + err)),
            tire: textureLoader.load('../../media/fbx/free-1972-datsun-240k-gt/textures/tire.png',
                undefined, undefined,
                (err) => showError('tire.png加载失败: ' + err))
        };

        loadingDiv.textContent = '正在应用材质...';
        console.log('模型对象:', object);

        // 遍历模型所有子对象应用材质
        object.traverse((child) => {
            if (child.isMesh) {
                try {
                    console.log(child.material);
                 
                    // 根据材质名称应用不同贴图
                    const matName = child.material?.name?.toLowerCase() || '';
                    if (matName.includes('headlight')) {
                        child.material.normalMap = textures.headlight;
                    } else if (matName.includes('plate')) {
                        child.material.map = textures.plate;
                    } else if (matName.includes('shadow')) {
                        child.material.map = textures.shadow;
                    } else if (matName.includes('sticker')) {
                        child.material.map = textures.stickers;
                    } else if (matName.includes('tire')) {
                        child.material.map = textures.tire;
                    } else {
                        // 默认使用body贴图
                        child.material.map = textures.body;
                    }
                    child.material.needsUpdate = true;
                } catch (e) {
                    showError(`材质应用错误: ${e.message}`);
                }
            }
        });

        loadingDiv.textContent = '模型加载完成！';

        // 计算模型边界框并自适应缩放
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3()).length();
        const center = box.getCenter(new THREE.Vector3());
        object.position.set(0, 0, 0);
        const scaler = 5 / size;
        object.scale.set(scaler, scaler, scaler);

        scene.add(object);
        camera.position.z = size * 1.5;
        controls.update();

        // 5秒后隐藏加载提示
        setTimeout(() => {
            loadingDiv.style.display = 'none';
        }, 5000);
    },
    (xhr) => {
        const percent = (xhr.loaded / xhr.total) * 100;
        loadingDiv.textContent = `模型加载中: ${percent.toFixed(1)}%`;
    },
    (error) => {
        showError('FBX模型加载失败: ' + error);
    }
);

// //加载纹理贴图
// const textureLoader = new THREE.TextureLoader();
// const textures = {
//     alpha: textureLoader.load('../../media/fbx/d0f0499c/textures/didelta_spinosa_alpha_4k.png'),
//     ao: textureLoader.load('../../media/fbx/d0f0499c/textures/didelta_spinosa_ao_4k.jpg'),
//     diffuse: textureLoader.load('../../media/fbx/d0f0499c/textures/didelta_spinosa_diff_4k.jpg'),
//     displacement: textureLoader.load('../../media/fbx/d0f0499c/textures/didelta_spinosa_disp_4k.png'),
//     normal: textureLoader.load('../../media/fbx/d0f0499c/textures/didelta_spinosa_nor_gl_4k.exr'),
//     roughness: textureLoader.load('../../media/fbx/d0f0499c/textures/didelta_spinosa_rough_4k.exr'),
//     translucency: textureLoader.load('../../media/fbx/d0f0499c/textures/didelta_spinosa_translucency_4k.png')
// };

// // 加载FBX模型
// const loader = new FBXLoader();
// loader.load('../../media/fbx/d0f0499c/0b780b7b.fbx', (object) => {
//     console.log('模型对象:', object);
//     // 遍历模型所有子对象应用材质
//     object.traverse((child) => {
//         if (child.isMesh) {
//             console.log(child.material.map);
//             child.material.map = textures.diffuse;
//             child.material.normalMap = textures.normal;
//             child.material.roughnessMap = textures.roughness;
//             child.material.aoMap = textures.ao;
//             child.material.alphaMap = textures.alpha;
//            // child.material.displacementMap = textures.displacement;// 取消了displacementMap的设置，因为模型本身没有displacement贴图
//             child.material.transparent = true;
//             child.material.needsUpdate = true;
//         }
//     });
//     scene.add(object);
// });
