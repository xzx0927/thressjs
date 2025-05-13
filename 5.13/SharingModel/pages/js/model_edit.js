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
            // console.log('API response:', response);控制台信息
            if (response.message === '获取成功' && response.model) {
                // console.log('Model data:', response.model);调试
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
    if (!model) return;
    
    // 设置表单字段值
    $('#modelName').val(model.name || '');
    $('#modelDescription').val(model.model_desc || '');
    $('#tags').val(model.tags || 'uncompress');
    $('#type').val(model.model_type || 'gltf');
    $('#modelSerial').val(model.model_serial || '');
    
    // 显示文件路径
    if (model.model_path) {
        const fileName = model.model_path.split('/').pop();
        $('#filePathInfo').text(`当前模型文件路径: ${fileName}`);
    }
}

// 验证文件名是否与选择的类型匹配
function validateFileName(file, selectedType, compressionType) {
    const validExtensions = {
        'glb': /\.glb$/i,
        'gltf': /\.gltf$/i,
        'obj': /\.obj$/i,
        'fbx': /\.fbx$/i,
        'mtl': /\.mtl$/i,
        'tga': /\.tga$/i,
    };

    const validCompressedExtensions = {
        'zip': /\.(zip)$/i,
        'rar': /\.(rar)$/i,
    };

    const fileName = file.name;
    console.log('文件名:', fileName);
    if (compressionType === 'compress') {
        if (!validCompressedExtensions.zip.test(fileName) && !validCompressedExtensions.rar.test(fileName)) {
            return false;
        }
        return fileName.toLowerCase().includes(selectedType.toLowerCase());
    } else {
        const regex = validExtensions[selectedType];
        return regex.test(fileName);
    }
}

// 处理表单提交
function handleFormSubmit(event) {
    event.preventDefault();
    
    // 验证必填字段
    const requiredFields = ['modelName', 'modelDescription', 'tags', 'type'];
    let isValid = true;
    requiredFields.forEach(field => {
        if (!$(`#${field}`).val()) {
            $(`#${field}`).addClass('error-field');
            isValid = false;
        } else {
            $(`#${field}`).removeClass('error-field');
        }
    });
    
    if (!isValid) {
        alert('请填写所有必填字段（标红字段）');
        return;
    }

    // 验证文件类型
    const fileInput = document.querySelector('#file');
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const selectedType = $('#type').val();
        const compressionType = $('#tags').val();
        
        if (!validateFileName(file, selectedType, compressionType)) {
            alert('文件类型与选择的不匹配，请重新选择文件');
            return;
        }
    }

    // 准备表单数据
    const formData = new FormData(event.target);
    console.log('提交数据:', Object.fromEntries(formData.entries()));
    
    // 发送请求
    $.ajax({
        url: `http://127.0.0.1:8000/model_edit/${urlParams.model_id}/`,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            if (response?.message === '保存成功') {
                alert('模型信息已更新');
                window.location.href = 'http://127.0.0.1:8000/profile_works/';
            } else {
                alert(response?.message || '保存失败');
            }
        },
        error: function(xhr) {
            const errorMsg = xhr.responseJSON?.message || 
                           (xhr.status === 0 ? '网络连接错误' : `服务器错误: ${xhr.status}`);
            alert(`保存失败: ${errorMsg}`);
        }
    });
}

// 初始化页面
$(document).ready(function() {
    // 获取并显示数据
    fetchModelData();
    
    // 绑定表单提交
    $('#modelEditForm').on('submit', handleFormSubmit);
});