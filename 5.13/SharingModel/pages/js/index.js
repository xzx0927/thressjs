
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

// 创建图片查看器 - 优化版
function createImageViewer() {
    const viewer = document.createElement('div');
    viewer.className = 'modal';
    viewer.innerHTML = `
        <span class="close-modal">&times;</span>
        <div class="modal-controls">
            <button class="modal-btn zoom-in" title="放大">+</button>
            <button class="modal-btn zoom-out" title="缩小">-</button>
            <button class="modal-btn rotate" title="旋转">↻</button>
            <button class="modal-btn download" title="下载">↓</button>
        </div>
        <div class="modal-image-container">
            <button class="nav-arrow prev-arrow" title="上一张">‹</button>
            <img class="modal-content" id="modal-image">
            <button class="nav-arrow next-arrow" title="下一张">›</button>
        </div>
        <div class="modal-caption"></div>
    `;
    document.body.appendChild(viewer);

    return {
        element: viewer,
        closeBtn: viewer.querySelector('.close-modal'),
        image: viewer.querySelector('.modal-content'),
        caption: viewer.querySelector('.modal-caption'),
        zoomInBtn: viewer.querySelector('.zoom-in'),
        zoomOutBtn: viewer.querySelector('.zoom-out'),
        rotateBtn: viewer.querySelector('.rotate'),
        downloadBtn: viewer.querySelector('.download')
    };
}

// 图片查看器实例
const imageViewer = createImageViewer();
let currentImageIndex = 0;
let currentImages = [];

// 初始化图片查看器事件 - 优化版
function initImageViewer() {
    let scale = 1;
    let rotation = 0;
    let startX, startY, offsetX = 0, offsetY = 0;
    let isDragging = false;
    let lastTouchDistance = 0;

    // 关闭查看器
    imageViewer.closeBtn.onclick = () => {
        imageViewer.element.classList.remove('show');
        resetImageTransform();
    };

    // 放大按钮
    imageViewer.zoomInBtn.onclick = () => {
        scale = Math.min(scale + 0.5, 3);
        applyImageTransform();
    };

    // 缩小按钮
    imageViewer.zoomOutBtn.onclick = () => {
        scale = Math.max(scale - 0.5, 1);
        applyImageTransform();
    };

    // 旋转按钮
    imageViewer.rotateBtn.onclick = () => {
        rotation = (rotation + 90) % 360;
        applyImageTransform();
    };

    // 下载按钮
    imageViewer.downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.href = imageViewer.image.src;
        link.download = `model-image-${currentImageIndex + 1}.jpg`;
        link.click();
    };

    // 双击缩放
    imageViewer.image.addEventListener('dblclick', () => {
        scale = scale === 1 ? 2 : 1;
        applyImageTransform();
    });

    // 鼠标拖动
    imageViewer.image.addEventListener('mousedown', (e) => {
        if (scale === 1) return;
        isDragging = true;
        startX = e.clientX - offsetX;
        startY = e.clientY - offsetY;
        imageViewer.image.classList.add('grabbing');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        applyImageTransform();
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        imageViewer.image.classList.remove('grabbing');
    });

    // 触摸手势
    imageViewer.image.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            // 双指缩放
            lastTouchDistance = getTouchDistance(e.touches[0], e.touches[1]);
        } else if (scale > 1) {
            // 单指拖动
            isDragging = true;
            startX = e.touches[0].clientX - offsetX;
            startY = e.touches[0].clientY - offsetY;
        }
    }, { passive: false });

    imageViewer.image.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            // 双指缩放
            e.preventDefault();
            const touchDistance = getTouchDistance(e.touches[0], e.touches[1]);
            scale = Math.max(1, Math.min(3, scale * (touchDistance / lastTouchDistance)));
            lastTouchDistance = touchDistance;
            applyImageTransform();
        } else if (isDragging) {
            // 单指拖动
            e.preventDefault();
            offsetX = e.touches[0].clientX - startX;
            offsetY = e.touches[0].clientY - startY;
            applyImageTransform();
        }
    }, { passive: false });

    imageViewer.image.addEventListener('touchend', () => {
        isDragging = false;
    });

    // 键盘事件增强
    document.addEventListener('keydown', (e) => {
        if (!imageViewer.element.classList.contains('show')) return;

        switch(e.key) {
            case 'Escape':
                imageViewer.element.classList.remove('show');
                resetImageTransform();
                break;
            case 'ArrowLeft':
                navigateImage(-1);
                break;
            case 'ArrowRight':
                navigateImage(1);
                break;
            case '+':
            case '=':
                imageViewer.zoomInBtn.click();
                break;
            case '-':
            case '_':
                imageViewer.zoomOutBtn.click();
                break;
            case 'r':
                imageViewer.rotateBtn.click();
                break;
        }
    });

    // 箭头按钮事件
    const prevArrow = imageViewer.element.querySelector('.prev-arrow');
    const nextArrow = imageViewer.element.querySelector('.next-arrow');
    
    if (prevArrow && nextArrow) {
        prevArrow.addEventListener('click', () => navigateImage(-1));
        nextArrow.addEventListener('click', () => navigateImage(1));
        
        // 触摸事件支持
        prevArrow.addEventListener('touchstart', (e) => {
            e.preventDefault();
            navigateImage(-1);
        });
        
        nextArrow.addEventListener('touchstart', (e) => {
            e.preventDefault();
            navigateImage(1);
        });
    }

    // 应用图片变换
    function applyImageTransform() {
        imageViewer.image.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg) translate(${offsetX}px, ${offsetY}px)`;
    }

    // 重置图片变换
    function resetImageTransform() {
        scale = 1;
        rotation = 0;
        offsetX = 0;
        offsetY = 0;
        imageViewer.image.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
    }

    // 计算触摸点距离
    function getTouchDistance(touch1, touch2) {
        return Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
    }

    // 导航图片
    function navigateImage(direction) {
        if (currentImages.length <= 1) return;
        
        currentImageIndex = (currentImageIndex + direction + currentImages.length) % currentImages.length;
        resetImageTransform();
        updateViewerImage();
    }
}

// 更新查看器中的图片 - 优化版
function updateViewerImage() {
    if (!currentImages.length) return;

    const image = currentImages[currentImageIndex];
    const imageUrl = `http://127.0.0.1:8000/media/${image.image_path}`;

    // 显示加载状态
    imageViewer.element.classList.add('loading');

    // 预加载下一张图片
    if (currentImages.length > 1) {
        const nextIndex = (currentImageIndex + 1) % currentImages.length;
        const nextImageUrl = `http://127.0.0.1:8000/media/${currentImages[nextIndex].image_path}`;
        const tempImg = new Image();
        tempImg.src = nextImageUrl;
    }

    // 加载当前图片
    lazyLoadImage(imageViewer.image, imageUrl)
        .then(() => {
            imageViewer.element.classList.remove('loading');
            imageViewer.element.classList.add('show');
            imageViewer.caption.textContent = image.caption || `图片 ${currentImageIndex + 1}/${currentImages.length}`;
        })
        .catch(() => {
            imageViewer.element.classList.remove('loading');
            imageViewer.caption.textContent = '图片加载失败';
        });
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
function renderStyleButtons(styles) {
    const container = document.querySelector('.style-buttons-container');
    const expandBtn = document.getElementById('expand-styles');
    
    // 清除现有按钮
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    // 最多显示9个其他按钮(加上"全部"共10个)
    const maxVisible = 9;
    const hasMore = styles.length > maxVisible;
    const visibleStyles = hasMore ? styles.slice(0, maxVisible) : styles;
    
    // 创建按钮元素并缓存
    const buttonElements = styles.map(style => {
        const btn = document.createElement('button');
        btn.className = 'style-btn';
        btn.textContent = style.style_name;
        btn.dataset.styleId = style.id;
        return btn;
    });

    // 初始显示可见按钮
    visibleStyles.forEach((style, index) => {
        container.appendChild(buttonElements[index]);
    });
    
    // 添加按钮点击事件 - 在当前页面执行搜索
    function bindStyleButtonEvents() {
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const styleName = this.textContent;
                elements.searchInput.value = styleName;
                handleSearch(styleName);
            });
        });
    }

    // 处理展开按钮
    if (hasMore) {
        expandBtn.style.display = 'block';
        expandBtn.textContent = '更多风格';
        
        expandBtn.onclick = () => {
            const isExpanded = expandBtn.textContent === '收起';
            
            // 清除容器
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            
            if (isExpanded) {
                // 收起状态 - 只显示可见按钮
                visibleStyles.forEach((style, index) => {
                    container.appendChild(buttonElements[index]);
                });
                expandBtn.textContent = '更多风格';
            } else {
                // 展开状态 - 显示所有按钮
                buttonElements.forEach(btn => {
                    container.appendChild(btn);
                });
                expandBtn.textContent = '收起';
            }
            
            // 绑定新添加按钮的事件
            bindStyleButtonEvents();
        };
    } else {
        expandBtn.style.display = 'none';
    }
    
    // 初始绑定按钮事件
    bindStyleButtonEvents();
}

function loadAndDisplayModels() {
    showLoading();

    $.ajax({
        url: 'http://127.0.0.1:8000/frontrender/',
        type: 'GET',
        data: {
            limit: 6,
            ordering: '-created_at'
        },
        success: function(response) {
            hideStates();
            const container = elements.mainDataContainer.querySelector('.models-grid');
            container.innerHTML = '';
            
            // 渲染style按钮
            if (response && response.model_styles && response.model_styles.length > 0) {
                renderStyleButtons(response.model_styles);
                
                // 添加按钮点击事件 - 在当前页面执行搜索
                document.querySelectorAll('.style-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const styleName = this.textContent;
                        elements.searchInput.value = styleName;
                        handleSearch(styleName);
                    });
                });
            }
            
            // 显示最新6条模型
            if (response && response.approved_models && response.approved_models.length > 0) {
                displayModels(response.approved_models);
            } else {
                showEmptyState();
            }
        },
        error: function() {
            showError();
        }
    });
}

function displayModels(models) {
    const container = elements.mainDataContainer.querySelector('.models-grid');
    container.innerHTML = '';
    
    models.forEach(model => {
        const card = createModelItem(model);
        container.appendChild(card);
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
        // 只取最后6条最新模型数据
        const latestModels = style.models.slice(-6);
        // 将模型数据按每3个分组(2行显示)
        for (let i = 0; i < latestModels.length; i += 3) {
            const rowModels = latestModels.slice(i, i + 3);
            const row = document.createElement('div');
            row.className = 'model-row';
            
            rowModels.forEach(model => {
                const card = createModelItem(model);
                row.appendChild(card);
            });
            
            // 如果这一行不满3个，添加空白卡片填充
            for (let j = rowModels.length; j < 3; j++) {
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
            window.location.href = 'http://127.0.0.1:8000/login_url/';
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

    // 格式按钮点击事件 - 在当前页面执行搜索
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const format = this.dataset.format;
            elements.searchInput.value = format;
            handleSearch(format);
        });
    });
}

// 统一处理导航按钮
function setupNavButtons(buttons) {
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            const value = this.textContent;
            elements.searchInput.value = value;
            handleSearch(value);
        });
    });
}

// 处理格式和风格按钮点击事件
function initNavigationButtons() {
    // 样式按钮
    const styleButtons = document.querySelectorAll('.style-btn');
    setupNavButtons(styleButtons);

    // 格式按钮
    const formatButtons = document.querySelectorAll('.format-btn');
    setupNavButtons(formatButtons);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 替换当前历史记录以禁止回退，即点击左上角回退页面还是index.html
    history.replaceState(null, '', location.href);
    initEventListeners();
    initImageViewer();
    checkAuthStatus();
    loadAndDisplayModels();
    initNavigationButtons(); // 新增的统一按钮初始化
});
