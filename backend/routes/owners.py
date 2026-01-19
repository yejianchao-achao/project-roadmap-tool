"""
人员路由
处理人员相关的HTTP请求
"""
from flask import Blueprint, request, jsonify
from services import owner_service
from utils.decorators import handle_errors


# 创建蓝图
owners_bp = Blueprint('owners', __name__)


@owners_bp.route('/api/owners', methods=['GET'])
@handle_errors
def get_owners():
    """
    获取所有人员
    
    Returns:
        JSON: 人员列表，包含每个人员的关联项目数
    """
    owners = owner_service.get_all_owners()
    
    # 为每个人员添加关联项目数
    owners_with_count = []
    for owner in owners:
        owner_dict = owner.to_dict()
        owner_dict['projectCount'] = owner_service.get_owner_project_count(owner.id)
        owners_with_count.append(owner_dict)
    
    return jsonify({
        'owners': owners_with_count
    }), 200


@owners_bp.route('/api/owners', methods=['POST'])
@handle_errors
def create_owner():
    """
    创建新人员
    
    Request Body:
        {
            "name": "人员姓名"
        }
    
    Returns:
        JSON: 创建的人员对象
    """
    data = request.get_json()
    
    # 验证请求数据
    if not data or 'name' not in data:
        return jsonify({'error': '请提供人员姓名'}), 400
    
    name = data['name'].strip()
    if not name:
        return jsonify({'error': '人员姓名不能为空'}), 400
    
    try:
        # 创建人员
        owner = owner_service.create_owner(name)
        return jsonify(owner.to_dict()), 201
    except ValueError as e:
        # 姓名重复或验证失败
        return jsonify({'error': str(e)}), 409


@owners_bp.route('/api/owners/<owner_id>', methods=['DELETE'])
@handle_errors
def delete_owner(owner_id):
    """
    删除人员
    
    Args:
        owner_id: 人员ID
    
    Returns:
        JSON: 成功消息或错误信息
    """
    try:
        owner_service.delete_owner(owner_id)
        return jsonify({'message': '人员删除成功'}), 200
    except ValueError as e:
        # 人员不存在或有关联项目
        error_msg = str(e)
        
        # 提取项目数量（如果有）
        if '个关联项目' in error_msg:
            import re
            match = re.search(r'(\d+)\s*个关联项目', error_msg)
            if match:
                project_count = int(match.group(1))
                return jsonify({
                    'error': error_msg,
                    'projectCount': project_count
                }), 400
        
        return jsonify({'error': error_msg}), 400


@owners_bp.route('/api/owners/<owner_id>/projects/count', methods=['GET'])
@handle_errors
def get_owner_project_count(owner_id):
    """
    获取人员关联的项目数量
    
    Args:
        owner_id: 人员ID
    
    Returns:
        JSON: 项目数量
    """
    # 检查人员是否存在
    owner = owner_service.get_owner_by_id(owner_id)
    if not owner:
        return jsonify({'error': '人员不存在'}), 404
    
    # 获取项目数量
    project_count = owner_service.get_owner_project_count(owner_id)
    
    return jsonify({
        'ownerId': owner_id,
        'projectCount': project_count
    }), 200


@owners_bp.route('/api/owners/<owner_id>', methods=['PUT'])
@handle_errors
def update_owner(owner_id):
    """
    更新人员信息
    
    Args:
        owner_id: 人员ID
        
    Request Body:
        {
            "visible": boolean
        }
    
    Returns:
        JSON: 更新后的人员对象
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': '无效的请求数据'}), 400
        
    try:
        updated_owner = owner_service.update_owner(owner_id, data)
        return jsonify(updated_owner.to_dict()), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
