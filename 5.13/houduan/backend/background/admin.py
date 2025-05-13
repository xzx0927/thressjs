import os
import shutil
import re
from django.contrib import admin
from django.contrib import messages
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.html import format_html
from django.db.models.query import QuerySet
from backend import settings
from background.imageupload import upload_model_image
from background.IntegralModification import increase_user_integral
from background.models import User, Model, ModelImage, SignIn, UserSignin, ModelStyle

admin.site.site_header = '后台管理'  # 顶部标题
admin.site.site_title = '后台管理'  # 左侧标题
admin.site.index_title = '欢迎使用后台管理系统'  # 首页标题




@admin.register(User)
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


class ModelImageInline(admin.TabularInline):
    """模型图片内联管理，包含删除图片文件和保存验证功能"""
    model = ModelImage
    extra = 0
    fields = ('image_preview', 'image_path')
    readonly_fields = ('image_preview', 'image_path')#禁止修改
    
    def image_preview(self, obj):
        """图片预览"""
        from django.utils.html import format_html
        if obj.image_path:
            return format_html(
                '<a href="{0}" target="_blank"><img src="{0}" style="max-height: 100px; max-width: 100px;" /></a>',
                obj.image_path.url
            )
        return "无图片"
    image_preview.short_description = '图片预览'


    # def get_readonly_fields(self, request, obj=None):
    #     """
    #     禁止编制image_previews,和image_path
    #     """
    #     if obj:
    #         return self.readonly_fields + ('image_preview', 'image_path',)
    #     return self.readonly_fields
    #
    # def has_add_permission(self, request, obj=None):
    #     """
    #     允许添加权限
    #     """
    #     return True




@admin.register(Model)
class ModelAdmin(admin.ModelAdmin):
    """
    3D模型管理后台配置
    功能：
    - 模型列表展示与搜索
    - 模型状态审核
    - 模型在线预览
    - 模型积分管理
    - 不允许在后台修改模型文件只可以删除或者让其作者修改
    """
    # 模型状态转换映射: 审核中->审核通过->审核不通过 循环切换
    model_state = {'审核中': '审核通过', '审核通过': '审核不通过', '审核不通过': '审核中'}
    
    # 设置model_path、user_serial和model_type为只读字段
    readonly_fields = ('model_path', 'user_serial', 'model_type')

    def _delete_image_folder(self, request, image_path):
        """从图片路径提取serial并删除对应文件夹"""
        import shutil
        import re
        from django.contrib import messages
        
        # 从图片路径中提取8位字符的serial
        match = re.search(r'image[\\/]([a-f0-9]{8})[\\/]', str(image_path))
        if not match:
            messages.warning(request, f'无法从路径中提取serial: {image_path}')
            return False
            
        folder_name = match.group(1)
        image_dir = os.path.join(settings.MEDIA_ROOT, 'image', folder_name)# 图片文件夹路径（其实可以直接提取字段去除最后/后的内容效果相同）
        print(f"尝试删除图片文件夹: {image_dir}")
        
        if os.path.exists(image_dir):
            try:
                shutil.rmtree(image_dir)
                messages.success(request, f'已删除图片文件夹: {image_dir}')
                return True
            except Exception as e:
                messages.warning(request, f'删除图片文件夹失败: {str(e)}')
                return False
        else:
            messages.warning(request, f'图片文件夹不存在: {image_dir}')
            return False

    def save_formset(self, request, form, formset, change):
        """重写表单集保存方法处理图片上传"""
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, ModelImage) and hasattr(instance, 'image_path') and instance.image_path:
                from background.imageupload import upload_model_image
                try:
                    # 调用自定义上传方法
                    uploaded_path = upload_model_image(request, instance.image_path, instance.model_serial.model_serial)
                    # 更新图片路径
                    instance.image_path = uploaded_path
                    instance.save()
                except Exception as e:
                    from django.contrib import messages
                    messages.error(request, f'图片上传失败: {str(e)}')
        formset.save_m2m()

    def delete_model(self, request, obj):
        """删除模型同时删除关联图片和文件"""
        import shutil
        from django.contrib import messages
        
        # 调试信息：打印MEDIA_ROOT和图片路径
        print(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
        
        # 删除关联的图片文件
        for image in obj.images.all():
            if image.image_path:
                try:
                    file_path = os.path.join(settings.MEDIA_ROOT, str(image.image_path))
                    print(f"尝试删除图片文件: {file_path}")
                    
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        messages.success(request, f'已删除图片文件: {file_path}')
                except Exception as e:
                    messages.warning(request, f'删除图片文件失败: {str(e)}')
        print(f"删除图片文件夹: {obj.model_serial}")
        # 删除图片文件夹 - 使用第一个图片路径
        if obj.images.exists():
            self._delete_image_folder(request, obj.images.first().image_path)
        else:
            messages.warning(request, '没有找到关联的图片路径')
        
        # 删除模型文件
        if obj.model_path:
            try:
                file_path = os.path.join(settings.MEDIA_ROOT, str(obj.model_path))
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                from django.contrib import messages
                messages.warning(request, f'删除模型文件失败: {str(e)}')
        
        super().delete_model(request, obj)

    def delete_queryset(self, request, queryset):
        """批量删除模型同时删除关联图片和文件"""
        from django.contrib import messages
        
        for obj in queryset:
            print(f"处理模型删除: {obj.model_serial}")
            
            # 删除关联的图片文件
            for image in obj.images.all():
                if image.image_path:
                    try:
                        file_path = os.path.join(settings.MEDIA_ROOT, str(image.image_path))
                        print(f"尝试删除图片文件: {file_path}")
                        
                        if os.path.exists(file_path):
                            os.remove(file_path)
                            messages.success(request, f'已删除图片文件: {file_path}')
                    except Exception as e:
                        messages.warning(request, f'删除图片文件失败: {str(e)}')
            
            # 删除图片文件夹 - 使用第一个图片路径
            if obj.images.exists():
                self._delete_image_folder(request, obj.images.first().image_path)
            else:
                messages.warning(request, '没有找到关联的图片路径')
            
            # 删除模型文件
            if obj.model_path:
                try:
                    file_path = os.path.join(settings.MEDIA_ROOT, str(obj.model_path))
                    print(f"尝试删除模型文件: {file_path}")
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        messages.success(request, f'已删除模型文件: {file_path}')
                except Exception as e:
                    messages.warning(request, f'删除模型文件失败: {str(e)}')
        
        super().delete_queryset(request, queryset)

    # 列表页配置
    list_display = ('model_serial', 'user_serial', 'name', 'create_time', 'update_time',
                    'model_type', 'model_state', 'model_path', 'model_desc', 'model_integral', 'get_model_styles')  # 添加 get_model_styles
    search_fields = ('name', 'model_type')  # 可搜索的字段
    ordering = ('model_serial',)  # 默认排序字段
    actions = ('modification','get_model_serial', 'modify_integral', 'reward_user_integral')  # 添加积分修改操作
    actions_on_top = True  # 在顶部显示操作栏
    actions_on_bottom = True  # 在底部显示操作栏
    list_per_page = 10  # 每页显示条目数
    inlines = [ModelImageInline]
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



@admin.register(ModelStyle)
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

@admin.register(SignIn)
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

@admin.register(UserSignin)
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


