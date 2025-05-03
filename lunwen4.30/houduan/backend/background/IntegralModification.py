from background.models import User, Model
from django.core.exceptions import ValidationError

def validate_integral(integral):
    """
    验证积分值是否在有效范围内
    """
    if not isinstance(integral, int) or integral < 0 or integral > 100000000:
        raise ValidationError('积分值必须在0-100000000之间')

def modify_user_integral(user_serial, integral_change):
    """
    通用方法：修改用户积分（支持增加或减少）
    参数:
    - user_serial: 用户序列号
    - integral_change: 积分变化值（正数为增加，负数为减少）
    """
    try:
        # 参数验证
        validate_integral(abs(integral_change))  # 验证绝对值是否有效
        
        # 获取用户对象
        user = User.objects.get(user_serial=user_serial)
        
        # 检查积分是否足够（减少时）
        if integral_change < 0 and user.integral < abs(integral_change):
            return {'status': 'error', 'message': '用户积分不足'}
        
        # 修改积分
        old_integral = user.integral
        user.integral += integral_change
        user.full_clean()  # 验证模型字段
        user.save()
        
        return {
            'status': 'success', 
            'message': '积分修改成功',
            'old_integral': old_integral,
            'new_integral': user.integral
        }
    except User.DoesNotExist:
        return {'status': 'error', 'message': '用户不存在'}
    except ValidationError as ve:
        return {'status': 'error', 'message': str(ve)}
    except Exception as e:
        return {'status': 'error', 'message': f'系统错误：{str(e)}'}

# 修改 increase_user_integral 方法
def increase_user_integral(user_serial, integral):
    """
    增加用户积分
    """
    return modify_user_integral(user_serial, integral)

# 修改 decrease_user_integral 方法
def decrease_user_integral(user_serial, integral):
    """
    减少用户积分
    """
    return modify_user_integral(user_serial, -integral)
