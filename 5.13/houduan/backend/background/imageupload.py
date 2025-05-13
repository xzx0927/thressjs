import os
from django.core.files.storage import FileSystemStorage
from django.core.files.base import ContentFile
from backend import settings
from background.models import Model, ModelImage

def upload_model_image(request, uploaded_file, model_id):
    """
    上传图片到指定模型的image目录
    参数：
    - request: 请求对象
    - uploaded_file: 上传的图片文件对象(FieldFile)
    - model_id: 模型ID
    返回：
    - 完整的图片URL
    """
    try:
        # 获取模型对象
        model = Model.objects.get(model_serial=model_id)
        # print(model.model_path)
        # 使用正则表达式从路径中提取文件名（不含扩展名）
        import re
        # 获取模型路径的相对路径(相对于MEDIA_ROOT)
        model_path = model.model_path.name
        # 匹配路径中最后一个反斜杠或斜杠后的文件名（不含扩展名）
        match = re.search(r'[\\/]([^\\/]+?)(?:\.[^.]*)?$', model_path)
        # print(f"匹配到的文件名: {match}")
        if not match:
            raise ValueError("无法从路径中提取文件名")
        dir_name = match.group(1)
        # print(f"提取的文件名: {dir_name}")
        # 构建保存路径：media_root/image/目录名/
        save_path = os.path.join(settings.MEDIA_ROOT, 'image', dir_name)
        
        # 创建目录如果不存在
        os.makedirs(save_path, exist_ok=True)
        
        # 处理上传文件
        file_content = ContentFile(uploaded_file.read())
        # 确保获取的是文件名字符串
        filename = str(uploaded_file.name)
        file_ext = os.path.splitext(filename)[1]
        filename = f"{filename}{file_ext}"
        
        # 保存文件
        fs = FileSystemStorage(location=save_path)
        saved_name = fs.save(filename, file_content)
        
        # 返回相对路径
        return os.path.join('image', dir_name, saved_name)
        
    except Model.DoesNotExist:
        raise ValueError(f"Model with id {model_id} does not exist")
    except Exception as e:
        # 删除已上传文件如果发生异常
        if 'saved_name' in locals():
            fs.delete(saved_name)
        raise RuntimeError(f"File upload failed: {str(e)}")



