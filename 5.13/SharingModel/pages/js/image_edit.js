import $ from 'jquery';

$(document).ready(function() {
    // 获取URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const modelId = urlParams.get('model_id');
    
    // 获取DOM元素
    const modelNameEl = document.getElementById('model-name');
    const imageListEl = document.getElementById('image-list');
    const modal = document.getElementById('edit-modal');
    const closeBtn = document.querySelector('.close');
    const editForm = document.getElementById('edit-form');
    
    // 获取图片数据
    $.ajax({
        url: 'http://127.0.0.1:8000/image_edit/' + modelId + '/',
        method: 'GET',
        success: function(response) {
            renderImageList(response.images, response.model_name);
        },
        error: function(error) {
            console.error('Error fetching images:', error);
        }
    });
    
    // 渲染图片列表
    function renderImageList(images, modelName) {
        modelNameEl.textContent = modelName + ' - 图片编辑';
        imageListEl.innerHTML = '';
        
        images.forEach(image => {
            const row = document.createElement('tr');
            
            // 预览列
            const previewCell = document.createElement('td');
            const previewImg = document.createElement('img');
            previewImg.src = image.thumbnail_url;
            previewImg.className = 'img-preview';
            previewCell.appendChild(previewImg);
            
            // 状态列
            const statusCell = document.createElement('td');
            statusCell.textContent = image.is_approved ? '已审核' : '待审核';
            
            // 操作列
            const actionCell = document.createElement('td');
            const editButton = document.createElement('button');
            editButton.textContent = '编辑';
            editButton.className = 'btn edit-btn';
            editButton.onclick = () => openEditModal(image);
            
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '删除';
            deleteButton.className = 'btn delete-btn';
            deleteButton.onclick = () => deleteImage(image.id);
            
            actionCell.appendChild(editButton);
            actionCell.appendChild(deleteButton);
            
            row.appendChild(previewCell);
            row.appendChild(statusCell);
            row.appendChild(actionCell);
            imageListEl.appendChild(row);
        });
    }
    
    // 打开编辑模态框
    function openEditModal(image) {
        document.getElementById('edit-image-id').value = image.id;
        modal.style.display = 'block';
    }
    
    // 关闭模态框
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }
    
    // 点击模态框外部关闭
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
    
    // 提交编辑表单
    editForm.onsubmit = function(e) {
        e.preventDefault();
        
        const formData = new FormData(editForm);
        const imageId = document.getElementById('edit-image-id').value;
        
        $.ajax({
            url: 'http://127.0.0.1:8000/image_edit/' + imageId + '/',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                alert('修改成功');
                modal.style.display = 'none';
                location.reload();
            },
            error: function(error) {
                console.error('Error updating image:', error);
                alert('修改失败');
            }
        });
    }
    
    // 删除图片
    function deleteImage(imageId) {
        if (confirm('确定要删除这张图片吗？')) {
            $.ajax({
                url: 'http://127.0.0.1:8000/image_edit/' + imageId + '/',
                method: 'DELETE',
                success: function(response) {
                    alert('删除成功');
                    location.reload();
                },
                error: function(error) {
                    console.error('Error deleting image:', error);
                    alert('删除失败');
                }
            });
        }
    }
});