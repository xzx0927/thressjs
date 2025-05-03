// 使用jQuery获取模型数据
import $ from 'jquery';

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

const urlParams = getUrlParams(); // 获取URL参数

// 获取模型数据
function fetchModelData(callback) {
    console.log('Fetching model data for ID:', urlParams.model_id);
    
    $.ajax({
        url: `http://127.0.0.1:8000/model_edit/${urlParams.model_id}/`,
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            console.log('API response:', response);
            if (response.message === '获取成功' && response.model) {
                console.log('Model data:', response.model);
                renderModelList(response.model);
            } else {
                console.warn('Unexpected response format');
                alert('获取数据失败：响应格式不正确');
            }
        },
        error: function(xhr, status, error) {
            console.error('Failed to fetch model data:', {
                status: xhr.status,
                error: error,
                responseText: xhr.responseText
            });
            alert('无法加载模型数据，请检查控制台获取详细信息');
        }
    });
}

// 渲染模型数据到表单
function renderModelList(model) {
    console.log('Rendering model data:', model);
    
    if (!model) {
        console.warn('No model data received');
        alert('未获取到模型数据');
        return;
    }

    try {
        // 格式化路径显示
        const formatPath = (path) => {
            if (!path) return '未指定文件路径';
            const normalized = path.replace(/\\/g, '/');
            return normalized.split('/').slice(-3).join('/'); // 显示最后3级路径
        };

        // 填充基本表单字段
        $('#model_seria').val(model.model_serial || '');
        $('#name').val(model.name || '');
        $('#description').val(model.model_desc || '');
        $('#tags').val(model.tags || 'uncompress');
        
        // 设置文件类型选择器
        if (model.model_type) {
            $('#type').val(model.model_type);
            if (!$('#type').val()) {
                console.warn(`Invalid type value: ${model.model_type}`);
                $('#type').val('glb'); // 设置默认值
            }
        }

        // 显示初始文件路径
        const currentPath = formatPath(model.model_path);
        $('#currentFilePath').text(currentPath || '未选择文件');
        $('#filePathInfo').text(`当前模型文件路径: ${currentPath}`);
        
        // 初始化原始文件引用
        originalFile = {
            name: model.model_path ? model.model_path.split('/').pop() : '',
            size: 0,
            lastModified: 0
        };
        console.log('Initialized originalFile:', originalFile);
        
        console.log('Form fields and model info populated successfully');
    } catch (error) {
        console.error('Failed to render model data:', error);
        alert('渲染模型数据时出错: ' + error.message);
    }
}

let originalFile = null;

// 检查文件是否变化
function isFileChanged() {
    const fileInput = document.getElementById('file');
    if (!fileInput.files.length) {
        console.log('No file selected');
        return false;
    }
    
    const currentFile = fileInput.files[0];
    console.log('Current file:', currentFile.name, currentFile.size, currentFile.lastModified);
    console.log('Original file:', originalFile ? originalFile.name : 'null', originalFile ? originalFile.size : 'null', originalFile ? originalFile.lastModified : 'null');
    
    if (!originalFile) {
        console.log('No original file, treating as changed');
        return true;
    }
    
    const isChanged = currentFile.name !== originalFile.name || 
                     currentFile.size !== originalFile.size ||
                     currentFile.lastModified !== originalFile.lastModified;
    
    console.log('File changed:', isChanged);
    return isChanged;
}

// 处理表单提交
function handleFormSubmit(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('file');
    
    // 清除可能存在的旧错误状态
    fileInput.style.borderColor = '';
    const oldError = document.querySelector('.error-message');
    if (oldError) oldError.remove();
    
    // 检查文件是否变化
    if (fileInput.files.length && !isFileChanged()) {
        if (!confirm('文件未修改，确定要继续上传吗？')) {
            return;
        }
    }
    
    const form = event.target;
    const formData = new FormData(form);
    
    $.ajax({
        url: `http://127.0.0.1:8000/model_edit/${urlParams.model_id}/`,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            alert('数据保存成功');
            originalFile = fileInput.files[0]; // 更新原始文件
            window.location.href = 'http://127.0.0.1:8000/profile_works'; // 跳转到模型列表页面
        },
        error: function(xhr, status, error) {
            console.error('保存失败:', error);
            alert('保存失败: ' + error);
        }
    });
}

// 初始化页面
function initPage() {
    // 确保DOM完全加载后再执行
    $(() => {
        console.log('DOM fully loaded, initializing page...');
        
        // 验证表单字段是否存在
        const requiredFields = ['#model_seria', '#name', '#description', '#tags', '#type'];
        const missingFields = requiredFields.filter(selector => !$(selector).length);
        
        if (missingFields.length > 0) {
            console.error('Missing required form fields:', missingFields);
            alert('页面表单字段不完整，无法加载数据');
            return;
        }

        console.log('All form fields present, fetching data...');
        fetchModelData(); // 获取并显示数据
        
        // 监听文件变化
        $('#file').on('change', function() {
            const file = this.files[0];
            originalFile = file;
            
            // 更新当前文件显示
            const pathDisplay = document.getElementById('currentFilePath');
            if (file) {
                pathDisplay.textContent = file.name;
                pathDisplay.style.color = 'var(--primary-color)';
            } else {
                pathDisplay.textContent = '未选择文件';
                pathDisplay.style.color = '';
            }
        });
        
        // 绑定表单提交事件
        $('#uploadForm').on('submit', handleFormSubmit);
    });
}

// 页面加载时初始化
$(document).ready(initPage);

// 模型编辑页面的 JavaScript 逻辑
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('modelEditForm');
    const submitButton = document.querySelector('.submit-button');

    // 表单提交事件处理
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(form);
        // TODO: 发送表单数据到服务器
        console.log('Form data:', Object.fromEntries(formData));
        alert('模型已成功编辑！');
    });

    // 按钮点击效果
    submitButton.addEventListener('click', function () {
        this.style.backgroundColor = '#0056b3';
    });
});
