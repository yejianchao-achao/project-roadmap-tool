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
