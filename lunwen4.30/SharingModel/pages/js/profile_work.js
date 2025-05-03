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

    const modelsPerPage = 10; // 每页显示10个模型
    const startIndex = currentPage * modelsPerPage; // 计算当前页的起始索引
    const endIndex = startIndex + modelsPerPage; // 计算当前页的结束索引
    
    const modelsSlice = modelsArray.slice(startIndex, endIndex); // 切片获取当前页的模型数据

    modelsSlice.forEach(model => {
        
        const modelCard = document.createElement('div');// 创建模型卡片元素
        
        modelCard.className = 'model-card';// 为模型卡片元素添加类名
        modelCard.innerHTML = `
            <p>名称: ${model.name}</p>
            <p>类型: ${model.model_type}</p>
            <p>状态: ${model.model_state}</p>
            <p>描述: ${model.model_desc}</p>
            <p>积分: ${model.model_integral}</p>
            <div>
                <button type="button" onclick="viewModel('${model.model_serial}')">查看</button>
                <button type="button" onclick="uploadThumbnail('${model.model_serial}')">上传简略图</button>
                <button type="button" onclick="deleteModel('${model.model_serial}')">删除</button>
                <button type="button" onclick="editModel('${model.model_serial}')">编辑</button>
                <button type="button" class="download-btn" onclick="downloadModel('${model.model_serial}', '${localStorage.getItem('user_serial')}')">下载</button>
            </div>
        `;
        container.appendChild(modelCard);
    });

    updatePagination();
}

function updatePagination() {
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(modelsArray.length / 10); // 计算总页数
    const paginationButton = document.createElement('div');// 创建分页按钮元素
    paginationButton.className = 'pagination';// 为分页按钮元素添加类名

    paginationButton.innerHTML = `
        <button onclick="prevPage()" ${currentPage === 0 ? 'disabled' : ''}>上一页</button>
        <span>${currentPage + 1}/${totalPages}</span>
        <button onclick="nextPage()" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>下一页</button>
    `;

    paginationContainer.appendChild(paginationButton);
}

function nextPage() {
    if (currentPage < Math.ceil(modelsArray.length / 10) - 1) {
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

// 下载模型的函数
function downloadModel(modelId, user_serial) {
    console.log('下载模型:', modelId);
    window.location.href = `http://127.0.0.1:8000/model_download/${modelId}/${user_serial}`;
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

// 在页面加载时获取模型信息
window.onload = function() {
    const userSerial = localStorage.getItem('user_serial'); // 从localStorage获取adminId
    fetchProfileData(userSerial);
};
