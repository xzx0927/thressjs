import $ from 'jquery';

// 从 URL 中获取指定参数的值
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// 查看模型 (绑定到window对象)
window.viewModel = function(modelId) {
    console.log('查看模型:', modelId);
    window.location.href = `http://127.0.0.1:8000/model_show_url/${modelId}/`;
};

// 下载模型 (绑定到window对象)
window.downloadModel = function(modelId) {
    console.log('下载模型:', modelId);
    window.location.href = `http://127.0.0.1:8000/model_download/${modelId}/${localStorage.getItem('user_serial')}/`;
};

// 分页相关变量
let currentPage = 1;
const itemsPerPage = 6; // 修改为每页显示6条数据
let totalItems = 0;
let allData = [];

// 初始化图片放大功能
function setupImageModal() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const closeBtn = document.querySelector('.close');
    
    // 点击图片放大
    document.querySelectorAll('.model-image').forEach(img => {
        img.addEventListener('click', function() {
            modal.style.display = 'block';
            modalImg.src = this.src;
        });
    });
    
    // 点击关闭按钮
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 初始化图片轮播功能
function setupImageCarousel(container, images) {
    if (!images || images.length <= 1) return;
    
    let currentIndex = 0;
    const imageElement = container.querySelector('.model-image');
    const prevBtn = document.createElement('button');
    const nextBtn = document.createElement('button');
    
    prevBtn.className = 'image-nav prev';
    prevBtn.innerHTML = '&lt;';
    nextBtn.className = 'image-nav next';
    nextBtn.innerHTML = '&gt;';
    
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateImage();
    });
    
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % images.length;
        updateImage();
    });
    
    function updateImage() {
        imageElement.src = `http://127.0.0.1:8000/media/${images[currentIndex].image_path.replace(/\\/g, '/')}`;
    }
    
    container.appendChild(prevBtn);
    container.appendChild(nextBtn);
    
    // 自动轮播
    let interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % images.length;
        updateImage();
    }, 3000);
    
    // 鼠标悬停时暂停轮播
    container.addEventListener('mouseenter', () => {
        clearInterval(interval);
    });
    
    container.addEventListener('mouseleave', () => {
        interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % images.length;
            updateImage();
        }, 3000);
    });
}

// 显示分页数据
function displayPageData(page) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const pageData = allData.slice(startIndex, endIndex);
    
    let html = '';
    pageData.forEach((model, index) => {
        const firstImage = model.images && model.images.length > 0 ? 
            `http://127.0.0.1:8000/media/${model.images[0].image_path.replace(/\\/g, '/')}` : 
            null;
        
        html += `
        <div class="grid-item" style="grid-column: span 1">
            <div class="model-image-container">
                ${firstImage ? 
                    `<img src="${firstImage}" class="model-image" alt="${model.name || '模型图片'}">` : 
                    `<div style="display:flex; height:100%; align-items:center; justify-content:center; color:#999;">
                        未上传图片<br/>请联系管理员或作者
                    </div>`}
            </div>
            <div class="model-info">
                <div class="model-name" onclick="viewModel('${model.model_serial}')">
                    ${model.name || '未命名'}
                </div>
                <div class="model-type">${model.model_type || '未知类型'}</div>
                <div class="model-integral">${model.model_integral || 0}积分</div>
                <div class="model-download">
                    <button class="download-btn" onclick="downloadModel('${model.model_serial}')">下载</button>
                </div>
            </div>
        </div>`;
    });
    
    document.getElementById('dataDisplay').innerHTML = html;
    setupImageModal(); // 初始化图片放大功能
    
    // 为每个有多个图片的模型初始化轮播
    pageData.forEach((model, index) => {
        if (model.images && model.images.length > 1) {
            const container = document.querySelectorAll('.model-image-container')[index];
            setupImageCarousel(container, model.images);
        }
    });
}

// 更新分页导航
function updatePagination() {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    let paginationHtml = '<div class="pagination">';
    
    paginationHtml += `
        <button onclick="changePage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>上一页</button>
        <span>${currentPage}/${totalPages}</span>
        <button onclick="changePage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>下一页</button>
    `;
    
    document.getElementById('pagination').innerHTML = paginationHtml;
}

// 将 changePage 函数移动到 DOMContentLoaded 事件之前，确保全局可用
function changePage(page) {
    currentPage = page;
    displayPageData(currentPage);
    updatePagination();
}
window.changePage = changePage; // 暴露到全局作用域

// 执行搜索
function performSearch() {
    const keyword = document.getElementById('searchInput').value;
    document.getElementById('dataDisplay').innerHTML = '<div class="model-card">搜索中...</div>';
    fetchData(keyword);
}
window.performSearch = performSearch; // 暴露到全局作用域

// 获取数据
function fetchData(keyword) {
    $.ajax({
        url: 'http://127.0.0.1:8000/model_search/',
        type: 'GET',
        dataType: 'json',
        data: {
            data: keyword || getUrlParameter('data')
        },
        success: function(data) {
            console.log('API response:', data.models);
            allData = Array.isArray(data.models) ? data.models : [data.models];
            totalItems = allData.length;
            currentPage = 1;
            
            const messageEl = document.getElementById('searchMessage');
            if (totalItems === 0) {
                messageEl.textContent = '没有符合条件的数据';
                messageEl.style.display = 'block';
            } else {
                messageEl.style.display = 'none';
            }
            
            displayPageData(currentPage);
            updatePagination();
        },
        error: function(xhr, status, error) {
            console.error('API error:', error);
            document.getElementById('dataDisplay').innerHTML = '<div class="model-card">Error fetching data from API.</div>';
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    fetchData(getUrlParameter('data'));
    
    // 添加搜索框回车键事件监听
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
                e.preventDefault(); // 阻止默认表单提交行为
            }
        });
    }
});