import os
import zipfile

from numbers import Integral

import rarfile
import uuid
from django.http import JsonResponse, HttpResponse
from django.shortcuts import redirect
from django.db.models import Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.decorators import authentication_classes, permission_classes

from backend.settings import MEDIA_ROOT
from background.imageupload import upload_model_image
from background.models import User, Model, UserSignin, SignIn, ModelImage
from werkzeug.utils import secure_filename
from background.IntegralModification import *
from rest_framework.permissions import IsAuthenticated, AllowAny



ALLOWED_EXTENSIONS = {'obj', 'fbx', 'gltf', 'glb', 'mtl', 'tga', 'rar', 'zip'}

def allowed_file(filename):
    """
    检查文件名是否允许的扩展名
    参数:filename: 文件名字符串
    """
    _, ext = os.path.splitext(filename)
    ext = ext[1:] if ext else ''
    return ext in ALLOWED_EXTENSIONS, ext

def save_file(file, upload_folder, model_type):
    """
    保存文件到指定目录，并返回保存后的文件路径
    
    参数:
    file: 要保存的文件对象
    upload_folder: 文件保存的根目录
    model_type: 文件的后缀名
    
    返回:
    保存后的文件路径
    
    异常:
    ValueError: 如果文件类型不被允许
    """
    secure_base_filename = secure_filename(file.name)
    file_name = f"{uuid.uuid4().hex[:8]}.{secure_base_filename.split('.')[-1]}"
    file.name = file_name.split('.')[0]
    is_allowed, ext = allowed_file(file_name)
    if not is_allowed:
        raise ValueError(f"文件类型 {ext} 不被允许")
    if ext in ['rar', 'zip']:
        extract_folder = os.path.join(upload_folder, model_type, file.name)
        try:
            os.makedirs(extract_folder, exist_ok=True)
            if ext == 'zip':
                with zipfile.ZipFile(file, 'r') as zip_ref:
                    zip_ref.extractall(extract_folder)
            elif ext == 'rar':
                with rarfile.RarFile(file, 'r') as rar_ref:
                    rar_ref.extractall(extract_folder)
        except Exception as e:
            print(f"解压文件时发生错误: {e}")
            raise ValueError("无法解压文件")
        for root, _, files in os.walk(extract_folder):
            for f in files:
                if f.endswith('.' + model_type):
                    new_filename = f"{uuid.uuid4().hex[:8]}.{model_type}"
                    new_file_path = os.path.join(root, new_filename)
                    os.rename(os.path.join(root, f), new_file_path)
                    return new_file_path
        raise ValueError(f"未找到后缀为 {model_type} 的文件")
    else:
        save_path = os.path.join(upload_folder, ext, file_name)
        try:
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
        except OSError as e:
            print(f"创建目录时发生错误: {e}")
            raise ValueError("无法创建文件保存目录")
        try:
            with open(save_path, 'wb') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
        except IOError as e:
            print(f"保存文件时发生错误: {e}")
            raise ValueError("无法保存文件")
        return save_path




def index(request):
    return redirect('http://localhost:5173/')

def login_url(request):
    return redirect('http://localhost:5173/pages/html/login.html')

class login(APIView):
    """
    登录接口
    输入: username, password
    输出: 登录成功返回用户信息，登录失败返回错误信息
    """
    def get(self, request):
        return JsonResponse({'message': '请使用POST方法'})

    def post(self, request):
        # 支持从request.data或request.POST获取数据
        data_source = request.data if hasattr(request, 'data') else request.POST
        username = data_source.get('username')
        password = data_source.get('password')
        
        if not username or not password:
            return JsonResponse({
                'code': 400,
                'message': '用户名和密码均为必填项',
                'detail': '请提供有效的username和password参数'
            }, status=400)
        try:
            # 使用用户名查找用户
            user = User.objects.filter(username=username).first()
            if user and user.check_password(password):  # 使用check_password方法验证密码

                print(request.session)
                return JsonResponse({
                    'message': '登录成功',
                    'admin_id': user.username,
                    'user_serial': user.user_serial,
                })
            else:
                return JsonResponse({
                    'code': 401,
                    'message': '认证失败',
                    'detail': '用户名或密码错误'
                }, status=401)
        except Exception as e:
            print(f"登录失败: {str(e)}")
            return JsonResponse({
                'code': 500,
                'message': '服务器错误',
                'detail': '请稍后再试'
            }, status=500)


class register(APIView):
    """
    注册接口
    输入: username, password, email, phone
    输出: 注册成功返回用户信息，注册失败返回错误信息
    """

    def post(self, request):
        username = request.POST.get('username')
        password = request.POST.get('password')
        email = request.POST.get('email')
        phone = request.POST.get('phone')
        print(username, password, email, phone)
        if not all([username, password, email, phone]):
            return JsonResponse({'message': '用户名、密码、邮箱和手机号均为必填项'}, status=400)
        if User.objects.filter(username=username).exists():
            return JsonResponse({'message': '用户名已存在'}, status=400)
        if User.objects.filter(email=email, phone=phone).exists():
            return JsonResponse({'message': '手机号和邮箱同时被另一账号使用，请更换手机号或邮箱'}, status=400)
        try:
            user = User.objects.create(username=username, email=email, phone=phone)  # 创建用户
            user.set_password(password)  # 使用 set_password 方法加密密码
            user.save()

            # 新增逻辑：自动创建 UserSignin 对象，默认 signin_integral 为 1
            from background.models import UserSignin, SignIn
            default_signin_task = SignIn.objects.filter(integrationTask=1).first()  # 获取签到任务编号为 1 的签到任务
            if not default_signin_task:
                default_signin_task = SignIn.objects.create(integrationTask=1, integral=1)  # 如果不存在，则创建
            UserSignin.objects.create(user_serial=user, signin_integral=default_signin_task, state='未签到')

            return JsonResponse({'message': '注册成功', 'admin_id': user.username, 'user_serial': user.user_serial})
        except Exception as e:
            print(f"注册失败: {e}")
            return JsonResponse({'message': '注册失败'}, status=500)

def profile(request):
    return redirect('http://localhost:5173/pages/html/profile.html')

class profile_gain(APIView):
    """
        获取个人信息和积分接口
        输入: user_serial
        输出: 获取成功返回用户信息和积分，获取失败返回错误信息
    """

    def get(self, request):
        admin_serial = request.GET.get('user_serial')
        if not admin_serial:
            return JsonResponse({'message': '参数错误'})
        try:
            user = User.objects.get(user_serial=admin_serial)

            return JsonResponse(
                {'message': '获取成功',
                 'user': {
                     'user_serial': user.user_serial,
                     'username': user.username,
                     'password': user.password,
                     'email': user.email,
                     'phone': user.phone,
                     'integral':user.integral,
                     'status':user.status}})
        except User.DoesNotExist:
            return JsonResponse({'message': '用户不存在'})
        except Exception as e:
            print(f"查询用户时发生错误: {e}")
            return JsonResponse({'message': '服务器错误'})

    def post(self, request):
        return JsonResponse({'message': '请使用GET方法'})

class profile_edit(APIView):
    """
        修改个人信息接口
        输入: user_serial, username, password, email, phone
        输出: 修改成功返回状态码，修改失败返回错误信息
    """

    def get(self, request):
        return JsonResponse({'message': '请使用POST方法'})

    def post(self, request):
        user_serial = request.POST.get('user_serial')
        admin_id = request.POST.get('username')
        password = request.POST.get('password')
        email = request.POST.get('email')
        phone = request.POST.get('phone')
        if not all([user_serial, admin_id, email, phone]):
            return JsonResponse({'message': '参数错误'})
        if User.objects.filter(username=admin_id).exclude(user_serial=user_serial).exists():
            return JsonResponse({'message': '用户名已存在'})
        try:
            user = User.objects.get(user_serial=user_serial)
            if user.username == admin_id:
                status = '1'
            else:
                status = '2'
            if password:
                user.password = password
            if user.username != admin_id:
                user.username = admin_id
            user.email = email
            user.phone = phone
            user.save()
            return JsonResponse({'message': '保存成功', 'status': status})
        except User.DoesNotExist:
            return JsonResponse({'message': '用户不存在'})
        except Exception as e:
            print(f"更新用户信息时发生错误: {e}")
            return JsonResponse({'message': '服务器错误'})

def profile_works(request):
    return redirect('http://localhost:5173/pages/html/profile_works.html')

class profile_production(APIView):
    """
        获取用户自己的模型数据
        输入: user_serial
        输出: 获取成功返回模型列表，获取失败返回错误信息
    """
    def get(self, request):
        user_serial = request.GET.get('user_serial')
        if not user_serial:
            return JsonResponse({'message': '参数错误'})
        try:
            models = Model.objects.filter(user_serial=user_serial).values(
                'model_serial', 'name', 'model_type', 'model_state', 'model_desc','model_integral'
            )
            return JsonResponse({'message': '获取成功', 'models': list(models)})
        except User.DoesNotExist:
            return JsonResponse({'message': '用户不存在'})
        except Exception as e:
            print(f"查询用户或模型时发生错误: {e}")
            return JsonResponse({'message': '服务器错误'})

    def post(self, request):
        return JsonResponse({'message': '请使用GET方法'})

def show(request):
    return redirect('http://localhost:5173/pages/html/show.html')

def model_show_url(request, model_id):
    models=Model.objects.get(model_serial=model_id)
    return redirect('http://localhost:5173/pages/html/model_show.html?model_id='+str(models.model_serial))

class model_show(APIView):
    """
        获取模型详情接口
        输入: model_id
        输出: 获取成功返回模型详情，获取失败返回错误信息
    """
    def get(self, request, model_id):
        try:
            model_instance = Model.objects.get(model_serial=model_id)
            return JsonResponse({
                'message': '获取成功',
                'model': {
                    'model_serial': model_instance.model_serial,
                    'name': model_instance.name,
                    'model_path': str(model_instance.model_path),
                    'model_type': model_instance.model_type,
                    'model_state': model_instance.model_state,
                }
            })
        except Model.DoesNotExist:
            return JsonResponse({'message': '模型不存在'})
        except Exception as e:
            print(f"获取模型时发生错误: {e}")
            return JsonResponse({'message': '服务器错误'})
    def post(self, request, model_id):
        return JsonResponse({'message': '请使用GET方法'})


def model_delete_url(request, model_id):
    """
    删除模型接口
    输入: model_id
    输出: 删除成功返回状态码，删除失败返回错误信息
    """
    try:
        model_instance = Model.objects.get(model_serial=model_id)
        # 获取模型文件路径
        model_path = str(model_instance.model_path)
        # 删除模型数据
        model_instance.delete()
        # 删除模型文件
        if os.path.exists(model_path):
            os.remove(model_path)
        return redirect('http://localhost:5173/pages/html/profile_works.html')
    except Model.DoesNotExist:
        return JsonResponse({'message': '模型不存在'}, status=404)
    except Exception as e:
        print(f"删除模型时发生错误: {e}")
        return JsonResponse({'message': '服务器错误'}, status=500)

def model_upload_url(request):
    return redirect('http://localhost:5173/pages/html/model_upload.html')

class model_upload(APIView):
    """
        上传模型接口
        输入: user_serial, name, type, description, file
        输出: 上传成功返回状态码，上传失败返回错误信息
        且自动创建积分表
    """
    def get(self, request):
        return JsonResponse({'message': '请使用POST方法'})

    def post(self, request):
        user_serial = request.POST.get('user_serial')
        name = request.POST.get('name')
        model_type = request.POST.get('type')
        model_desc = request.POST.get('description')
        model_file = request.FILES.get('file')
        print(user_serial, name, model_type, model_desc, model_file.name if model_file else None)
        if not all([user_serial, name, model_type, model_file]):
            return JsonResponse({'message': '参数错误'})
        try:
            upload_folder = MEDIA_ROOT
            print(upload_folder)
            if not os.path.exists(upload_folder):
                raise ValueError("上传文件夹路径不存在")
            save_path = save_file(model_file, upload_folder, model_type)
            if not os.path.isfile(save_path):
                raise ValueError(f"未找到后缀为 {model_type} 的文件")
            model_instance = Model.objects.create(
                user_serial_id=user_serial,
                name=name,
                model_type=model_type,
                model_desc=model_desc,
                model_path=save_path,
                model_state='审核中'
            )#创建模型实例
            return JsonResponse({'message': '上传成功', })
        except Model.DoesNotExist:
            return JsonResponse({'message': '用户不存在'})
        except ValueError as ve:
            return JsonResponse({'message': str(ve)})
        except Exception as e:
            print(f"创建模型时发生错误: {e}")
            return JsonResponse({'message': '服务器错误'})

def model_edit_url(request, model_id):
    models=Model.objects.get(model_serial=model_id)
    return redirect('http://localhost:5173/pages/html/model_edit.html?model_id='+str(models.model_serial))

class model_edit(APIView):
    """
        编辑模型接口
        输入: model_id, name, type, description, file
        输出: 编辑成功返回状态码，编辑失败返回错误信息
    """
    def get(self, request, model_id):
        try:
            model_instance = Model.objects.get(model_serial=model_id)
            return JsonResponse({
                'message': '获取成功',
                'model': {
                    'model_serial': model_instance.model_serial,
                    'name': model_instance.name,
                    'model_type': model_instance.model_type,
                    'model_desc': model_instance.model_desc,
                    'model_path': str(model_instance.model_path),
                }
            })
        except Model.DoesNotExist:
            return JsonResponse({'message': '模型不存在'}, status=404)
        except Exception as e:
            print(f"获取模型时发生错误: {e}")
            return JsonResponse({'message': '服务器错误'}, status=500)

    def post(self, request, model_id):
        name = request.POST.get('name')
        model_type = request.POST.get('type')
        model_desc = request.POST.get('description')
        model_file = request.FILES.get('file')
        print(name, model_type, model_desc, model_file.name if model_file else None)
        required_fields = [name, model_type, model_file]
        if not all(required_fields):
            missing_fields = [field for field in ['name', 'type', 'file'] if
                              not request.POST.get(field) and not request.FILES.get(field)]
            return JsonResponse({'message': f'缺少必填参数: {", ".join(missing_fields)}'}, status=400)
        try:
            model_instance = Model.objects.get(model_serial=model_id)
            upload_folder = MEDIA_ROOT
            if not os.path.exists(upload_folder):
                raise ValueError("上传文件夹路径不存在")
            save_path = save_file(model_file, upload_folder, model_type)
            if not os.path.isfile(save_path):
                raise ValueError(f"未找到后缀为 {model_type} 的文件")
            old_model_path = str(model_instance.model_path)
            if old_model_path and os.path.exists(old_model_path):
                os.remove(old_model_path)
            model_instance.name = name
            model_instance.model_type = model_type
            model_instance.model_desc = model_desc
            model_instance.model_path = save_path
            model_instance.model_state = '审核中'
            model_instance.save()
            return JsonResponse({'message': '保存成功'})
        except Model.DoesNotExist:
            return JsonResponse({'message': '模型不存在'})
        except ValueError as ve:
            return JsonResponse({'message': str(ve)})
        except Exception as e:
            print(f"更新模型时发生错误: {e}")
            return JsonResponse({'message': '服务器错误'})

def model_download(request, model_id, user_serial):
    """
    下载模型接口
    输入: model_id, user_serial
    输出: 下载成功返回模型文件，下载失败返回错误信息
    """
    try:
        model_instance = Model.objects.get(model_serial=model_id)
        integral = model_instance.model_integral
        model_user_serial = model_instance.user_serial
        model_path = str(model_instance.model_path)
        model_state = model_instance.model_state

        if not os.path.exists(model_path):
            raise ValueError("模型文件不存在")

        # 判断是否需要扣除积分
        if model_state == '审核通过' and str(user_serial) != str(model_user_serial):  # 修改：将 user_serial 和 model_user_serial 转换为字符串后再比较
            integral_result = decrease_user_integral(user_serial, integral)

            if integral_result['status'] == 'error':
                # 根据错误类型返回不同的响应
                if integral_result['message'] == '用户积分不足':
                    return JsonResponse({'message': 'less'})  # 用户积分不足时返回 less
                else:
                    return JsonResponse({'message': 'error'})  # 其他错误返回 error

            elif integral_result['status'] != 'success':
                return JsonResponse({'message': 'error'})  # 如果状态不是 success，返回 error

        with open(model_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/octet-stream')
            response['Content-Disposition'] = f'attachment; filename="{os.path.basename(model_path)}"'
            # 修改：在返回文件流之前，先返回成功状态和积分
            return  response
    except Model.DoesNotExist:
        return JsonResponse({'message': '模型不存在'})
    except ValueError as ve:
        return JsonResponse({'message': str(ve)})
    except Exception as e:
        print(f"下载模型时发生错误: {e}")
        return JsonResponse({'message': '服务器错误'})

def model_search_url(request, data):
    return redirect('http://localhost:5173/pages/html/model_search.html?'+data)

class model_search(APIView):
    def get(self, request):
        data = request.GET.get('data')
        if not data:
            return JsonResponse({'message': '参数错误'}, status=400)

        try:
            # 提取通用查询逻辑
            def search_models(query):
                return Model.objects.filter(
                    Q(name__icontains=query) |
                    Q(model_serial__icontains=query) |
                    Q(model_type__icontains=query) |
                    Q(model_desc__icontains=query),
                    model_state='审核通过'
                ).values(
                    'model_serial', 'name', 'model_desc', 'model_path', 'model_type', 'model_integral'
                )

            # 查询用户
            users = User.objects.filter(
                Q(username__icontains=data) | Q(user_serial__icontains=data)
            )
            if users.exists():
                user_serials = users.values_list('user_serial', flat=True)
                models = Model.objects.filter(
                    user_serial_id__in=user_serials, model_state='审核通过'
                ).values(
                    'model_serial', 'name', 'model_desc', 'model_path', 'model_type', 'model_integral'
                )
            else:
                models = search_models(data)

            # 获取所有模型的ID
            model_ids = [m['model_serial'] for m in models]
            
            # 批量查询所有审核通过的图片
            approved_images = ModelImage.objects.filter(
                model_serial__in=model_ids,
                image_state='审核通过'
            ).values('model_serial', 'image_path')
            
            # 按模型ID分组图片
            image_dict = {}
            for img in approved_images:
                model_id = img['model_serial']
                if model_id not in image_dict:
                    image_dict[model_id] = []
                image_dict[model_id].append({'image_path': img['image_path']})
            
            # 将图片数据合并到模型数据中
            models_with_images = []
            for model in models:
                model_id = model['model_serial']
                model_data = dict(model)
                model_data['images'] = image_dict.get(model_id, [])
                models_with_images.append(model_data)

            return JsonResponse({'message': '获取成功', 'models': models_with_images})
        except Exception as e:
            print(f"搜索模型时发生错误: {e}")
            return JsonResponse({'message': '服务器错误', 'error': str(e)}, status=500)

    def post(self, request, keyword):
        return JsonResponse({'message': '请使用GET方法'}, status=405)


def checkin_status(request):
    """
    检查签到状态
    """
    if request.method != 'GET':
        return JsonResponse({'message': '请使用GET方法'}, status=405)

    user_serial = request.GET.get('user_serial')
    if not user_serial:
        return JsonResponse({'message': '缺少参数 user_serial'}, status=400)

    try:
        usersignin = UserSignin.objects.get(user_serial=user_serial)
        print(usersignin.state)
        if usersignin.state == '已签到':
            return JsonResponse({'message': '已签到',})
        else:
            return JsonResponse({'message': '未签到',})

    except UserSignin.DoesNotExist:
        return JsonResponse({'message': '用户签到记录不存在'}, status=404)
    except Exception as e:
        print(f"获取签到状态时发生错误: {e}")
        return JsonResponse({'message': '服务器错误'}, status=500)

def signin(request):
    """
    签到处理
    """
    if request.method == 'GET':
        user_serial = request.GET.get('user_serial')
        if user_serial:
            try:
                usersignin = UserSignin.objects.get(user_serial=user_serial)
                signin_integral = usersignin.signin_integral  # 获取 SignIn 对象
                print(signin_integral, usersignin.state)
                if usersignin.state == '已签到':
                    integral = signin_integral.integral  # 直接访问积分字段
                    print(integral)
                    return JsonResponse({'message': '已签到', 'integral': integral})
                else:
                    usersignin.state = '已签到'
                    usersignin.signin_time = timezone.now()  # 修复：使用 Django 的 timezone.now()
                    usersignin.save()
                    # 将 SignIn 对象转换为字典，避免直接序列化
                    integral = signin_integral.integral  # 直接访问积分字段
                    print(integral)
                    increase_user_integral(user_serial, integral)  # 增加积分
                    return JsonResponse({'message': '签到成功', 'integral': integral})
            except User.DoesNotExist:
                return JsonResponse({'message': '用户不存在'}, status=404)
            except Exception as e:
                print(f"获取用户签到积分时发生错误: {e}")
    if request.method == 'POST':
        # 添加 POST 请求的响应逻辑
        return JsonResponse({'message': 'POST 方法暂不支持'}, status=405)

def upload_image_url(request,model_id):
    models = Model.objects.get(model_serial=model_id)
    return redirect('http://localhost:5173/pages/html/upload_image.html?model_id=' + str(models.model_serial))

class upload_image(APIView):
    def get(self, request,model_id):
        return JsonResponse({'message': '请使用POST方法'}, status=405)
    def post(self, request, model_id):
        print(f"开始处理上传请求，model_id: {model_id}")
        if not request.FILES.getlist('images'):
            print("错误：没有接收到任何文件")
            return JsonResponse({'error': '没有上传图片文件'}, status=400)
        
        results = []
        success_count = 0
        error_count = 0
        
        print(f"接收到 {len(request.FILES.getlist('images'))} 个文件")
        
        for image_file in request.FILES.getlist('images'):
            print(f"正在处理文件: {image_file.name} ({image_file.size} bytes)")
            try:
                # 验证文件类型和大小
                if not image_file.content_type.startswith('image/'):
                    raise ValueError('文件类型必须是图片')
                if image_file.size > 10 * 1024 * 1024:  # 10MB限制
                    raise ValueError('文件大小不能超过10MB')
                
                image_url = upload_model_image(request, image_file, model_id)
                print(f"文件保存成功，路径: {image_url}")
                
                # 获取Model实例
                model_instance = Model.objects.get(model_serial=model_id)
                
                # 创建数据库记录
                img_record = ModelImage.objects.create(
                    model_serial=model_instance,
                    image_path=image_url,
                    image_state='审核中',
                )
                print(f"数据库记录创建成功，ID: {img_record.id}")
                
                results.append({
                    'filename': image_file.name,
                    'status': 'success',
                    'url': image_url
                })
                success_count += 1
            except Exception as e:
                print(f"处理文件 {image_file.name} 时出错: {str(e)}")
                results.append({
                    'filename': image_file.name,
                    'status': 'error',
                    'message': str(e)
                })
                error_count += 1
        
        return JsonResponse({
            'results': results,
            'summary': {
                'total': len(request.FILES.getlist('images')),
                'success': success_count,
                'failed': error_count
            }
        }, status=200 if success_count > 0 else 400)