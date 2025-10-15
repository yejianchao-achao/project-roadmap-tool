"""
设置相关的API路由
"""
from flask import Blueprint, jsonify, request
from services.settings_service import SettingsService
from utils.decorators import handle_errors

bp = Blueprint('settings', __name__, url_prefix='/api/settings')
settings_service = SettingsService()


@bp.route('', methods=['GET'])
@handle_errors
def get_settings():
    """
    获取用户设置
    
    Returns:
        JSON响应，包含设置数据
        
    Example:
        GET /api/settings
        Response: {
            "success": true,
            "data": {
                "visibleProductLines": ["id1", "id2"]
            }
        }
    """
    settings = settings_service.get_settings()
    return jsonify({
        'success': True,
        'data': settings
    })


@bp.route('/visible-productlines', methods=['PUT'])
@handle_errors
def update_visible_productlines():
    """
    更新可见产品线配置
    
    Request Body:
        {
            "productLineIds": ["id1", "id2", ...]
        }
    
    Returns:
        JSON响应，包含更新后的设置数据
        
    Example:
        PUT /api/settings/visible-productlines
        Body: {"productLineIds": ["id1", "id2"]}
        Response: {
            "success": true,
            "data": {
                "visibleProductLines": ["id1", "id2"]
            },
            "message": "设置已保存"
        }
    """
    data = request.get_json()
    productline_ids = data.get('productLineIds', [])
    
    # 参数验证
    if not isinstance(productline_ids, list):
        return jsonify({
            'success': False,
            'error': 'productLineIds必须是数组类型'
        }), 400
    
    # 更新设置
    settings = settings_service.update_visible_productlines(productline_ids)
    
    return jsonify({
        'success': True,
        'data': settings,
        'message': '设置已保存'
    })


@bp.route('/reset', methods=['POST'])
@handle_errors
def reset_settings():
    """
    重置设置为默认值
    
    Returns:
        JSON响应，包含默认设置数据
        
    Example:
        POST /api/settings/reset
        Response: {
            "success": true,
            "data": {
                "visibleProductLines": []
            },
            "message": "设置已重置"
        }
    """
    settings = settings_service.reset_settings()
    return jsonify({
        'success': True,
        'data': settings,
        'message': '设置已重置'
    })
