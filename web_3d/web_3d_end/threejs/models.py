from django.db import models


# Create your models here.

class user(models.Model):
    name = models.CharField(max_length=40, null=True, verbose_name="用户名")
    password = models.CharField(max_length=40, null=True, verbose_name="密码")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "用户"
        verbose_name_plural = "用户"


class production(models.Model):
    user_name = models.ForeignKey(user, on_delete=models.CASCADE, verbose_name="作者名称")
    name = models.CharField(max_length=40, null=True, verbose_name="作品名称")
    introduction = models.CharField(max_length=200, null=True, verbose_name="作品简介")
    three_model = models.FileField(upload_to='models', null=True, verbose_name="上传模型")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "模型"
        verbose_name_plural = "模型"
