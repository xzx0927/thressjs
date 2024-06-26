# Generated by Django 3.2.8 on 2024-03-07 08:59

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='user',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=40, null=True, verbose_name='用户名')),
                ('password', models.CharField(max_length=40, null=True, verbose_name='密码')),
            ],
            options={
                'verbose_name': '用户',
                'verbose_name_plural': '用户',
            },
        ),
        migrations.CreateModel(
            name='production',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=40, null=True, verbose_name='作品名称')),
                ('introduction', models.CharField(max_length=200, null=True, verbose_name='作品简介')),
                ('three_model', models.FileField(null=True, upload_to='models', verbose_name='上传模型')),
                ('user_name', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='threejs.user', verbose_name='作者名称')),
            ],
            options={
                'verbose_name': '模型',
                'verbose_name_plural': '模型',
            },
        ),
    ]
