import $ from 'jquery';

// 重定向到登录页面的函数
function redirectToLogin(message) {
    alert(message);
    window.location.href = 'http://127.0.0.1:8000/login_url/';
}

// 模拟获取模型信息数据的函数
function fetchProfileData(userSerial) {
    if (!userSerial) {  
        redirectToLogin('请先登录！');
        return;
    }

    $.ajax({
        url: 'http://127.0.0.1:8000/profile_production/', // 修正了URL中的拼写错误
        type: 'GET',
        data: { user_serial: userSerial },
        success: function(data) {
            console.log('获取模型信息成功:', data.message);
            console.log(data.models);
            populateProfileData(data.models);
        },
        error: function(xhr, status, error) {
            console.error('AJAX请求失败:', xhr.status, error);
            if (xhr.status === 401) {
                redirectToLogin('未授权，请登录后重试。');
            } else {
                alert('无法获取模型信息，请稍后重试。');
            }
        }
    });
}

// 填充模型信息的函数
let modelsArray = [];
let currentPage = 0;

function populateProfileData(models) {
    modelsArray = models;
    currentPage = 0;
    updateModelData();
}

function updateModelData() {
    const container = document.getElementById('model-card-container');// 获取模型卡片容器元素
    container.innerHTML = '';

    const modelsPerPage = 3; // 每页显示3个模型
    const startIndex = currentPage * modelsPerPage; // 计算当前页的起始索引
    const endIndex = startIndex + modelsPerPage; // 计算当前页的结束索引
    
    const modelsSlice = modelsArray.slice(startIndex, endIndex); // 切片获取当前页的模型数据

    modelsSlice.forEach(model => {
        
        const modelCard = document.createElement('div');// 创建模型卡片元素
        
        modelCard.className = 'model-card';// 为模型卡片元素添加类名
        const imagesHTML = model.images && model.images.length > 0 ? 
            `
            <div class="image-carousel" data-model-id="${model.model_serial}">
                <div class="carousel-inner">
                    ${model.images.map((img, index) => `
                        <div class="carousel-item ${index === 0 ? 'active' : ''}">
                    <img src="http://127.0.0.1:8000/media/${img.image_path.replace(/\\/g, '/')}" 
                         alt="${model.name}" 
                         class="model-image"
                         onclick="zoomImage('http://127.0.0.1:8000/media/${img.image_path.replace(/\\/g, '/')}')">
                        </div>
                    `).join('')}
                </div>
                ${model.images.length > 1 ? `
                    <button class="carousel-control prev" onclick="changeImage('${model.model_serial}', -1)">❮</button>
                    <button class="carousel-control next" onclick="changeImage('${model.model_serial}', 1)">❯</button>
                ` : ''}
            </div>
            ` : 
            '<div class="no-image">暂无图片</div>';
            
        modelCard.innerHTML = `
            ${imagesHTML}
            <div class="model-info">
                <p>名称: ${model.name}</p>
                <p>类型: ${model.model_type}</p>
                <p>状态: ${model.model_state}</p>
                <p>描述: ${model.model_desc}</p>
                <p>积分: ${model.model_integral}</p>
            </div>
            <div class="model-actions">
                <button type="button" onclick="viewModel('${model.model_serial}')">查看</button>
                <button type="button" onclick="uploadThumbnail('${model.model_serial}')">上传简略图</button>
                <button type="button" onclick="modifyThumbnail('${model.model_serial}')">修改图片</button>
                <button type="button" onclick="deleteModel('${model.model_serial}')">删除</button>
                <button type="button" onclick="editModel('${model.model_serial}')">编辑</button>
                <button type="button" class="download-btn" onclick="downloadModel('${model.model_serial}', '${localStorage.getItem('user_serial')}')">下载</button>
            </div>
        `;
        container.appendChild(modelCard);
        
        // 如果模型有多个图片，启动轮播
        if (model.images && model.images.length > 1) {
            startCarousel(model.model_serial);
        }
    });

    updatePagination();
}

function updatePagination() {
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(modelsArray.length / 3); // 计算总页数
    const paginationButton = document.createElement('div');// 创建分页按钮元素
    paginationButton.className = 'pagination';// 为分页按钮元素添加类名

    paginationButton.innerHTML = `
        <button onclick="prevPage()" ${currentPage === 0 ? 'disabled' : ''}>上一页</button>
        <span>${currentPage + 1}/${totalPages}</span>
        <button onclick="nextPage()" ${currentPage >= Math.ceil(modelsArray.length / 3) - 1 ? 'disabled' : ''}>下一页</button>
    `;

    paginationContainer.appendChild(paginationButton);
}

function nextPage() {
    if (currentPage < Math.ceil(modelsArray.length / 3) - 1) {
        currentPage++;
        updateModelData();
    }
}

function prevPage() {
    if (currentPage > 0) {
        currentPage--;
        updateModelData();
    }
}

// 查看模型的函数（示例）
function viewModel(modelId) {
    console.log('查看模型:', modelId);
    window.location.href = `http://127.0.0.1:8000/model_show_url/${modelId}/`;// 跳转到查看模型页面
    
}

// 删除模型的函数（示例）
function deleteModel(modelId) {
    console.log('删除模型:', modelId);
    window.location.href = `http://127.0.0.1:8000/model_delete_url/${modelId}/`;// 跳转到删除模型页面
}

// 编辑模型的函数（示例）
function editModel(modelId) {
    console.log('编辑模型:', modelId);
   window.location.href = `http://127.0.0.1:8000/model_edit_url/${modelId}/`;// 跳转到编辑模型页面
}

// 上传模型的函数（示例）
function uploadModel() {
    console.log('上传模型');
    window.location.href = 'http://127.0.0.1:8000/model_upload_url/';// 跳转到上传模型页面
}

// 上传简略图的函数
function uploadThumbnail(modelId) {
    console.log('上传简略图:', modelId);
    window.location.href = `http://127.0.0.1:8000/upload_image_url/${modelId}/`;
}

// 修改图片的函数
function modifyThumbnail(modelId) {
    console.log('修改图片:', modelId);
    window.location.href = `http://127.0.0.1:8000/image_edit_url/${modelId}/`;
}

// 下载模型的函数
function downloadModel(modelId, user_serial) {
    console.log('下载模型:', modelId);
    window.location.href = `http://127.0.0.1:8000/model_download/${modelId}/${user_serial}`;
}

// 返回首页函数
function returnToHome() {
    // 设置刷新标志
    sessionStorage.setItem('shouldRefresh', 'true');
    // 替换当前历史记录以禁止回退
    history.replaceState(null, '', '../index.html');
    // 跳转到首页
    window.location.href = '../index.html';
}

// 图片放大功能
function zoomImage(imageUrl) {
    window.open(imageUrl, '_blank');
}



// 自动轮播功能
let carouselIntervals = {};

function startCarousel(modelId) {
    if (carouselIntervals[modelId]) {
        clearInterval(carouselIntervals[modelId]);
    }
    
    const carousel = document.querySelector(`.image-carousel[data-model-id="${modelId}"]`);
    if (!carousel || !carousel.querySelectorAll('.carousel-item').length > 1) return;

    carouselIntervals[modelId] = setInterval(() => {
        changeImage(modelId, 1);
    }, 3000); // 3秒轮播间隔
}

function stopCarousel(modelId) {
    if (carouselIntervals[modelId]) {
        clearInterval(carouselIntervals[modelId]);
    }
}



// 模态框内导航
function navigateModal(modelId, currentIndex, direction) {
    const model = modelsArray.find(m => m.model_serial === modelId);
    if (!model || !model.images) return;

    const newIndex = (currentIndex + direction + model.images.length) % model.images.length;
    const modal = document.querySelector('.modal');
    if (modal) {
        const img = modal.querySelector('.modal-content');
        img.src = `http://127.0.0.1:8000/media/${model.images[newIndex].image_path}`;
    }
}

// 切换轮播图片
function changeImage(modelId, direction) {
    const carousel = document.querySelector(`.image-carousel[data-model-id="${modelId}"]`);
    if (!carousel) return;

    const inner = carousel.querySelector('.carousel-inner');
    const items = carousel.querySelectorAll('.carousel-item');
    const activeIndex = Array.from(items).findIndex(item => item.classList.contains('active'));
    
    if (activeIndex === -1) return;

    const newIndex = (activeIndex + direction + items.length) % items.length;
    
    items[activeIndex].classList.remove('active');
    items[newIndex].classList.add('active');
    inner.style.transform = `translateX(-${newIndex * 100}%)`;
}

// 将函数暴露给全局对象
window.nextPage = nextPage;
window.viewModel = viewModel;
window.deleteModel = deleteModel;
window.editModel = editModel;
window.uploadModel = uploadModel;
window.prevPage = prevPage;
window.downloadModel = downloadModel;
window.uploadThumbnail = uploadThumbnail;
window.modifyThumbnail = modifyThumbnail;
window.returnToHome = returnToHome;

window.changeImage = changeImage;
window.navigateModal = navigateModal;
window.zoomImage = zoomImage;

// 在页面加载时获取模型信息
window.onload = function() {
    const userSerial = localStorage.getItem('user_serial'); // 从localStorage获取adminId
    fetchProfileData(userSerial);
};
