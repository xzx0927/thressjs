import $ from 'jquery';

// 重定向到登录页面
function redirectToLogin(message) {
    alert(message || '请先登录！');
    window.location.href = 'http://127.0.0.1:8000/login_url/';
}

// 新增函数：返回首页并自动刷新
function goToHomePage() {
    // 设置刷新标志
    sessionStorage.setItem('shouldRefresh', 'true');
    // 替换当前历史记录以禁止回退
    history.replaceState(null, '', '../index.html');
    // 跳转到首页
    window.location.href = '../index.html';
}

// 将函数暴露给全局作用域
window.goToHomePage = goToHomePage;

// 根据管理员ID获取个人信息数据
function fetchProfileData(userSerial) {
    if (!userSerial) {
        redirectToLogin();
        return;
    }

    $.ajax({
        url: 'http://127.0.0.1:8000/profile_gain/',
        type: 'GET',
        data: { 
            user_serial: userSerial
         },
        headers: {
            'sessionid': "<sessionid>"// 使用本地存储的token
        },
        success: function(data) {
            populateProfileData(data);
            populateProfileForm(data);
        },
        error: function(xhr, status, error) {
            console.error('AJAX请求失败:', error);
            redirectToLogin('无法获取个人信息，请稍后重试。');
        }
    });
}

// 将个人信息数据填充到页面显示区域
function populateProfileData(data) {
    const userInfo = data.user || {};
    const labels = ['用户编号', '电子邮件', '电话', '用户名', '积分', '状态'];
    const values = [
        userInfo.user_serial || '未提供',
        userInfo.email || '未提供',
        userInfo.phone || '未提供',
        userInfo.username || '未提供',
        typeof userInfo.integral === 'number' ? userInfo.integral.toLocaleString() : '未提供',
        userInfo.status || '未提供'
    ];

    document.querySelectorAll('.profile-detail').forEach((detail, index) => {
        detail.textContent = `${labels[index]}: ${values[index]}`;
    });
}

// 将个人信息数据填充到表单编辑区域
function populateProfileForm(data) {
    const userInfo = data.user || {};
    $('#user_serial').text(userInfo.user_serial || '').attr('disabled', true); // 使用 text 而不是 val 填充 span，并禁用
    $('#email').val(userInfo.email || '');
    $('#phone').val(userInfo.phone || '');
    $('#username').val(userInfo.username || '');
    $('#integral').text(userInfo.integral ? userInfo.integral.toLocaleString() : '未提供');
    $('#status').text(userInfo.status || '未提供');
    $('#password').val(''); // 清空密码输入框
}

// 处理编辑按钮点击事件，切换显示编辑表单
function handleEditButtonClick() {
    $('.profile-body').hide();
    $('.profile-form').addClass('show');
    $('.edit-button button, .works-button button').hide();
    $('#password').closest('div').show(); // 显示密码输入字段
}

// 处理个人作品按钮点击事件
function handleWorksButtonClick() {
    console.log('个人作品按钮点击事件');
    window.location.href = 'http://127.0.0.1:8000/profile_works/';
}

// 在文档加载完成后执行初始化操作
document.addEventListener('DOMContentLoaded', function() {
    const userSerial = localStorage.getItem('user_serial'); // 添加获取 user_serial 的逻辑
    fetchProfileData(userSerial); // 调用获取个人信息数据的函数
    $('.edit-button button').on('click', handleEditButtonClick);
    $('.works-button button').on('click', handleWorksButtonClick); // 添加个人作品按钮的点击事件监听
});
