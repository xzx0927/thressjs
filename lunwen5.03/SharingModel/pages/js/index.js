// 无需修改：无移动端适配逻辑
// 全局DOM元素
const elements = {
    mainDataContainer: document.getElementById('main-data-container'),
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    adminIdDisplay: document.getElementById('adminIdDisplay'),
    loginButton: document.getElementById('loginButton'),
    logoutButton: document.getElementById('logoutButton'),
    profileButton: document.getElementById('profileButton'),
    uploadButton: document.getElementById('uploadButton'),
    checkinButton: document.getElementById('checkinButton'),
    searchInput: document.getElementById('search-input'),
    searchButton: document.getElementById('search-button')
};

// 创建图片查看器
function createImageViewer() {
    const viewer = document.createElement('div');
    viewer.className = 'image-viewer';
    viewer.innerHTML = `
        <div class="viewer-overlay"></div>
        <div class="viewer-container">
            <button class="viewer-close">&times;</button>
            <button class="viewer-prev">&lt;</button>
            <button class="viewer-next">&gt;</button>
            <div class="viewer-content">
                <img src="" alt="模型图片">
            </div>
            <div class="viewer-counter"></div>
        </div>
    `;
    document.body.appendChild(viewer);
    
    return {
        element: viewer,
        overlay: viewer.querySelector('.viewer-overlay'),
        container: viewer.querySelector('.viewer-container'),
        closeBtn: viewer.querySelector('.viewer-close'),
        prevBtn: viewer.querySelector('.viewer-prev'),
        nextBtn: viewer.querySelector('.viewer-next'),
        image: viewer.querySelector('img'),
        counter: viewer.querySelector('.viewer-counter')
    };
}

// 图片查看器实例
const imageViewer = createImageViewer();
let currentImageIndex = 0;
let currentImages = [];

// 初始化图片查看器事件
function initImageViewer() {
    // 关闭查看器
    imageViewer.closeBtn.onclick = () => {
        imageViewer.element.classList.remove('active');
    };
    imageViewer.overlay.onclick = () => {
        imageViewer.element.classList.remove('active');
    };
    
    // 上一张图片
    imageViewer.prevBtn.onclick = () => {
        if (currentImages.length <= 1) return;
        currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
        updateViewerImage();
    };
    
    // 下一张图片
    imageViewer.nextBtn.onclick = () => {
        if (currentImages.length <= 1) return;
        currentImageIndex = (currentImageIndex + 1) % currentImages.length;
        updateViewerImage();
    };
    
    // 键盘事件
    document.addEventListener('keydown', (e) => {
        if (!imageViewer.element.classList.contains('active')) return;
        
        switch(e.key) {
            case 'Escape':
                imageViewer.element.classList.remove('active');
                break;
            case 'ArrowLeft':
                imageViewer.prevBtn.click();
                break;
            case 'ArrowRight':
                imageViewer.nextBtn.click();
                break;
        }
    });
}

// 更新查看器中的图片
function updateViewerImage() {
    if (!currentImages.length) return;
    
    const image = currentImages[currentImageIndex];
    const imageUrl = `http://127.0.0.1:8000/media/${image.image_path}`;
    
    // 显示加载状态
    imageViewer.container.classList.add('loading');
    
    // 预加载图片
    lazyLoadImage(imageViewer.image, imageUrl)
        .then(() => {
            imageViewer.container.classList.remove('loading');
        })
        .catch(() => {
            imageViewer.container.classList.remove('loading');
            imageViewer.container.classList.add('error');
        });
    
    imageViewer.counter.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;
    imageViewer.prevBtn.style.display = currentImages.length > 1 ? 'block' : 'none';
    imageViewer.nextBtn.style.display = currentImages.length > 1 ? 'block' : 'none';
}

// 显示加载状态
function showLoading() {
    elements.loadingState.style.display = 'flex';
    elements.errorState.style.display = 'none';
    elements.mainDataContainer.querySelector('.models-grid').innerHTML = '';
}

// 显示错误状态
function showError() {
    elements.loadingState.style.display = 'none';
    elements.errorState.style.display = 'block';
}

// 隐藏状态提示
function hideStates() {
    elements.loadingState.style.display = 'none';
    elements.errorState.style.display = 'none';
}

// 搜索功能实现
function handleSearch(searchTerm) {
    const params = new URLSearchParams();
    params.set('data', searchTerm);
    window.location.href = `http://127.0.0.1:8000/model_search_url/${params.toString()}/`;
}

// 加载并展示模型数据
function loadAndDisplayModels() {
    showLoading();

    $.ajax({
        url: 'http://127.0.0.1:8000/frontrender/',
        type: 'GET',
        success: function(response) {
            console.log(response.list);
            console.log(response.list[0].style_name);
            console.log(response.list[0].style_dsc);
            hideStates();
            const container = elements.mainDataContainer.querySelector('.models-grid');
            container.innerHTML = '';
            
            if (response && response.list && response.list.length > 0) {
                response.list.forEach(style => {
                    const styleSection = createStyleSection(style);
                    container.appendChild(styleSection);
                });
            } else {
                showEmptyState();
            }
        },
        error: function() {
            showError();
        }
    });
}

// 创建风格区域
function toggleExpand(e) {
    const desc = e.target.previousElementSibling;
    desc.classList.toggle('expanded');
    e.target.textContent = desc.classList.contains('expanded') ? '收起' : '展开';
}

function createStyleSection(style) {
    const section = document.createElement('div');
    section.className = 'style-section';
    
    // 创建左侧容器
    const leftContainer = document.createElement('div');
    leftContainer.className = 'style-left';
    
    const header = document.createElement('div');
    header.className = 'style-header';
    header.innerHTML = `
        <h3 class="style-title">${style.style_name}</h3>
        ${style.style_dsc ? `
            <div class="style-desc-container">
                <p class="style-desc">${style.style_dsc}</p>
                <span class="toggle-expand">展开</span>
            </div>
        ` : ''}
    `;
    
    // 添加展开/收起事件
    if (style.style_dsc) {
        const toggleBtn = header.querySelector('.toggle-expand');
        toggleBtn.addEventListener('click', toggleExpand);
    }
    
    leftContainer.appendChild(header);
    section.appendChild(leftContainer);
    
    // 创建右侧容器
    const rightContainer = document.createElement('div');
    rightContainer.className = 'style-models-container';
    
    if (style.models && style.models.length > 0) {
        // 只取最后4条最新模型数据
        const latestModels = style.models.slice(-4);
        // 将模型数据按每4个分组
        for (let i = 0; i < latestModels.length; i += 4) {
            const rowModels = latestModels.slice(i, i + 4);
            const row = document.createElement('div');
            row.className = 'model-row';
            
            rowModels.forEach(model => {
                const card = createModelItem(model);
                row.appendChild(card);
            });
            
            // 如果这一行不满4个，添加空白卡片填充
            for (let j = rowModels.length; j < 4; j++) {
            const emptyCard = document.createElement('div');
            emptyCard.className = 'model-item';
            emptyCard.style.visibility = 'hidden';
                row.appendChild(emptyCard);
            }
            
            rightContainer.appendChild(row);
        }
    } else {
        // 没有模型时显示提示信息
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'no-models-message';
        emptyMsg.textContent = '模型风格内没模型信息';
        rightContainer.appendChild(emptyMsg);
    }
    section.appendChild(rightContainer);
    return section;
}

// 创建图片占位符
function createPlaceholder() {
    const placeholder = document.createElement('div');
    placeholder.className = 'image-placeholder';
    placeholder.innerHTML = `
        <div class="placeholder-shimmer"></div>
        <div class="placeholder-icon">
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
        </div>
    `;
    return placeholder;
}

// 延迟加载图片
function lazyLoadImage(img, src) {
    return new Promise((resolve, reject) => {
        const tempImage = new Image();
        
        tempImage.onload = () => {
            img.src = src;
            img.classList.add('loaded');
            resolve(img);
        };
        
        tempImage.onerror = () => {
            img.classList.add('error');
            reject(new Error('图片加载失败'));
        };
        
        tempImage.src = src;
    });
}

// 页面加载时检查是否需要刷新
if (sessionStorage.getItem('shouldRefresh')) {
    sessionStorage.removeItem('shouldRefresh');
    window.location.reload();
}

// 从model_search.js添加全局函数
window.viewModel = function(modelId) {
    console.log('查看模型:', modelId);
    sessionStorage.setItem('shouldRefresh', 'true');
    window.location.href = `http://127.0.0.1:8000/model_show_url/${modelId}/`;
};

window.downloadModel = function(modelId) {
    console.log('下载模型:', modelId);
    const userSerial = localStorage.getItem('user_serial');
    if (!userSerial) {
        alert('请先登录后再下载模型');
        sessionStorage.setItem('shouldRefresh', 'true');
        window.location.href = 'http://127.0.0.1:8000/login/';
        return;
    }
    sessionStorage.setItem('shouldRefresh', 'true');
    window.location.href = `http://127.0.0.1:8000/model_download/${modelId}/${userSerial}/`;
};

// 创建模型卡片 - 与model_search.js保持一致
function createModelItem(model) {
    const card = document.createElement('div');
    card.className = 'model-item';
    card.style.gridColumn = 'span 1';
    
    // 图片容器
    const imgContainer = document.createElement('div');
    imgContainer.className = 'model-image-container';
    
    // 图片处理
    const images = model.approved_images || model.images || [];
    if (images.length > 0) {
        const img = document.createElement('img');
        img.className = 'model-image loading';
        img.alt = model.name || '未命名模型';
        
        const placeholder = createPlaceholder();
        imgContainer.appendChild(placeholder);
        
        const imageUrl = `http://127.0.0.1:8000/media/${images[0].image_path}`;
        
        // 图片延迟加载
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                lazyLoadImage(img, imageUrl)
                    .then(() => {
                        placeholder.remove();
                        imgContainer.appendChild(img);
                        
                        // 点击图片打开查看器
                        imgContainer.addEventListener('click', () => {
                            currentImages = images;
                            currentImageIndex = 0;
                            updateViewerImage();
                            imageViewer.element.classList.add('active');
                        });
                        
                        // 如果有多个图片，添加轮播按钮
                        if (images.length > 1) {
                            setupImageCarousel(imgContainer, images);
                        }
                    })
                    .catch(() => {
                        placeholder.innerHTML = '<div class="load-error">图片加载失败</div>';
                    });
                observer.unobserve(imgContainer);
            }
        }, { rootMargin: '50px 0px', threshold: 0.1 });
        
        observer.observe(imgContainer);
    } else {
        imgContainer.innerHTML = `
            <div style="display:flex; height:100%; align-items:center; justify-content:center; color:#999;">
                未上传图片<br/>请联系管理员或作者
            </div>
        `;
    }
    
    card.appendChild(imgContainer);
    
    // 模型信息
    const infoDiv = document.createElement('div');
    infoDiv.className = 'model-info';
    infoDiv.innerHTML = `
        <div class="model-name" onclick="viewModel('${model.model_serial}')">
            ${model.name || '未命名'}
        </div>
        <div class="model-type">${model.model_type || '未知类型'}</div>
        <div class="model-integral">${model.model_integral || 0}积分</div>
        <div class="model-download">
            <button class="download-btn" onclick="downloadModel('${model.model_serial}')">下载</button>
        </div>
    `;
    
    card.appendChild(infoDiv);
    return card;
}

// 从model_search.js添加图片轮播函数
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
        const imageUrl = `http://127.0.0.1:8000/media/${images[currentIndex].image_path}`;
        lazyLoadImage(imageElement, imageUrl);
    }
    
    container.appendChild(prevBtn);
    container.appendChild(nextBtn);
    
    // 自动轮播
    let interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % images.length;
        updateImage();
    }, 3000);
    
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

// 显示空状态
function showEmptyState() {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
        <div class="empty-icon">&#x1F50D;</div>
        <p class="empty-text">暂无模型数据，请尝试上传或搜索其他内容</p>
    `;
    elements.mainDataContainer.querySelector('.models-grid').appendChild(emptyState);
}

// 检查用户登录状态
function checkAuthStatus() {
    try {
        const adminId = localStorage.getItem('admin_id');
        const userSerial = localStorage.getItem('user_serial');
        
        // 验证存储的用户信息是否完整
        if (!adminId || !userSerial) {
            // 如果信息不完整，清除所有存储的用户数据
            localStorage.removeItem('admin_id');
            localStorage.removeItem('user_serial');
            localStorage.removeItem('lastCheckinDate');
            updateUI(null, null);
            return;
        }
        
        updateUI(adminId, userSerial);
    } catch (error) {
        console.error('获取用户凭证失败:', error);
        // 发生错误时清除所有存储的用户数据
        localStorage.removeItem('admin_id');
        localStorage.removeItem('user_serial');
        localStorage.removeItem('lastCheckinDate');
        updateUI(null, null);
    }
}

// 更新用户界面显示
function updateUI(adminId, userSerial) {
    // 默认隐藏所有需要登录后才显示的按钮
    elements.logoutButton.style.display = 'none';
    elements.profileButton.style.display = 'none';
    elements.uploadButton.style.display = 'none';
    elements.checkinButton.style.display = 'none';
    elements.loginButton.style.display = 'block';

    if (adminId && userSerial) {
        // 用户已登录状态
        elements.adminIdDisplay.textContent = `欢迎，用户编号：${userSerial}，用户名 ${adminId}`;
        elements.loginButton.style.display = 'none';
        elements.logoutButton.style.display = 'block';
        elements.profileButton.style.display = 'block';
        elements.uploadButton.style.display = 'block';
        elements.checkinButton.style.display = 'block';
        initCheckinButton();
    } else {
        // 用户未登录状态
        elements.adminIdDisplay.textContent = '欢迎，请登录';
        elements.loginButton.style.display = 'block';
    }
}

// 更新签到按钮状态
function updateCheckinButtonState(isSignedIn) {
    const button = elements.checkinButton;
    if (isSignedIn) {
        button.textContent = '已签到';
        button.disabled = true;
        button.style.opacity = '0.7';
    } else {
        button.textContent = '签到';
        button.disabled = false;
        button.style.opacity = '1';
    }
}

// 初始化签到按钮状态
function initCheckinButton() {
    const userSerial = localStorage.getItem('user_serial');
    const today = new Date().toDateString();

    $.ajax({
        url: 'http://127.0.0.1:8000/checkin_status/',
        type: 'GET',
        data: { user_serial: userSerial },
        success: function(response) {
            if (response.message === '已签到') {
                updateCheckinButtonState(true);
                localStorage.setItem('lastCheckinDate', today);
            } else {
                updateCheckinButtonState(false);
                localStorage.removeItem('lastCheckinDate');
            }
        },
        error: function() {
            const lastCheckinDate = localStorage.getItem('lastCheckinDate');
            if (lastCheckinDate === today) {
                updateCheckinButtonState(true);
            } else {
                updateCheckinButtonState(false);
            }
        }
    });
}

// 初始化事件监听器
function initEventListeners() {
    // 按钮点击事件
    elements.loginButton.onclick = () => window.location.href = 'http://127.0.0.1:8000/login_url/';
    elements.profileButton.onclick = () => {
        const userSerial = localStorage.getItem('user_serial');
        if (!userSerial) {
            alert('请先登录');
            return;
        }
        window.location.href = 'http://127.0.0.1:8000/profile/';
    };
    elements.uploadButton.onclick = () => {
        const userSerial = localStorage.getItem('user_serial');
        if (!userSerial) {
            alert('请先登录');
            return;
        }
        window.location.href = 'http://127.0.0.1:8000/model_upload_url/';
    };
    
    // 登出事件
    elements.logoutButton.addEventListener('click', function() {
        try {
            localStorage.removeItem('user_serial');
            localStorage.removeItem('admin_id');
            localStorage.removeItem('lastCheckinDate');
            updateUI(null, null);
        } catch (error) {
            alert('退出登录失败，请刷新页面重试');
        }
    });
    
    // 签到事件
    elements.checkinButton.addEventListener('click', function() {
        const userSerial = localStorage.getItem('user_serial');
        if (!userSerial) {
            alert('请先登录后再签到');
            return;
        }
    
        this.disabled = true;
    
        $.ajax({
            url: 'http://127.0.0.1:8000/signin/',
            type: 'GET',
            data: { user_serial: userSerial },
            success: function(response) {
                if (response.message === '签到成功') {
                    alert(`签到成功！获得${response.integral}积分`);
                    updateCheckinButtonState(true);
                    localStorage.setItem('lastCheckinDate', new Date().toDateString());
                } else {
                    alert(`签到失败：${response.message}今日已获得${response.integral}积分，请明天再来`);
                    updateCheckinButtonState(false);
                }
            },
            error: function(xhr, status, error) {
                alert('签到请求失败，请稍后重试');
                updateCheckinButtonState(false);
            }
        });
    });
    
    // 搜索事件
    elements.searchButton.addEventListener('click', () => {
        const searchTerm = elements.searchInput.value.trim();
        if (searchTerm) {
            handleSearch(searchTerm);
        }
    });
    
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            elements.searchButton.click();
        }
    });

    // 格式按钮点击事件
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const format = btn.dataset.format;
            handleSearch(format);
        });
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 替换当前历史记录以禁止回退，即点击左上角回退页面还是index.html
    history.replaceState(null, '', location.href);
    initEventListeners();
    initImageViewer();
    checkAuthStatus();
    loadAndDisplayModels();
});