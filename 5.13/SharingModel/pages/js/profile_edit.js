import $ from 'jquery';

document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.querySelector('button[type="submit"]');
    
    saveButton.addEventListener('click', function(event) {
        event.preventDefault();

        const data = {
            user_serial: document.getElementById('user_serial').textContent.trim(),
            username: document.getElementById('username').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            password: document.getElementById('password').value.trim() || ''
        };

        console.log('保存数据:', data);

        $.ajax({
            url: 'http://127.0.0.1:8000/profile_edit/',
            type: 'POST',
            data: data,
            success: function(response) {
                const { message, status } = response;
                console.log('保存结果:', message, status);
                if (message === '保存成功') {
                    handleSaveSuccess(status);
                } else {
                    handleSaveError('保存失败，请重试。');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX 请求失败:', error);
                handleSaveError('请求出错，请稍后再试。');
            }
        });
    });

    function handleSaveSuccess(userStatus) {
        if (userStatus === '1') {
            alert('用户名未修改');
            window.location.href = 'http://127.0.0.1:8000/profile/';
        } else if (userStatus === '2') {
            alert('用户名修改成功请重新登录');
            clearLocalStorage();
            window.location.href = 'http://127.0.0.1:8000/login_url/';
        } else {
            handleSaveError('未知的状态码，请重试。');
        }
    }

    function clearLocalStorage() {
        localStorage.clear();  // 清除所有的localStorage存储数据
        // 或者你可以选择清除特定的项
        // localStorage.removeItem('specificItemKey');
    }

    function handleSaveError(errorMessage) {
        alert(errorMessage); // 提示错误信息
       
    }
});
