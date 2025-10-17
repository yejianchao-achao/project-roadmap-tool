"""
项目路由
定义项目相关的API端点
"""
from flask import Blueprint, request, jsonify
from services.project_service import ProjectService
from utils.decorators import handle_errors

# 创建蓝图
projects_bp = Blueprint('projects', __name__)

# 创建服务实例
service = ProjectService()


@projects_bp.route('/api/projects', methods=['GET'])
@handle_errors
def get_projects():
    """
    获取所有项目
    
    Returns:
        JSON响应，包含项目列表
    """
    projects = service.get_all()
    return jsonify({
        'success': True,
        'data': {
            'projects': projects
        }
    })


@projects_bp.route('/api/projects/<project_id>', methods=['GET'])
@handle_errors
def get_project(project_id):
    """
    根据ID获取项目
    
    Args:
        project_id: 项目ID
        
    Returns:
        JSON响应，包含项目数据
    """
    project = service.get_by_id(project_id)
    
    if project is None:
        return jsonify({
            'success': False,
            'error': f'项目不存在: {project_id}'
        }), 404
    
    return jsonify({
        'success': True,
        'data': project
    })


@projects_bp.route('/api/projects', methods=['POST'])
@handle_errors
def create_project():
    """
    创建新项目
    
    Request Body:
        {
            "name": "项目名称",
            "productLineId": "产品线ID",
            "ownerId": "负责人ID",
            "startDate": "2025-01-01",
            "endDate": "2025-12-31",
            "status": "开发"
        }
    
    Returns:
        JSON响应，包含创建的项目数据
    """
    data = request.get_json()
    
    # 验证必需字段
    required_fields = ['name', 'productLineId', 'ownerId', 'startDate', 'endDate', 'status']
    for field in required_fields:
        if not data or field not in data:
            return jsonify({
                'success': False,
                'error': f'缺少必需字段: {field}'
            }), 400
    
    project = service.create(
        name=data['name'],
        productLineId=data['productLineId'],
        ownerId=data['ownerId'],
        startDate=data['startDate'],
        endDate=data['endDate'],
        status=data['status']
    )
    
    return jsonify({
        'success': True,
        'data': project
    }), 201


@projects_bp.route('/api/projects/<project_id>', methods=['PUT'])
@handle_errors
def update_project(project_id):
    """
    更新项目
    
    Args:
        project_id: 项目ID
        
    Request Body:
        {
            "name": "新项目名称",
            "productLineId": "新产品线ID",
            "ownerId": "负责人ID",
            "startDate": "2025-01-01",
            "endDate": "2025-12-31",
            "status": "测试"
        }
    
    Returns:
        JSON响应，包含更新后的项目数据
    """
    data = request.get_json()
    
    if not data:
        return jsonify({
            'success': False,
            'error': '请求体不能为空'
        }), 400
    
    # 只更新提供的字段
    update_fields = {}
    allowed_fields = ['name', 'productLineId', 'ownerId', 'startDate', 'endDate', 'status']
    
    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]
    
    if not update_fields:
        return jsonify({
            'success': False,
            'error': '没有提供要更新的字段'
        }), 400
    
    project = service.update(project_id, **update_fields)
    
    if project is None:
        return jsonify({
            'success': False,
            'error': f'项目不存在: {project_id}'
        }), 404
    
    return jsonify({
        'success': True,
        'data': project
    })


@projects_bp.route('/api/projects/<project_id>', methods=['DELETE'])
@handle_errors
def delete_project(project_id):
    """
    删除项目
    
    Args:
        project_id: 项目ID
        
    Returns:
        JSON响应，表示删除是否成功
    """
    success = service.delete(project_id)
    
    if not success:
        return jsonify({
            'success': False,
            'error': f'项目不存在: {project_id}'
        }), 404
    
    return jsonify({
        'success': True,
        'message': '项目删除成功'
    })
