import hashlib
import os

from django.db import models

from django.core.validators import MinValueValidator, MaxValueValidator


ALLOWED_EXTENSIONS = {
    'obj': 'obj',
    'fbx': 'fbx',
    'gltf': 'gltf',
    'glb': 'glb',
    'mtl': 'mtl',
    'tga': 'tga',
}

STATUS_CHOICES = (
    ('正常','正常'),
    ('异常','异常'),
    ('封号','封号'),
)

MODEL_TYPE_CHOICES = tuple((ext, ext) for ext in ALLOWED_EXTENSIONS.keys())# 定义模型类型

MODEL_STATE_CHOICES = (
    ('审核中','审核中'),
    ('审核通过','审核通过'),
    ('审核不通过','审核不通过'),
)


SIGNIN_STATE_CHOICES = (
    ('未签到','未签到'),
    ('已签到','已签到'),
)


class User(models.Model):
    # 用户模型
    user_serial = models.AutoField(unique=True, verbose_name='用户编号', primary_key=True)  # 设置主键为用户编号
    username = models.CharField(max_length=40, unique=True, verbose_name='名字')
    password = models.CharField(max_length=64, verbose_name='密码')  # 增加密码字段长度
    email = models.EmailField(verbose_name='邮箱', blank=True, null=True)
    phone = models.CharField(max_length=11, verbose_name='手机号', blank=True, null=True)
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')  # 自动添加创建时间
    update_time = models.DateTimeField(auto_now=True, verbose_name='更新时间')  # 自动更新更新时间
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='正常', verbose_name='状态')
    integral = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100000000)], verbose_name='积分')

    def __str__(self):
        return str(self.user_serial)

    def set_password(self, raw_password):  # 设置密码加密
        self.password = self.custom_hash(raw_password)

    def check_password(self, raw_password):  # 验证密码是否正确
        return self.password == self.custom_hash(raw_password)

    def custom_hash(self, raw_password):
        # 直接对密码进行哈希
        sha256_hash = hashlib.sha256(raw_password.encode()).hexdigest()
        # 确保生成的哈希值长度为64位
        return sha256_hash[:64]

    def save(self, *args, **kwargs):# 保存密码加密
        if not self.pk or 'password' in kwargs.get('update_fields', []):
            self.set_password(self.password)
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "用户"
        verbose_name_plural = "用户"

class ModelStyle(models.Model):
    #模型风格模型
    style_serial = models.AutoField(unique=True, verbose_name='风格编号', primary_key=True)
    style_name = models.CharField(max_length=40, verbose_name='风格名称')
    style_dsc = models.CharField(max_length=100, verbose_name='风格描述', default='1')
    def __str__(self):
        return str(self.style_serial)
    class Meta:
        verbose_name = "模型风格"
        verbose_name_plural = "模型风格"

class Model(models.Model):
    # 模型模型
    model_serial = models.AutoField(unique=True, verbose_name='模型编号', primary_key=True)  # 设置主键为模型编号
    user_serial = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用户编号', related_name='models')
    name = models.CharField(max_length=40, verbose_name='名字')
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')  # 自动添加创建时间
    update_time = models.DateTimeField(auto_now=True, verbose_name='更新时间')  # 自动更新更新时间
    model_type = models.CharField(max_length=10, verbose_name='模型类型', choices=MODEL_TYPE_CHOICES, default='gltf')
    model_state = models.CharField(max_length=10, choices=MODEL_STATE_CHOICES, default='审核中', verbose_name='模型状态')
    model_path = models.FileField( verbose_name='模型路径',max_length=500)
    model_desc = models.CharField(max_length=40, null=True, blank=True, verbose_name='模型描述')
    model_integral = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100000000)], verbose_name='模型积分')
    style_serial = models.ManyToManyField(to=ModelStyle, verbose_name='模型风格', related_name='models')  # 添加多对多关系
    def __str__(self):
        return str(self.model_serial)

    class Meta:
        verbose_name = "模型"
        verbose_name_plural = "模型"

class ModelImage(models.Model):
    #模型简介图片模型
    model_serial = models.ForeignKey(Model, on_delete=models.CASCADE, verbose_name='模型编号', related_name='images')
    image_path = models.ImageField(verbose_name='图片路径')
    def __str__(self):
        return str(self.model_serial)
    class Meta:
        verbose_name = "模型图片"
        verbose_name_plural = "模型图片"

class SignIn(models.Model):
    # 签到模型
    integrationTask=models.AutoField(verbose_name='签到任务编号',primary_key=True)
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='任务创建时间')
    integral = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100000000)], verbose_name='签到积分')
    def __str__(self):
        return str(self.integrationTask)
    class Meta:
        verbose_name = "签到任务"
        verbose_name_plural = "签到任务"

class UserSignin(models.Model):
    # 用户签到模型
    user_serial = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用户编号',)
    signin_time = models.DateTimeField(auto_now_add=True, verbose_name='签到时间')  # 自动添加创建时间
    signin_integral = models.ForeignKey(SignIn, on_delete=models.CASCADE, verbose_name='签到任务')
    state=models.CharField(max_length=10,choices=SIGNIN_STATE_CHOICES, verbose_name='签到状态', default='未签到')
    def __str__(self):
        return str(self.user_serial)
    class Meta:
        verbose_name = "用户签到"
        verbose_name_plural = "用户签到"
