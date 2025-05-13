from django.apps import AppConfig


class BackgroundConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'background'

    def ready(self):
        import os
        # 只在主线程且非测试环境时启动定时任务
        if os.environ.get('RUN_MAIN') == 'true' and not os.environ.get('TESTING'):
            from background.tasks import start_scheduler
            start_scheduler()
    verbose_name = '后台管理'

