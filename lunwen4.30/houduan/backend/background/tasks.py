from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution
from django_apscheduler import util
from background.models import UserSignin

def reset_signin_status():
    """每天00:00重置所有用户的签到状态为未签到"""
    UserSignin.objects.all().update(state='未签到')

@util.close_old_connections
def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_jobstore(DjangoJobStore(), "default")
    
    # 添加每天00:00执行的任务
    scheduler.add_job(
        reset_signin_status,
        trigger='cron',
        hour=0,
        minute=0,
        id='reset_signin_status',
        replace_existing=True,
    )
    
    try:
        scheduler.start()
    except KeyboardInterrupt:
        scheduler.shutdown()


