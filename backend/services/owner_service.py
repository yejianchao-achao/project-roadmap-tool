"""
人员服务层
处理人员相关的业务逻辑
"""
import os
from models.owner import Owner
from utils.file_handler import read_json_file, write_json_file


# 数据文件路径
OWNERS_FILE = 'data/owners.json'


def get_all_owners():
    """
    获取所有人员
    
    Returns:
        list: 人员对象列表
    """
    try:
        data = read_json_file(OWNERS_FILE)
        owners = [Owner.from_dict(owner_data) for owner_data in data.get('owners', [])]
        return owners
    except FileNotFoundError:
        # 文件不存在时返回空列表
        return []
    except Exception as e:
        raise Exception(f"获取人员列表失败: {str(e)}")


def get_owner_by_id(owner_id):
    """
    根据ID获取人员
    
    Args:
        owner_id: 人员ID
        
    Returns:
        Owner: 人员对象，不存在时返回None
    """
    owners = get_all_owners()
    for owner in owners:
        if owner.id == owner_id:
            return owner
    return None


def owner_exists(owner_id):
    """
    检查人员是否存在
    
    Args:
        owner_id: 人员ID
        
    Returns:
        bool: 存在返回True，否则返回False
    """
    return get_owner_by_id(owner_id) is not None


def create_owner(name):
    """
    创建新人员
    
    Args:
        name: 人员姓名
        
    Returns:
        Owner: 创建的人员对象
        
    Raises:
        ValueError: 姓名重复或验证失败
    """
    # 获取现有人员列表
    owners = get_all_owners()
    
    # 检查姓名是否重复
    for owner in owners:
        if owner.name == name:
            raise ValueError(f"人员姓名 '{name}' 已存在")
    
    # 分配颜色
    color = _assign_color(owners)
    
    # 创建人员对象
    new_owner = Owner(name=name, color=color)
    
    # 保存到文件
    owners.append(new_owner)
    _save_owners(owners)
    
    return new_owner


def create_default_owner():
    """
    创建默认人员（用于数据迁移）
    
    Returns:
        Owner: 默认人员对象
    """
    # 检查默认人员是否已存在
    default_owner = get_owner_by_id('owner-default')
    if default_owner:
        return default_owner
    
    # 创建默认人员
    default_owner = Owner(
        name='未分配',
        id='owner-default',
        color='#95A5A6'  # 灰色
    )
    
    # 保存到文件
    owners = get_all_owners()
    owners.insert(0, default_owner)  # 放在列表开头
    _save_owners(owners)
    
    return default_owner


def delete_owner(owner_id):
    """
    删除人员
    
    Args:
        owner_id: 人员ID
        
    Raises:
        ValueError: 人员不存在或有关联项目
    """
    # 检查人员是否存在
    owner = get_owner_by_id(owner_id)
    if not owner:
        raise ValueError(f"人员ID {owner_id} 不存在")
    
    # 检查是否有关联项目
    project_count = get_owner_project_count(owner_id)
    if project_count > 0:
        raise ValueError(f"该人员有 {project_count} 个关联项目，无法删除")
    
    # 删除人员
    owners = get_all_owners()
    owners = [o for o in owners if o.id != owner_id]
    _save_owners(owners)


def get_owner_project_count(owner_id):
    """
    获取人员关联的项目数量
    
    Args:
        owner_id: 人员ID
        
    Returns:
        int: 关联项目数量
    """
    try:
        # 导入项目服务（避免循环导入）
        from services.project_service import get_all_projects
        
        projects = get_all_projects()
        count = sum(1 for p in projects if hasattr(p, 'ownerId') and p.ownerId == owner_id)
        return count
    except Exception:
        # 如果获取失败，返回0（保守策略）
        return 0


def _assign_color(existing_owners):
    """
    为新人员分配颜色
    使用混合策略：前20个使用预定义颜色池，后续使用HSL算法生成
    
    Args:
        existing_owners: 已存在的人员列表
        
    Returns:
        str: HEX格式的颜色
    """
    owner_count = len(existing_owners)
    
    # 前20个使用预定义颜色池
    if owner_count < len(Owner.COLOR_POOL):
        return Owner.COLOR_POOL[owner_count]
    
    # 超过20个使用HSL算法生成
    return Owner.generate_hsl_color(owner_count)


def _save_owners(owners):
    """
    保存人员列表到文件
    
    Args:
        owners: 人员对象列表
    """
    # 确保data目录存在
    os.makedirs('data', exist_ok=True)
    
    # 转换为字典格式
    data = {
        'owners': [owner.to_dict() for owner in owners]
    }
    
    # 写入文件
    write_json_file(OWNERS_FILE, data)


def initialize_owners_file():
    """
    初始化人员数据文件
    如果文件不存在，创建空文件
    """
    if not os.path.exists(OWNERS_FILE):
        os.makedirs('data', exist_ok=True)
        write_json_file(OWNERS_FILE, {'owners': []})
