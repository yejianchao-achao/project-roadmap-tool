"""
产品线路由
定义产品线相关的API端点
"""
from flask import Blueprint, request, jsonify
from services.productline_service import ProductLineService
from utils.decorators import handle_errors

# 创建蓝图
productlines_bp = Blueprint('productlines', __name__)

# 创建服务实例
service = ProductLineService()


@productlines_bp.route('/api/productlines', methods=['GET'])
@handle_errors
def get_productlines():
    """
    获取所有产品线
    
    Returns:
        JSON响应，包含产品线列表
    """
    productlines = service.get_all()
    return jsonify({
        'success': True,
        'data': {
            'productlines': productlines
        }
    })


@productlines_bp.route('/api/productlines', methods=['POST'])
@handle_errors
def create_productline():
    """
    创建新产品线
    
    Request Body:
        {
            "name": "产品线名称"
        }
    
    Returns:
        JSON响应，包含创建的产品线数据
    """
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({
            'success': False,
            'error': '缺少必需字段: name'
        }), 400
    
    productline = service.create(name=data['name'])
    
    return jsonify({
        'success': True,
        'data': productline
    }), 201


@productlines_bp.route('/api/productlines/<productline_id>', methods=['PUT'])
@handle_errors
def update_productline(productline_id):
    """
    更新产品线
    
    Args:
        productline_id: 产品线ID（路径参数）
        
    Request Body:
        {
            "name": "新产品线名称"
        }
    
    Returns:
        JSON响应，包含更新后的产品线数据
    """
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({
            'success': False,
            'error': '缺少必需字段: name'
        }), 400
    
    try:
        productline = service.update(productline_id, name=data['name'])
        return jsonify({
            'success': True,
            'data': productline
        })
    except ValueError as e:
        # 数据验证失败或产品线不存在
        error_msg = str(e)
        if '不存在' in error_msg:
            return jsonify({
                'success': False,
                'error': error_msg
            }), 404
        else:
            return jsonify({
                'success': False,
                'error': error_msg
            }), 400


@productlines_bp.route('/api/productlines/<productline_id>', methods=['DELETE'])
@handle_errors
def delete_productline(productline_id):
    """
    删除产品线
    
    Args:
        productline_id: 产品线ID（路径参数）
    
    Returns:
        JSON响应，包含删除结果
    """
    try:
        result = service.delete_with_check(productline_id)
        return jsonify(result)
    except ValueError as e:
        # 产品线不存在
        return jsonify({
            'success': False,
            'error': str(e)
        }), 404
    except PermissionError as e:
        # 有关联项目，无法删除
        error_msg = str(e)
        # 从错误消息中提取关联项目数量
        import re
        match = re.search(r'有(\d+)个关联项目', error_msg)
        related_count = int(match.group(1)) if match else 0
        
        return jsonify({
            'success': False,
            'error': error_msg,
            'relatedProjectsCount': related_count
        }), 403
