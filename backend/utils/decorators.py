"""
装饰器工具模块
提供通用的装饰器函数
"""
from flask import jsonify
from functools import wraps


def handle_errors(f):
    """
    错误处理装饰器
    统一处理API异常并返回标准格式的错误响应
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except FileNotFoundError as e:
            return jsonify({
                'success': False,
                'error': f'数据文件不存在: {str(e)}'
            }), 404
        except ValueError as e:
            return jsonify({
                'success': False,
                'error': f'数据验证失败: {str(e)}'
            }), 400
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'服务器错误: {str(e)}'
            }), 500
    return decorated_function
