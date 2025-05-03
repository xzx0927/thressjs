from django.contrib import admin

from backend import settings
from background.imageupload import upload_model_image
from background.models import User, Model, ModelImage, SignIn, UserSignin,ModelStyle
from django.shortcuts import redirect
from django.urls import reverse

admin.site.site_header = '后台管理'  # 顶部标题
admin.site.site_title = '后台管理'  # 左侧标题
admin.site.index_title = '欢迎使用后台管理系统'  # 首页标题





class UserAdmin(admin.ModelAdmin):
    """
    用户模型管理后台配置
    功能：
    - 用户列表展示与搜索
    - 用户状态管理
    - 密码重置
    - 用户信息编辑
    """
    # 状态转换映射: 正常<->异常<->封号 循环切换
    user_state = {'正常': '异常', '异常': '封号', '封号': '正常'}

    # 列表配置
    list_display = ('user_serial', 'username', 'email', 'phone', 'status', 'create_time', 'update_time','integral', 'get_change_link')
    search_fields = ('user_serial', 'username', 'email', 'phone')
    list_filter = ('status', 'create_time')
    ordering = ('-create_time',)
    list_per_page = 10

    def get_change_link(self, obj):
        from django.urls import reverse
        from django.utils.html import format_html
        url = reverse('admin:background_user_change', args=[obj.pk])
        return format_html('<a href="{}">修改</a>', url)

    get_change_link.short_description = '操作'


    # 操作配置
    actions = ('modification', 'reset_password', 'modify_integral')
    actions_on_top = True
    actions_on_bottom = True

    def modification(self, request, queryset):
        """批量修改用户状态"""
        try:
            for obj in queryset:
                new_status = self.user_state.get(obj.status)  # 获取新状态
                if new_status is not None:
                    obj.status = new_status
                    obj.save()
                else:
                    raise ValueError(f'未知的状态值: {obj.status}')
            self.message_user(request, '修改成功')  # 移动到循环外部
        except ValueError as ve:
            self.message_user(request, f'修改失败: {ve}', level='ERROR')  # 更具体的错误信息
        except Exception as e:
            self.message_user(request, f'修改失败: {e}', level='ERROR')  # 添加错误处理机制

    modification.short_description = '修改状态'
    modification.type = 'danger'
    modification.style = 'btn-danger'  # 使用Bootstrap危险按钮样式

    def reset_password(self, request, queryset):
        """批量重置用户密码为123456"""
        success_count = 0
        for obj in queryset:
            try:
                obj.set_password('123456')
                obj.save()
                print(obj)
                success_count += 1
            except Exception as e:
                self.message_user(request, f'用户{obj.username}密码重置失败: {str(e)}', level='ERROR')

        if success_count > 0:
            self.message_user(request, f'成功重置{success_count}个用户的密码')

    reset_password.short_description = '重置密码'
    reset_password.type = 'success'
    reset_password.style = 'btn-success'  # 使用Bootstrap成功按钮样式

    def modify_integral(self, request, queryset):
        """批量修改用户积分"""
        if queryset.count() != 1:
            self.message_user(request, '请选择一个用户进行修改', level='ERROR')
            return

        from django.urls import reverse
        from django.shortcuts import redirect
        obj = queryset.first()
        url = reverse('admin:background_user_change', args=[obj.pk]) + '?integral_only=true'
        return redirect(url)

    modify_integral.short_description = '修改积分'
    modify_integral.type = 'primary'
    modify_integral.style = 'btn-primary'  # 使用Bootstrap主要按钮样式

    def get_fields(self, request, obj=None):
        """根据请求参数限制可编辑字段"""
        fields = super().get_fields(request, obj)
        if request.GET.get('integral_only') == 'true':
            return ['integral']  # 只返回积分字段
        return fields

    def save_model(self, request, obj, form, change):
        """保存模型时检查是否只允许修改积分"""
        if request.GET.get('integral_only') == 'true' and change:
            original = self.model.objects.get(pk=obj.pk)
            for field in obj._meta.fields:
                if field.name != 'integral' and getattr(obj, field.name) != getattr(original, field.name):
                    self.message_user(request, f'只能修改积分字段，{field.name}字段修改被忽略', level='WARNING')
                    setattr(obj, field.name, getattr(original, field.name))
        super().save_model(request, obj, form, change)

    def has_add_permission(self, request):
        return True  # 允许添加按钮

    def has_delete_permission(self, request, obj=None):
        return True  # 允许删除功能

    def has_change_permission(self, request, obj=None):
        return True  # 允许其他字段的修改



class ModelAdmin(admin.ModelAdmin):
    """
    3D模型管理后台配置
    功能：
    - 模型列表展示与搜索
    - 模型状态审核
    - 模型在线预览
    - 模型积分管理
    """
    # 模型状态转换映射: 审核中->审核通过->审核不通过 循环切换
    model_state = {'审核中': '审核通过', '审核通过': '审核不通过', '审核不通过': '审核中'}

    # 列表页配置
    list_display = ('model_serial', 'user_serial', 'name', 'create_time', 'update_time',
                    'model_type', 'model_state', 'model_path', 'model_desc', 'model_integral', 'get_model_styles')  # 添加 get_model_styles
    search_fields = ('name', 'model_type')  # 可搜索的字段
    ordering = ('model_serial',)  # 默认排序字段
    actions = ('modification','get_model_serial', 'modify_integral', 'reward_user_integral')  # 添加积分修改操作
    actions_on_top = True  # 在顶部显示操作栏
    actions_on_bottom = True  # 在底部显示操作栏
    list_per_page = 10  # 每页显示条目数

    def get_model_styles(self, obj):
        """获取关联的模型风格名称"""
        return ", ".join([style.style_name for style in obj.style_serial.all()])
    get_model_styles.short_description = '模型风格'

    def reward_user_integral(self, request, queryset):
        """批量奖励用户积分"""
        from background.IntegralModification import increase_user_integral
        success_count = 0
        failed_count = 0
        
        for model in queryset:
            try:
                if not model.user_serial:
                    self.message_user(request, f"模型{model.model_serial}没有关联用户，跳过", level='WARNING')
                    continue
                    
                integral = model.model_integral
                if integral <= 0:
                    self.message_user(request, f"模型{model.model_serial}的积分为{integral}，跳过", level='WARNING')
                    continue
                    
                user_serial = model.user_serial.user_serial  # 获取实际的user_serial数值
                result = increase_user_integral(user_serial, integral)
                if result['status'] == 'success':
                    success_count += 1
                else:
                    failed_count += 1
                    self.message_user(request, f"用户{user_serial}积分奖励失败: {result['message']}", level='ERROR')
            except Exception as e:
                failed_count += 1
                self.message_user(request, f"处理模型{model.model_serial}时出错: {str(e)}", level='ERROR')
        
        self.message_user(
            request,
            f"操作完成: 成功为{success_count}个用户奖励积分，失败{failed_count}个"
        )
    
    reward_user_integral.short_description = '奖励用户积分'
    reward_user_integral.type = 'success'
    reward_user_integral.style = 'color: white; background-color: #28a745;'

    def modification(self, request, queryset):
        """批量修改模型状态"""
        try:
            for obj in queryset:
                new_state = self.model_state.get(obj.model_state)
                if new_state is not None:
                    # 保存原始状态用于比较
                    original_state = obj.model_state
                    obj.model_state = new_state
                    obj.save()

                    # 如果状态从非"审核通过"变为"审核通过"，则调用积分修改方法
                    if new_state == '审核通过' and original_state != '审核通过':
                        try:
                            # 创建只包含当前对象的queryset
                            from django.db.models.query import QuerySet
                            single_obj_queryset = QuerySet(model=self.model)
                            single_obj_queryset = single_obj_queryset.filter(pk=obj.pk)

                            # 调用现有的modify_integral方法
                            return self.modify_integral(request, single_obj_queryset)
                        except Exception as e:
                            self.message_user(request, f'积分修改失败: {str(e)}', level='ERROR')
                            return None
                else:
                    raise ValueError(f'未知的状态值: {obj.model_state}')
            self.message_user(request, '状态修改完成')
        except ValueError as ve:
            self.message_user(request, f'修改失败: {ve}', level='ERROR')
        except Exception as e:
            self.message_user(request, f'修改失败: {e}', level='ERROR')

    modification.short_description = '修改状态'
    modification.type = 'danger'
    modification.style = 'color: white; background-color: #dc3545;'

    def modify_integral(self, request, queryset):
        """批量修改模型积分"""
        if queryset.count() != 1:
            self.message_user(request, '请选择一个模型进行修改', level='ERROR')
            return

        from django.urls import reverse
        from django.shortcuts import redirect
        obj = queryset.first()
        url = reverse('admin:background_model_change', args=[obj.pk]) + '?integral_only=true'
        return redirect(url)

    modify_integral.short_description = '修改积分'
    modify_integral.type = 'warning'
    modify_integral.style = 'color: white; background-color: #ffc107;'

    def get_fields(self, request, obj=None):
        """根据请求参数限制可编辑字段"""
        fields = super().get_fields(request, obj)
        if request.GET.get('integral_only') == 'true':
            return ['model_integral']  # 只返回模型积分字段
        return fields

    def save_model(self, request, obj, form, change):
        """保存模型时检查是否只允许修改积分"""
        if request.GET.get('integral_only') == 'true' and change:
            try:
                original = self.model.objects.get(pk=obj.pk)
                original_integral = original.model_integral
                for field in obj._meta.fields:
                    if field.name != 'model_integral' and getattr(obj, field.name) != getattr(original, field.name):
                        self.message_user(request, f'只能修改积分字段，{field.name}字段修改被忽略', level='WARNING')
                        setattr(obj, field.name, getattr(original, field.name))
                
                # 先保存修改
                super().save_model(request, obj, form, change)
                
                # 检查积分是否实际被修改
                if obj.model_integral != original_integral:
                    # 检查模型状态
                    if obj.model_state == '审核通过':
                        # 重新获取保存后的对象
                        updated_obj = self.model.objects.get(pk=obj.pk)
                        # 创建只包含当前对象的queryset
                        from django.db.models.query import QuerySet
                        single_obj_queryset = QuerySet(model=self.model)
                        single_obj_queryset = single_obj_queryset.filter(pk=updated_obj.pk)
                        
                        # 调用reward_user_integral方法
                        self.reward_user_integral(request, single_obj_queryset)
            except self.model.DoesNotExist:
                self.message_user(request, '未找到对应的模型对象', level='ERROR')
        else:
            super().save_model(request, obj, form, change)

    def get_model_serial(self, request, queryset):
        if queryset.count() != 1:
            self.message_user(request, '只能选择一条数据', level='ERROR')
        else:
            obj = queryset.first()
            self.message_user(request, f'模型编号: {obj.model_serial}')
            return redirect('http://localhost:5173/pages/html/model_show.html?model_id='+str(obj.model_serial))

    get_model_serial.short_description = '在线查看模型'
    get_model_serial.type = 'info'
    get_model_serial.style = 'btn-info'  # 使用Bootstrap信息按钮样式

    def has_add_permission(self, request):
        return True  # 不允许添加按钮

    def has_delete_permission(self, request, obj=None):
        return True  # 允许删除按钮

    def has_change_permission(self, request, obj=None):
        return True  # 允许修改按钮

#图片
class ModelImageAdmin(admin.ModelAdmin):
    """
    图片管理后台配置
    功能：
    - 图片列表展示与搜索
    - 图片预览
    - 使用imageupload.py方法上传文件
    """
    # 图片状态转换映射: 审核中->审核通过->审核不通过 循环切换
    image_state = {'审核中': '审核通过', '审核通过': '审核不通过', '审核不通过': '审核中'}

    # 列表页配置
    list_display = ('model_serial', 'image_preview', 'image_state')
    search_fields = ('model_serial',)
    ordering = ('model_serial',)
    actions = ('modification',)  # 添加修改状态操作
    list_per_page = 10

    def image_preview(self, obj):
        from django.utils.html import format_html
        if obj.image_path:
            return format_html(
                '<a href="{0}" target="_blank"><img src="{0}" style="max-height:100px;max-width:100px;" /></a>',
                obj.image_path.url
            )
        return "-"
    image_preview.short_description = '图片预览'
    image_preview.allow_tags = True

    def modification(self, request, queryset):
        """批量修改图片状态"""
        try:
            for obj in queryset:
                new_state = self.image_state.get(obj.image_state)  # 将 imagestate 替换为 image_state
                if new_state is not None:
                    obj.image_state = new_state  # 将 imagestate 替换为 image_state
                    obj.save()
                else:
                    raise ValueError(f'未知的状态值: {obj.image_state}')
            self.message_user(request, '状态修改完成')
        except ValueError as ve:
            self.message_user(request, f'修改失败: {ve}', level='ERROR')
        except Exception as e:
            self.message_user(request, f'修改失败: {e}', level='ERROR')

    modification.short_description = '修改状态'
    modification.type = 'danger'
    modification.style = 'color: white; background-color: #dc3545;'

    def save_model(self, request, obj, form, change):
        """
        重写保存方法，使用imageupload.py中的upload_model_image方法处理图片上传
        """
        if 'image_path' in form.changed_data:
            uploaded_file = request.FILES.get('image_path')
           
            if uploaded_file:
                try: 
                    # 验证model_serial是否有效
                    if not obj.model_serial:
                        from django.contrib import messages
                        messages.error(request, '请先选择关联的模型')
                        return
                    
                    # 延迟导入upload_model_image函数，避免在应用初始化时访问数据库
                    from background.imageupload import upload_model_image
                    
                    # 调用上传方法获取相对路径
                    relative_path = upload_model_image(request, uploaded_file, obj.model_serial.model_serial)
                    # 保存相对路径
                    obj.image_path = relative_path
                    # 如果对象是新创建的，设置默认状态
                    if not obj.pk:
                        obj.image_state = '审核中'
                        
                except Exception as e:
                    from django.contrib import messages
                    messages.error(request, f'图片上传失败: {str(e)}')
                    return
        
        super().save_model(request, obj, form, change)

    def has_add_permission(self, request):
        return True

    def has_delete_permission(self, request, obj=None):
        return True

    def has_change_permission(self, request, obj=None):
        return True

class ModelStyleAdmin(admin.ModelAdmin):
    """
    模型风格管理后台配置
    功能：
    - 模型风格列表展示
    - 创建时间排序
    """
    list_display = ('style_serial', 'style_name','style_dsc')  # 只显示 style_serial 和 style_name
    list_per_page = 10

    def has_add_permission(self, request):
        return True
    def has_delete_permission(self, request, obj=None):
        return True
    def has_change_permission(self, request, obj=None):
        return True

class SignInAdmin(admin.ModelAdmin):
    """
    签到任务管理后台配置
    功能：
    - 签到任务列表展示
    - 创建时间排序
    - 积分范围筛选
    """
    list_display = ('integrationTask', 'create_time', 'integral', 'get_use_button')  # 添加使用按钮
    list_filter = ('create_time', 'integral')
    ordering = ('-create_time',)
    list_per_page = 10

    def get_use_button(self, obj):
        """生成使用按钮"""
        from django.utils.html import format_html
        return format_html(
            '<a class="button" href="{}" style="color: white; background-color: #007bff; padding: 8px 16px; border-radius: 6px; text-decoration: none; border: none; cursor: pointer; transition: background-color 0.3s ease; font-family: Arial, sans-serif; font-size: 14px;">使用</a>',
            reverse('admin:use_signin_task', args=[obj.integrationTask])
        )

    get_use_button.short_description = '操作'  # 设置字段显示名称

    def get_urls(self):
        """添加自定义 URL"""
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('<int:integrationTask>/use/', self.admin_site.admin_view(self.use_signin_task), name='use_signin_task'),
        ]
        return custom_urls + urls

    def use_signin_task(self, request, integrationTask):
        """处理使用签到任务的逻辑"""
        try:
            # 获取当前签到任务
            signin_task = SignIn.objects.get(integrationTask=integrationTask)

            # 批量更新所有用户的签到积分为当前签到任务的积分
            UserSignin.objects.update(signin_integral=signin_task)

            self.message_user(request, '所有用户的签到任务已成功应用')
        except SignIn.DoesNotExist:
            self.message_user(request, '未找到对应的签到任务', level='ERROR')
        except Exception as e:
            self.message_user(request, f'应用签到任务失败: {str(e)}', level='ERROR')
        return redirect('admin:background_signin_changelist')

    def has_add_permission(self, request):
        return True  # 允许添加按钮

    def has_delete_permission(self, request, obj=None):
        return True  # 允许删除按钮

    def has_change_permission(self, request, obj=None):
        return True  # 允许修改按钮

class UserSigninAdmin(admin.ModelAdmin):
    list_display = ('user_serial', 'signin_time', 'get_signin_integral', 'state')  # 修改 list_display，移除签到任务字段，添加签到积分字段

    def get_signin_integral(self, obj):
        # 获取签到积分
        return obj.signin_integral.integral

    get_signin_integral.short_description = '签到积分'  # 设置字段显示名称

    def add_view(self, request, form_url='', extra_context=None):
        """重写添加视图，处理重复user_serial情况"""
        from django.http import HttpResponseRedirect
        from django.urls import reverse
        
        if request.method == 'POST':
            form = self.get_form(request)(request.POST, request.FILES)
            if form.is_valid():
                obj = form.save(commit=False)
                if self.model.objects.filter(user_serial=obj.user_serial).exists():
                    self.message_user(request, '已存在', level='ERROR')
                    return HttpResponseRedirect(reverse('admin:background_usersignin_changelist'))
        
        return super().add_view(request, form_url, extra_context)

    def save_model(self, request, obj, form, change):
        """保存模型时检查 user_serial 是否已存在"""
        if not change:  # 如果是新增记录
            if self.model.objects.filter(user_serial=obj.user_serial).exists():
                return
        super().save_model(request, obj, form, change)

    def reset_state(self, request, queryset):
        """批量重置签到状态为未签到"""
        try:
            queryset.update(state='未签到')
            self.message_user(request, f'成功重置 {queryset.count()} 条记录的签到状态为未签到')
        except Exception as e:
            self.message_user(request, f'重置失败: {str(e)}', level='ERROR')

    reset_state.short_description = '重置状态'
    reset_state.type = 'warning'
    reset_state.style = 'color: white; background-color: #ffc107;'

    actions = ('reset_state',)  # 添加重置状态操作

    def has_add_permission(self, request):
        return True  # 允许添加按钮

    def has_delete_permission(self, request, obj=None):
        return True  # 允许删除按钮

    def has_change_permission(self, request, obj=None):
        return True  # 允许修改按钮

admin.site.register(User, UserAdmin)  # 注册模型类

admin.site.register(Model, ModelAdmin)  # 注册模型类

admin.site.register(ModelStyle,ModelStyleAdmin)#注册模型类

admin.site.register(ModelImage,ModelImageAdmin)#注册图片类

admin.site.register(SignIn,SignInAdmin)#注册签到任务类

admin.site.register(UserSignin,UserSigninAdmin)#注册签到类

