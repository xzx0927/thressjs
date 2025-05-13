import $ from 'jquery';

// 验证表单输入的有效性
function validateForm(form) {
    const errorDiv = form.querySelector('.error');
    errorDiv.textContent = '';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const requiredFields = form.id === 'registerForm' ? ['username', 'password', 'email', 'phone'] : ['username', 'password'];

    let isValid = true;

    requiredFields.forEach(field => {
        if (!data[field]) {
            errorDiv.textContent += `${field}不能为空。\n`;
            isValid = false;
        }
    });

    if (form.id === 'registerForm') {
        if (!validateEmail(data.email)) {
            errorDiv.textContent += '请输入有效的邮箱地址。\n';
            isValid = false;
        }

        if (!validatePhone(data.phone)) {
            errorDiv.textContent += '请输入有效的手机号。\n';
            isValid = false;
        }
    }

    return isValid;
}

// 为表单添加提交事件监听器
function addFormSubmitListener(form, formType) {
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        if (validateForm(this)) {
            const data = Object.fromEntries(new FormData(this).entries());
            console.log(`Submitting ${formType} form with data:`, data);
            console.log(`Form type: ${formType}`);

            $.ajax({
                url: `http://127.0.0.1:8000/${formType}/`,
                type: 'POST', // POST请求后端正确
                data: data,
                success: function(response) {
                    console.log('API response:', response);
                    // console.log(response['token']);
                    if (['登录成功', '注册成功'].includes(response['message'])) {
                        alert(`${response['message']}！`);
                        localStorage.setItem('loginSuccessMessage', response['message']);
                        localStorage.setItem('admin_id', response['admin_id']);
                        localStorage.setItem('user_serial', response['user_serial']);
                        document.cookie = `sessionid=${response['sessionid']}; path=/; max-age=3600`; // 设置sessionid到cookie中，有效期为1小时
                        window.location.href = 'http://127.0.0.1:8000/index/';
                        return;
                    }
                    document.getElementById(`${formType}Error`).textContent = response['message'];
                },
                error: function(xhr, status, error) {
                    console.error(error);
                    document.getElementById(`${formType}Error`).textContent = `${formType === 'login' ? '登录' : '注册'}失败，请重试。`;
                }
            });
        }
    });
}

addFormSubmitListener(document.getElementById('loginForm'), 'login');
addFormSubmitListener(document.getElementById('registerForm'), 'register');

// 验证邮箱地址格式
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 验证手机号格式
function validatePhone(phone) {
    return /^\d{11}$/.test(phone);
}
